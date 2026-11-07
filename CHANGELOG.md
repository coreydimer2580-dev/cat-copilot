# Changelog

## Unreleased

- Added local intake, sentence extraction, and review-queue agents for user-selected conversation exports.
- Added best-effort JSON message extraction, source filename/speaker/timestamp provenance, duplicate import protection, and queue export/clear controls.
- Require per-sentence human review before adding imported content to the task board.
- Explicitly documented that workers cannot search accounts, phone storage, OneDrive, or Termux, and do not upload files or run after page close.
