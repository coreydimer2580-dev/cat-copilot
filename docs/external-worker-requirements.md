# C@T Copilot: External Worker Requirements

This document makes the worker capability a product goal while keeping it technically honest and consent-based. A worker is an authorized integration—not a way to bypass another service's access controls, costs, privacy rules, or safety limits.

## Product requirement

C@T Copilot should be able to delegate suitable, user-approved tasks to external worker providers through their official interfaces, report progress, and return proposed results for review. Each provider is optional, separately configured, and visible to the user. Local planning remains available without a provider.

## Acceptance criteria

- Workers run only after the user starts or explicitly schedules a task; no hidden always-on operation is implied.
- A provider must be connected by the account owner through its official API/OAuth flow or a securely configured credential. Never scrape private accounts or ask users to paste secrets into browser storage.
- Show the provider, requested task, data to be shared, permissions, expected usage/cost limits (where available), and approval prompt before sending data.
- Minimize shared context. Exclude secrets, unrelated personal data, and third-party private information by default.
- Require a server-side worker queue for credentials and external calls. Keep provider keys out of client code and logs; support revocation and deletion.
- Workers return drafts/artifacts and status. They do not automatically send messages, spend money, change accounts, deploy code, delete data, or mark consequential work complete without a separate, task-specific approval.
- Provide pause/stop, retry limits, timeout, rate limits, per-provider enable/disable, usage visibility, and an audit log.
- Label model-generated or worker-produced content as proposed output; preserve source references and allow the user to reject or edit it.
- If a provider is unavailable, unaffordable, or disallows a task, explain that and offer a local/manual alternative. Do not bypass those limits.
- Add tests for authorization, scope minimization, approval enforcement, failures, retries, cancellation, and secret redaction before enabling a provider.

## Staged implementation

1. Define a provider-neutral worker interface and task/result schema; test with a mock worker only.
2. Add explicit user controls for selecting a worker, reviewing the exact context, and approving a one-time run.
3. Add a server-side queue with authentication, authorization, encrypted secret storage, limits, and audit events.
4. Integrate one official provider API after choosing a provider and configuring credentials; disclose its current terms, data handling, and cost/quotas.
5. Add additional providers as independent opt-in adapters with the same controls and tests.

## Not a promise of access

This plan does not grant C@T Copilot access to Termux, device storage, OneDrive, email, model accounts, private history, or any internet data. Those require supported connectors and the account owner's authorization. An agent cannot make inaccessible data accessible or make paid/limited services free. The local heuristic worker remains a draft planner until an authorized provider integration is implemented.
