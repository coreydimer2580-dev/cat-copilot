# C@T Copilot

A privacy-first conversation-to-task planner with reviewable sentence capture, local task memory, a project board, and a local companion.

## Run locally

Requires Node.js 18 or newer:

```sh
npm start
```

Open <http://localhost:3000>.

## Turn every sentence in an export into a draft

1. Export/copy conversation text from an account you control and are authorized to use.
2. Paste it into the conversation box or select a `.txt`, `.md`, or `.json` file (maximum 5 MB).
3. Optionally enter a source name, then choose **Draft from every sentence**.
4. Review the sentence drafts and choose **Add task** or **Dismiss** individually.

The importer creates a review draft for every non-empty sentence; it does not decide whether each sentence is a command or fact. Sentence splitting is heuristic, so inspect the original source and correct missed or incorrectly split sentences. Each accepted task keeps its sentence, source label, timestamp, category, role, and priority locally. Existing duplicate task titles are skipped. Only imported text is processed: the app cannot search your account history, Grok history, phone, Termux, OneDrive, or the internet.

## Other features

- Organize tasks by category, suggested helper role, priority, and board stage.
- Track blockers, search/filter tasks, maintain a local timeline, and export JSON.
- Use the basic local chat companion to summarize and search saved tasks.

## Privacy and limitations

Tasks and chat are stored in this browser's local storage. Do not import secrets or another person's private data without permission. No AI provider is connected and imported content is not uploaded. The task helper and chat are local heuristics, not generative AI. They do not execute actions or continue after the browser is closed. Review all extracted sentence tasks and check sensitive legal, insurance, medical, or financial facts independently.
