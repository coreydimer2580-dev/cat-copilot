# C@T Copilot

A privacy-first conversation-to-task planner with reviewable sentence capture, local task memory, and a local companion.

## Run locally

Requires Node.js 18 or newer:

```sh
npm start
```

Open <http://localhost:3000>.

## Local conversation import agents

The planner includes a small, browser-only pipeline for exports you select:

1. **Intake worker** reads selected `.txt`, `.md`, or `.json` files (up to 10 files, 5 MB each).
2. **Sentence worker** extracts messages from common JSON structures when possible and creates a draft for each non-empty sentence.
3. **Review queue** preserves the sentence, filename, speaker label, and available timestamp. Choose **Add task** or **Dismiss** per sentence; adding a task does not claim that its content is true.
4. Export or clear the draft queue at any time.

The JSON parser is best-effort; export schemas differ. Compare results with the original export. Sentence boundaries are heuristic and may split or combine text unexpectedly. The importer accepts files you choose; it does not automatically connect to or search ChatGPT, Grok, OneDrive, phone storage, Termux, or any other account. It does not upload data. Import only accounts and files you control or have permission to use.

## Other features

- Organize tasks by suggested category, role, priority, and board stage.
- Track blockers, search/filter tasks, maintain a local timeline, and export tasks as JSON.
- Use the basic local chat companion to summarize and search saved tasks.

## Privacy and limitations

Tasks, chat, and import drafts are stored in this browser's local storage. Do not import secrets or another person's private data without permission. No AI provider is connected. The local agents use deterministic parsing and heuristics; they do not have model intelligence, execute code, or continue after the page is closed. Review imported content yourself, particularly for legal, medical, financial, or safety matters.
