# ghost-log

See exactly what Claude built in your codebase — and what it changed without asking.

```
npx ghost-log
```

## What it does

Reads your Claude Code session transcripts (stored locally at `~/.claude/projects/`) and produces a markdown audit trail:

- **Session timeline** — every Claude Code session, when it ran, what the first prompt was, and which files it wrote
- **Flagged decisions** — files Claude wrote that weren't mentioned in any prompt that session

```
# Vibe Audit — 2026-05-17

## Session 1 — 12:07 PM (4 file edits)
Prompt: "Build SalesGrind — A Local Study Tracker..."
Files written:
  + /project/salesgrind/index.html
  + /project/salesgrind/DECISIONS.md

## Session 2 — 04:40 PM (28 file edits)
Prompt: "Build a local agentic AI system (Manus replica)..."
Files written:
  + /project/agent/main.py
  ⚠ /project/agent/agent_loop.py    ← not mentioned in prompt
  ⚠ /project/agent/memory/short_term.py

## Flagged Decisions (2)
  ⚠ /project/agent/agent_loop.py
    Prompt was: "Build a local agentic AI system..."
  ⚠ /project/agent/memory/short_term.py
    Prompt was: "Build a local agentic AI system..."

---
2 session(s) | 6 files touched | 2 flagged
```

## Install

No install required — just run it with npx:

```bash
npx ghost-log
```

Or install globally:

```bash
npm install -g vibe-audit
```

## Usage

```bash
# audit the current directory
npx ghost-log

# audit a specific project
npx ghost-log /path/to/your/project
```

## How it works

Claude Code stores all session transcripts as JSONL files at:
```
~/.claude/projects/{project-slug}/*.jsonl
```

Each entry records the type (`user`, `assistant`), timestamp, session ID, and for assistant entries — the tool calls made (which files were written or edited and with what content).

`vibe-audit` reads these files, groups entries by session ID, finds all `Write` and `Edit` tool calls, and checks whether the file's basename appears in any prompt from that session. If not, it's flagged.

## Limitations (v1)

- **False positives on short prompts**: if you said "build it" and Claude created 20 files, all 20 get flagged because none of the filenames appear in "build it". The flag means "Claude made a decision without being told the specific filename" — which is normal for large builds. Use it to spot genuinely unexpected changes, not as a strict policy.
- **No git integration in v1**: works entirely from session transcripts. Git correlation (matching commits to sessions) is planned for v1.1.
- Only `Write` and `Edit` tool calls are tracked. `Bash` commands are logged but not flagged.

## Requirements

- Node.js 18+
- Claude Code (the session data lives at `~/.claude/projects/`)

## License

MIT
