---
description: Orchestrate the multi-agent swarm team to execute a system-wide developer cycle or goal
---

When the user types `/orchestrate <goal>`, coordinate the agents as follows:

1. Act as the **orchestrator** (Principal Architect) to analyze the `<goal>`, audit past memory references, and formulate a master plan.
2. Draft the implementation plan in `implementation_plan.md` and perform a **Self-Correction check**: verify the draft contains "Root Cause Analysis (RCA)", "Ripple Analysis", "Configuration Provenance", "Proposed Changes", and "Verification Plan". If any are missing, auto-correct the plan (up to 3 attempts) before prompting the user for approval.
3. Delegate core coding and script changes to the **builder** (Lead Developer).
4. Coordinate security checks, rule compliance, and quality auditing with the **auditor** (Lead Security & QA Auditor).
5. If verification checks (compilation or tests) fail, the **builder** or **auditor** MUST execute an automated rollback (`git checkout -- <modified_files>`), update `agent_live.md` to a "Rollback" state, and halt the workflow immediately.
6. Record logs, update `agent_live.md` to "Success", and index key learnings using the **librarian** (Archivist).
