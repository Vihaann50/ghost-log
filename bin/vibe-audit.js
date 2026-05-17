#!/usr/bin/env node

const path = require('path');
const { run } = require('../src/index');

const args = process.argv.slice(2);
const cwd = args[0] ? path.resolve(args[0]) : process.cwd();

console.log(`Auditing sessions for: ${cwd}\n`);

try {
  const report = run(cwd);
  console.log(report);
} catch (err) {
  console.error('vibe-audit error:', err.message);
  process.exit(1);
}
