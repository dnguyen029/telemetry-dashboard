---
description: Perform a comprehensive codebase architectural and quality review.
---

When the user types `/review`, coordinate the agents as follows:

1. Act as the **orchestrator** (Principal Architect) to scan the workspace directory and identify the core components, layout, and active stack based on [bootstrap.md](file:///home/dnguyen029/antigravity-project/bootstrap.md).
2. Analyze the high-level architecture and data flows across these components.
3. Coordinate with the **auditor** (Lead Security & QA Auditor) to inspect codebase files and identify:
   - Poor design choices or overly complex structures.
   - Duplicate logic or redundant parts.
   - Code that slows down the application (performance bottlenecks).
   - Parts of the code that will break if more users use the application (scalability risks).
   - Maintenance and code cleanliness issues.
4. Synthesize findings and provide:
   - **Simple Stack Overview**: An easy-to-understand breakdown of how the different parts of the application connect.
   - **Key Problem Areas**: Surfaced issues described in plain, everyday language (e.g., explaining that "duplicate components" means "having multiple versions of the same button which makes making changes twice as hard"). Explain *why* these issues matter (e.g. slow page loads, higher cost to make updates, crash risks).
   - **Plain English Solutions**: Practical strategies to fix the problems without technical jargon.
   - **Improved Code Examples**: Before-and-after code comparisons showing the improvements.
5. Stop and present the review report. Do NOT modify any code files directly, and do NOT draft an implementation plan for execution.
