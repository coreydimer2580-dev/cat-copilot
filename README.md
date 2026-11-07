# C@T Copilot

A small, privacy-first app that turns conversation text into an organized, reviewable task list.

## Run locally

Requires Node.js 18 or newer. From the project directory:

```sh
npm start
```

Open <http://localhost:3000>.

## Features

- Paste conversation text or choose a local `.txt`, `.md`, or `.json` file (up to 5 MB).
- Locally identify task-like sentences and present them as drafts for your approval; suggestions are not saved until you choose **Add task**.
- Categorize tasks, set low/normal/high priority, search, filter by completion, and see progress counts.
- Add, complete, remove, and export tasks as JSON.
- Store task data in this browser's local storage.

## Important privacy and capability limits

This app does **not** access your ChatGPT/Copilot account history, Google AI, other services, private messages, or the internet. It cannot discover everything you have ever said. To include past conversations, export or copy data from accounts you own and are authorized to use, then import that file yourself. The starter app processes the text locally in your browser; it does not upload conversations. Avoid importing other people's private data without their permission.

Task detection is a basic heuristic, not an AI model; review suggestions before relying on them. This version does not execute tasks, modify itself, or perform external actions.
