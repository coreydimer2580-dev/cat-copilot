# C@T Copilot

A privacy-first conversation-to-task planner with reviewable sentence capture, local task memory, a local companion demo, and an auto-terminal that turns one sentence into a classified backlog task.

## Run locally

Requires Node.js 18 or newer:

```sh
npm start
```

Open <http://localhost:3000>.

## Auto Terminal

Enter one sentence describing a task and choose **Build**. The browser-only planner infers a rough intent, assistant role, category, priority, and suggested sequence, then adds a task to the existing backlog and displays a terminal-style log. This is a local heuristic—not a connected AI, shell, compiler, or autonomous code executor. It does not modify source files or run commands. Review the generated task before acting on it.

## Capability pathways

The **Capability Routes** panel maps goals to practical setup steps and tracks checklist progress in this browser. Routes cover user-selected chat exports, OneDrive, Termux, media transcription, a real AI model, an external persistent worker, and grounded personal goal planning. These are pathways and requirements, not completed integrations.

## Local conversation import agents

1. The intake helper reads text/JSON exports you select.
2. The sentence helper creates one draft per non-empty sentence.
3. The review queue keeps source information; choose **Add task** or **Dismiss** per sentence.

JSON extraction and sentence boundaries are best-effort. Compare results with the original. The importer does not search private services, accounts, phone storage, or other devices.

## Project context and privacy

Tasks and app data are stored in this browser's local storage. The auto-terminal uses only the sentence typed into it; it does not automatically ingest the large diagnostic, package, email, financial, or device records shared in the conversation. Do not put passwords, API keys, payment card details, claim identifiers, or another person's private data in task text or public repository files. Keep sensitive or unrelated material out of app memory unless you explicitly add a secure, purpose-built storage feature.

The local companion is not a connected AI model. Imported text should be authorized, and generated classifications are suggestions, not verified facts or completed work.
