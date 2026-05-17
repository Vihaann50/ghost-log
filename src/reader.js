const fs = require('fs');
const path = require('path');
const os = require('os');

function cwdToSlug(cwd) {
  return cwd.replace(/\//g, '-').replace(/ /g, '-');
}

function findProjectDir(cwd) {
  const projectsRoot = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(projectsRoot)) return null;

  const slug = cwdToSlug(cwd);
  const direct = path.join(projectsRoot, slug);
  if (fs.existsSync(direct)) return direct;

  // fallback: find any project dir whose slug ends with the basename of cwd
  const base = cwdToSlug(path.basename(cwd));
  const dirs = fs.readdirSync(projectsRoot);
  const match = dirs.find(d => d.endsWith(base));
  return match ? path.join(projectsRoot, match) : null;
}

function parseSessionFile(filePath, targetCwd) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter(Boolean);
  const entries = [];

  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }

  // filter to entries matching our cwd
  const relevant = entries.filter(e => {
    if (!e.cwd) return true; // no cwd field — include it
    return e.cwd === targetCwd;
  });

  return relevant;
}

function loadSessions(cwd) {
  const projectDir = findProjectDir(cwd);
  if (!projectDir) {
    console.error(`No Claude Code session data found for: ${cwd}`);
    console.error(`Expected: ~/.claude/projects${cwdToSlug(cwd)}/`);
    process.exit(1);
  }

  const files = fs.readdirSync(projectDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => path.join(projectDir, f));

  const allEntries = [];
  for (const file of files) {
    const entries = parseSessionFile(file, cwd);
    allEntries.push(...entries);
  }

  // sort everything by timestamp
  allEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return allEntries;
}

module.exports = { loadSessions };
