# Truth & Reasoning Lab

Open the local workspace at [`/reasoning.html`](../reasoning.html) after starting the app with `npm start`.

## What it does

- Offers four transparent planning lenses: first principles, pros and cons, evidence check, and people-first impact.
- Creates a local, reviewable planning outline from user-entered text. It is a heuristic template, not an AI model or a verified answer.
- Lets the user save claims with an optional source and a status: unknown/not checked, reported, supported by cited evidence, or disputed.
- Lets the user maintain a locally stored glossary of terms in their own words, with remove controls.
- Calls out requests that appear to ask for safeguard evasion and suggests legitimate nearby directions, such as an authorized test environment or a toy example.

## Honesty and limits

The page does not connect to other AI services, fetch web sources, train a model, establish that a claim is true, or execute tasks. A source entered by the user is a record of what they provided, not an independent verification. Glossary entries are user preferences stored in this browser, not model training data.

When a method is unavailable or unsafe, the product principle is to state that plainly and help reformulate the underlying goal toward a safe, authorized outcome—not to conceal or route around the restriction.

## Data handling

Truth notes and glossary terms are stored in this browser's `localStorage`. They are not encrypted by this page and do not sync across devices. Do not enter credentials, payment details, personal claim records, or other sensitive material. Clearing browser data may remove these entries.
