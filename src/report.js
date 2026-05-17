function formatTime(ts) {
  if (!ts) return 'unknown';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function truncate(text, max) {
  if (!text) return '(no prompt)';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '...' : clean;
}

function generateReport(sessions, date) {
  const lines = [];
  const reportDate = date || new Date().toISOString().slice(0, 10);

  lines.push(`# Vibe Audit — ${reportDate}`);
  lines.push('');

  if (sessions.length === 0) {
    lines.push('No sessions found for this project.');
    return lines.join('\n');
  }

  let totalFlagged = 0;

  sessions.forEach((session, i) => {
    const time = formatTime(session.startTime);
    const callCount = session.toolCalls.length;
    const promptText = session.firstPrompt ? truncate(session.firstPrompt.text, 120) : '(no prompt)';

    lines.push(`## Session ${i + 1} — ${time} (${callCount} file edits)`);
    lines.push(`Prompt: "${promptText}"`);

    if (session.filesWritten.length === 0) {
      lines.push('No files written.');
    } else {
      lines.push('Files written:');
      for (const f of session.filesWritten) {
        const wasFlagged = session.flaggedCalls.some(c => c.filePath === f);
        lines.push(`  ${wasFlagged ? '⚠' : '+'} ${f}`);
      }
    }

    lines.push('');
    totalFlagged += session.flaggedCalls.length;
  });

  // flagged decisions section
  const allFlagged = sessions.flatMap(s => s.flaggedCalls);
  if (allFlagged.length > 0) {
    lines.push(`## Flagged Decisions (${allFlagged.length})`);
    lines.push('These files were written without being mentioned in the preceding prompt.');
    lines.push('');

    for (const call of allFlagged) {
      const promptText = call.prompt ? truncate(call.prompt.text, 100) : '(no preceding prompt)';
      lines.push(`  ⚠ ${call.filePath}`);
      lines.push(`    Prompt was: "${promptText}"`);
    }
    lines.push('');
  } else {
    lines.push('## Flagged Decisions (0)');
    lines.push('All file writes were mentioned in the preceding prompt.');
    lines.push('');
  }

  lines.push(`---`);
  lines.push(`${sessions.length} session(s) | ${sessions.flatMap(s => s.filesWritten).length} files touched | ${totalFlagged} flagged`);

  return lines.join('\n');
}

module.exports = { generateReport };
