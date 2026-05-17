const path = require('path');

function extractToolCalls(entry) {
  if (entry.type !== 'assistant') return [];
  const content = entry.message && entry.message.content;
  if (!Array.isArray(content)) return [];

  return content
    .filter(b => b.type === 'tool_use' && (b.name === 'Write' || b.name === 'Edit'))
    .map(b => ({
      tool: b.name,
      filePath: b.input && b.input.file_path,
      timestamp: entry.timestamp,
      sessionId: entry.sessionId,
    }))
    .filter(c => c.filePath);
}

function extractUserText(entry) {
  if (entry.type !== 'user') return null;
  const msg = entry.message;
  if (!msg) return null;
  if (typeof msg.content === 'string') return msg.content;
  if (Array.isArray(msg.content)) {
    return msg.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join(' ');
  }
  return null;
}

function groupIntoSessions(entries) {
  const sessionMap = new Map();

  for (const entry of entries) {
    const sid = entry.sessionId;
    if (!sid) continue;

    if (!sessionMap.has(sid)) {
      sessionMap.set(sid, {
        sessionId: sid,
        startTime: entry.timestamp,
        prompts: [],
        toolCalls: [],
      });
    }

    const session = sessionMap.get(sid);

    const userText = extractUserText(entry);
    if (userText) {
      session.prompts.push({ text: userText, timestamp: entry.timestamp });
    }

    const calls = extractToolCalls(entry);
    session.toolCalls.push(...calls);
  }

  return Array.from(sessionMap.values())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
}

function isFileMentionedInAnyPrompt(filePath, prompts) {
  if (!prompts || prompts.length === 0) return false;
  const basename = path.basename(filePath);
  // skip very short basenames that produce false positives (index.html, main.py)
  const skip = new Set(['index.html', 'index.js', 'main.py', 'main.js', 'app.py', 'app.js', 'README.md', 'DECISIONS.md', 'IDEAS.md', 'requirements.txt', 'package.json']);
  if (skip.has(basename)) return true;
  return prompts.some(p => p.text && (p.text.includes(basename) || p.text.includes(filePath)));
}

function isInsideProject(filePath, cwd) {
  return filePath.startsWith(cwd);
}

function annotateSessions(sessions, cwd) {
  return sessions.map(session => {
    const annotatedCalls = session.toolCalls.map(call => {
      // only flag files inside the project directory
      if (!isInsideProject(call.filePath, cwd)) {
        return { ...call, prompt: null, flagged: false };
      }
      const mentioned = isFileMentionedInAnyPrompt(call.filePath, session.prompts);
      return { ...call, prompt: session.prompts[0] || null, flagged: !mentioned };
    });

    // dedupe file paths for the "files written" list
    const filesWritten = [...new Set(annotatedCalls.map(c => c.filePath))];
    const flagged = annotatedCalls.filter(c => c.flagged);

    return {
      ...session,
      toolCalls: annotatedCalls,
      filesWritten,
      flaggedCalls: flagged,
      firstPrompt: session.prompts[0] || null,
    };
  });
}

module.exports = { groupIntoSessions, annotateSessions };
