# C@T Copilot

A privacy-first conversation-to-task planner with reviewable sentence capture, local task memory, and a local companion.

## Run locally

Requires Node.js 18 or newer:

```sh
npm start
```

Open <http://localhost:3000>.

## Capability pathways

The **Capability Routes** panel maps goals to practical setup steps and tracks checklist progress in this browser. It distinguishes what can be done now from capabilities requiring an authorized connector or a separate worker. Each route can add its next step to the local task list.

Routes cover user-selected chat exports, OneDrive, Termux, media transcription, a real AI model, an external persistent worker, and grounded personal goal planning. These are pathways and requirements, not claims that integrations are connected. Account access needs official authorization, least-privilege scopes, and user-controlled consent. External workers must run in an environment you control with logs and stop controls. Sensitive or irreversible actions require human approval.

## Local conversation import agents

1. The intake helper reads text/JSON exports you select.
2. The sentence helper creates one draft per non-empty sentence.
3. The review queue keeps source information; choose **Add task** or **Dismiss** per sentence.

JSON extraction and sentence boundaries are best-effort. Compare results with the original. The importer does not search ChatGPT, Grok, OneDrive, Termux, phone storage, or other accounts, and does not upload content.

## Privacy and limitations

Tasks, chat, pathway progress, and import drafts are stored in this browser's local storage. Do not import secrets or another person's private data without permission. The local companion is not generative AI. No provider, OneDrive, or persistent worker is connected by default. Import only files you control or are authorized to use. Review outputs and check sensitive facts independently.
