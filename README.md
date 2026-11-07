# C@T Copilot

A small, privacy-first app that turns conversation text into a reviewable task list.

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
- Track task stage on a project board: backlog, in progress, waiting, or done.
- Keep a memory timeline of the most recent tasks and the source they came from.
- Change task role and priority, group by category and role, search, filter by completion, and export tasks as JSON.
- Store task data in this browser's local storage.

## Privacy and capability limits

This app does **not** access your ChatGPT/Copilot account history, Google AI, Grok, other services, private messages, or the internet. It cannot run after this browser/session closes. Import only exports and records you are authorized to use. Imported text and task data remain in this browser; this app currently sends nothing to an AI provider.

Assistant roles are local planning labels, not model integrations. No AI providers are connected, no API keys are handled, and no tasks are automatically sent to a service. Future provider integrations should use official APIs, server-side secrets, transparent cost/usage controls, and user approval before sharing sensitive data or taking external actions. Local processing avoids provider API calls but still uses your device and electricity.

Task detection is a basic heuristic, not an AI model; it can miss sentences or misinterpret context. Review suggestions and check facts, especially for legal, insurance, medical, or financial matters. Do not import other people's private data without permission.
