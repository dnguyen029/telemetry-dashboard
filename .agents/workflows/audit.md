---
description: Perform a security hardening and QA compliance audit on code modifications
---

When the user types `/audit`, coordinate the agents as follows:

1. Act as the **auditor** (Lead Security & QA Auditor) to review code diffs, verify safety constraints, and enforce compliance rules.
2. Execute automated compliance checks and verify that the security guidelines in `GUARDRAILS.md` are strictly followed.
3. Act as the **admin** (SRE) to execute test runs, verify code compilation, and log output.
4. Perform **Drift & Trajectory Forensics**: Check for corrupted trajectory files (`.pb`) and analyze `transcript.jsonl` for signatures of infinite runaway loops or context amnesia.
5. Coordinate with the **librarian** to archive verification results.
