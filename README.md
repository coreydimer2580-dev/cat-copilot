# C@T Copilot

A small, privacy-first app that turns conversation text into a reviewable task list and memory-based project board.

## Run locally

Requires Node.js 18 or newer. From the project directory:

```sh
npm start
```

Open <http://localhost:3000>.

## Features

- Paste conversation text or choose a local `.txt`, `.md`, or `.json` file (up to 5 MB).
- Locally identify task-like sentences and present them as drafts for your approval; suggestions are not saved until you choose **Add task**.
- Automatically suggest a task category, priority, and assistant role: human review, local/private work, coding, research, writing, or general assistance.
- Track each task with a stage: backlog, in progress, waiting, or done.
- Assign blocker states such as waiting for approval, evidence, input, or blocked.
- Use a project board and keep a memory timeline of recent tasks and source activity.
- Chat with a basic local companion that can summarize and search the browser's saved task list. Optional browser speech input and spoken replies are user-initiated.
- Change task role and priority, group by category and role, search, filter by completion, and export tasks as JSON.
- Store task and chat data in this browser's local storage.

## Privacy and capability limits

The chat companion uses simple local rules. It is not a generative AI model and will not produce unrestricted, human-level replies. It does not contact ChatGPT, Google AI, Grok, or any other provider. Chat and task data remain in this browser. Browser speech recognition may use browser/platform services depending on your browser; microphone access is requested only when you press the microphone button. Spoken replies are off unless you enable the checkbox.

This app does **not** access your account history, private messages, or the internet. It cannot run after this browser/session closes. Import only exports and records you are authorized to use. Assistant role labels are planning helpers, not model integrations. Future provider integrations should use official APIs, server-side secrets, transparent cost/usage controls, and user approval before sharing sensitive data or taking external actions.

Task detection is a basic heuristic, not an AI model; it can miss sentences or misinterpret context. Review suggestions and check facts, especially for legal, insurance, medical, or financial matters. Do not import other people's private data without permission.
