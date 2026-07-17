---
description: Run the standard Antigravity 2.0 multi-agent developer lifecycle sequence
---

When the user types `/startcycle <goal>`, coordinate the swarm agents in the following sequence:

1. **orchestrator** (Product Manager):
   - Analyze the feature request and conduct research.
   - Author a complete `Technical_Specification.md` and `implementation_plan.md` in `production_artifacts/`.
   - Halt execution and wait for human review and approval.

2. **builder** (Full-Stack Engineer):
   - Consume the approved spec and implement the code changes.
   - Restrict all modifications and file creations to the `app_build/` directory.
   - Fix syntax and correct compile errors.

3. **auditor** (QA Engineer):
   - Perform security auditing and syntax verification on the modified code in `app_build/`.
   - Ensure secrets are not committed and verify that quality standards are met.
   - Prohibited from writing feature code.

4. **sre** (DevOps Master):
   - Detect the runtime environment and manage configuration files.
   - Run tests and execute commands to build and deploy the application.
