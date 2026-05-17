const { loadSessions } = require('./reader');
const { groupIntoSessions, annotateSessions } = require('./correlate');
const { generateReport } = require('./report');

function run(cwd) {
  const entries = loadSessions(cwd);
  const grouped = groupIntoSessions(entries);
  const annotated = annotateSessions(grouped, cwd);
  const report = generateReport(annotated);
  return report;
}

module.exports = { run };
