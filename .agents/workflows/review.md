---
description: Perform a comprehensive codebase architectural and quality review.
---

When the user types `/review`, coordinate the agents as follows:

1. Act as the **orchestrator** (Principal Architect) to scan the workspace directory and identify the core components, layout, and active stack based on [bootstrap.md](file:///home/dnguyen029/antigravity-project/bootstrap.md).
2. Analyze the high-level architecture and data flows across these components.
3. Coordinate with the **auditor** (Lead Security & QA Auditor) to inspect codebase files and identify:
   - Bad architectural decisions or anti-patterns.
   - Duplicate logic or redundant components.
   - Performance bottlenecks.
   - Scalability risks.
   - Maintainability and code hygiene issues.
4. Synthesize findings and provide:
   - A clean architecture breakdown.
   - Critical problem areas.
   - Concrete refactoring strategies.
   - Improved production-grade code examples (without changing existing functionality).
5. Stop and present the review report. Do NOT modify any code files directly, and do NOT draft an implementation plan for execution.
