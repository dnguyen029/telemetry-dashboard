---
trigger: always_on
description: Swarm safety constraints, cost bounds, and destructive command blocks.
---

# 🛡️ Swarm Safety Guardrails

This document establishes the mandatory safety constraints and execution boundaries for all agents operating in this
workspace.

*Back to **[Workspace Dashboard](file:///home/dnguyen029/antigravity-project/.agents/docs/dashboard.md)***

---

## 🕒 1. Runaway Loop & Cost Prevention (Cost Guardrail)

* **Rule**: If any tool, script, or command fails **3 times in a row**, you MUST immediately stop, halt all loops, and
  escalate to the user.
* **Instruction**: Do not attempt to retry or troubleshoot endlessly. Explain the error in simple terms and wait for
  instructions.

## 🗑️ 2. Destructive Actions Blockade (Data Loss Guardrail)

* **Rule**: You are strictly prohibited from executing commands that perform destructive file or database operations
  without explicit user confirmation.
* **Blocked Actions**:
  * Deleting code files or project folders (`rm -rf` outside temp directories).
  * Hard resetting git history (`git reset --hard` or force-pushes).
  * Dropping database tables or deleting rows in production tables without verification.

## 🔑 3. Credentials & Secrets Isolation (Security Guardrail)

* **Rule**: Never hardcode API keys, passwords, bearer tokens, or database access strings in any file, script, or
  commit.
* **Instruction**: Load all configurations dynamically from environment variables (sourcing from `.env`). Never add
  `.env` or other key files to Git staging.

## 📦 4. Dependency & Bloat Control (Environment Hygiene)

* **Rule**: Do not install new third-party packages, libraries, or global system dependencies (e.g. `pip install`,
  `npm install`) without first asking the user for authorization.
* **Instruction**: Leverage existing utilities and native modules to keep the workspace clean and lightweight.

## 💡 5. Visionary Intent & Simplification

* **Rule**: Focus on the user's ultimate goal rather than the literal steps they suggest.
* **Instruction**: If the user proposes a 3-step technical path (e.g., do X, Y, Z), but a simpler, more standard, or
  more reliable 2-step solution exists, you MUST proactively inform the user and recommend the simpler alternative.

## 🏛️ 6. Mandatory Database Search & Plan Approval Gate

* **Rule**: All agents must check Supabase before planning or writing any code, and must halt execution
  to wait for plan approval.
* **Instruction**:
  * **Memory Audit**: You must perform read/query searches against Supabase database memories to locate
    lessons learned, design standards, and context files before drafting plans or writing code. If the database memory audit fails, you MUST stop and escalate to the user instead of pivoting to local files or guessing (Zero Inference constraint).
  * **Approval Gate**: You must write an `implementation_plan.md` plan and halt execution to await user approval. The plan MUST contain valid sections for **Root Cause Analysis (RCA)**, **Ripple Analysis (Downstream Impacts)**, **Configuration Provenance**, **Proposed Changes**, and a **Verification Plan**. No direct code edits or command execution is permitted until the user explicitly approves the plan.

## 🏛️ 7. Quota Optimization & Batching

* **Rule**: All agents must minimize token usage and quota consumption by avoiding redundant scans and batching tool
  operations.
* **Instruction**:
  * **Broad Scans Blocked**: You are prohibited from running recursive workspace directory listings (`list_dir`) or
    broad wildcard searches (`grep_search` with no specific targets) over the workspace root.
  * **Targeted Operations**: Focus all tool executions only on the files explicitly specified in the approved
    implementation plan.
  * **Batching Work**: Combine edits into a single turn invocation (e.g. using `multi_replace_file_content`) and
    aggregate queries to minimize overall API turns.

## 🏛️ 8. Zero Sycophancy & Zero Inference

* **Rule**: All agents must maintain complete objectivity and operate strictly on verified parameters and facts without
  guessing.
* **Instruction**:
  * **Objective Truth**: Correct the user immediately and neutrally if they propose unsound technical designs,
    illogical paths, or violate instructions. Do not write sycophantic approvals.
  * **Explicit Inputs Only**: Stop and ask for clarification if parameters, files, or requirements are ambiguous or
    unspecified. Do not infer or guess intent. Pivoting to assumptions or alternate inference methods when memory tool access fails is strictly prohibited.

## 🏛️ 9. MCP Configuration Lock & Boundary Protection

* **Rule**: All `mcp_config.json` files (local workspace, global IDE, global Desktop, and shared global configs) are strictly locked. Under no circumstances may an agent modify, delete, or overwrite any MCP configuration file automatically or silently.
* **Instruction**:
  * **Explicit Authorization Required**: Any modification to any `mcp_config.json` configuration file MUST be explicitly requested by the user in the active prompt. Proposing automated or silent patches to these files during other tasks is strictly prohibited.
  * **Boundary Protection**:
    * If running in **Antigravity IDE 2.0**, you MUST NOT edit Desktop configuration (`~/.gemini/antigravity/mcp_config.json`).
    * If running in **Antigravity Desktop**, you MUST NOT edit IDE configuration (`~/.gemini/antigravity-ide/mcp_config.json`).
    * Modifications to shared global configs (`~/.gemini/config/mcp_config.json`) and backups are blocked unless explicitly authorized by the user.

## 🏛️ 10. Artifact Isolation & Path Safety (File Write Guardrail)

* **Rule**: You are strictly prohibited from writing or generating session artifacts (`implementation_plan.md`,
  `task.md`, or `walkthrough.md`) directly in the workspace root directory `/home/dnguyen029/antigravity-project/`.
* **Instruction**: All session and planning artifacts MUST be written specifically under the active conversation
  directory within the brain path (e.g. `/home/dnguyen029/.gemini/antigravity-ide/brain/<conversation-id>/`).

## 🏛️ 11. Payload Size Constraints & Token Hygiene (Token Truncation Guardrail)

* **Rule**: You must actively prevent context truncation and checkpoint token limit errors by limiting the size of tool output payloads and keeping active context clean.
* **Instruction**:
  * **Pre-flight File Check**: Before calling `view_file` on any file, you MUST verify its size using metadata or directory listings. If the file is larger than **50 KB** or **1,000 lines**, do NOT read it in its entirety.
  * **Mandatory Pagination**: For files exceeding 50 KB, you MUST read them in chunks of at most **100 lines** at a time using the `StartLine` and `EndLine` parameters.
  * **Diagnostic & Log Ingestion**: When reviewing large logs or diagnostics output, you MUST NOT load raw log dumps into context. Run a `grep_search` targeted at specific error signatures (e.g., `ERROR`, `Exception`, `Timeout`, `Fail`) first, then only read the line numbers returned.
  * **Ceiling Limit**: Keep single-turn responses and tool outputs well under the 1,920-token checkpoint ceiling. Avoid returning full database dumps and restrict broad wildcard searches.

## 🏛️ 12. 2026 Exa Web Search Guardrail (API Schema Freshness)

* **Rule**: All agents MUST perform an Exa web search (`web_search_exa` or `web_search_advanced_exa`) when working with external APIs, SDK libraries, or cloud integrations whose specs may have evolved in 2026. Relying on stale pre-2026 model training weights is prohibited. If Exa is unavailable, fails, or returns unusable information, agents MUST utilize Google web search tools (`search_web`) as a fallback.
* **Instruction**: Incorporate `2026` into the query string to retrieve active documentation, preventing deprecation issues or schema validation errors.
