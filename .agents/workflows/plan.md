---
description: Draft a detailed project execution roadmap and implementation plan
---

When the user types `/plan <feature>`, coordinate the agents as follows:

1. Act as the **orchestrator** to research the workspace, dependencies, and requirements.
2. Outline proposed modifications, file additions, and refactoring targets.
3. Design a verification strategy with automated test suites and manual validation checklist details.
4. Perform a **Self-Correction check** on the draft plan: verify it documents "Root Cause Analysis (RCA)", "Proposed Changes", and "Verification Plan". Rewrite the plan (up to 3 attempts) if any sections are missing.
5. Draft the final implementation plan, halt execution, and wait for approval.
