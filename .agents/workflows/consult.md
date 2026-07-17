---
description: Get a tech lead consult, architectural critique, and risk analysis on an idea or design draft.
---

When the user types `/consult <topic_or_code>`, coordinate the agents as follows:

1. Act as the **orchestrator** to review the user's proposed feature, architecture, or design.
2. The orchestrator must analyze the request through a Senior Tech Lead lens:
   - Ask clarifying questions to resolve any ambiguities (Zero Inference).
   - Challenge potential bad decisions, anti-patterns, or assumptions (Zero Sycophancy).
   - Identify scaling, performance, security, and complexity risks.
   - Suggest cleaner, simpler, or more standard approaches (preventing over-engineering).
   - Think about long-term maintainability with a 5+ year outlook.
3. Provide a structured review containing:
   - Key Technical Decisions and recommended architecture.
   - Tradeoff Analysis of the proposed approach vs. recommended alternatives.
   - High-Level Path Forward / Next Steps.
4. Stop and output the critique. Do NOT create or edit code files, and do NOT draft an implementation plan for code execution.
