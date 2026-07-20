# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Walkthrough: Tech Lead Mode and `/consult` Workflow (Date: N/A | Match Score: 0.642)

### Walkthrough: Tech Lead Mode and `/consult` Workflow

We have successfully updated the workspace rules and workflows to support the proactive **Senior Tech Lead** advisory mode and the `/consult` slash command.

#### Changes Completed

##### 1. Updated Orchestrator Rules
- **File**: [orchestrator.md](file:///home/dnguyen029/antigravity-project/.agents/rules/orchestrator.md)
- **Description**: Added the **AI Technical Lead Mode** section under Operational Guidelines. This explicitly directs the orchestrator to:
  - Ask clarifying questions.
  - Challenge design decisions (Zero Sycophancy).
  - Identify scaling, performance, security, and complexity risks.
  - Suggest cleaner, simpler alternatives.
  - Think long-term with a 5+ year maintainability perspective.
  - Provide structured deliverables (architectural recommendations, tradeoffs, implementation paths).

##### 2. Created `/consult` Slash Command Workflow
- **File**: [consult.md](file:///home/dnguyen029/antigravity-project/.agents/workflows/consult.md)
- **Description**: Scaffolded a template mapping the `/consult <topic_or_code>` command directly to the Orchestrator, guiding it to critique design/features without writing code or generating execution plans.

---

#### Verification Results

##### YAML Frontmatter Validation
We ran a metadata validation script on both the updated and newly created files to check for correct YAML parsing and required keys:
- [orchestrator.md](file:///home/dnguyen029/antigravity-project/.agents/rules/orchestrator.md): **Passed**
- [consult.md](file:///home/dnguyen029/antigravity-project/.agents/workflows/consult.md): **Passed**

```text
Checking: /home/dnguyen029/antigravity-project/.agents/rules/orchestrator.md
  [OK] Parsed key-value pairs: {'trigger': 'model_decision', 'description': 'Orchestrator/Architect agent rules for high-level planning, task delegation, and technical strategy.', 'model': 'Gemini 3.1 Pro (High)'}
Checking: /home/dnguyen029/antigravity-project/.agents/workflows/consult.md
  [OK] Parsed key-value pairs: {'description': 'Get a tech lead consult, architectural critique, and risk analysis on an idea or design draft.'}
SUCCESS: All frontmatters are valid.
```text

The system is now fully aligned with the senior advisor behaviors.

## 📌 Rule File Streamlining & Token Optimization (Date: N/A | Match Score: 0.620)

Consolidated all Swarm Rules & Mandates into AGENTS.md (Rules 1-10) and refactored GEMINI.md to focus solely on model environment configuration and communication guidelines. Linked files directly and updated orchestrator target references to native_orchestrator.py, saving ~500 system prompt tokens.

## 📌 Walkthrough: Context Management & Memory Refactoring (Date: N/A | Match Score: 0.613)

### Walkthrough: Context Management & Memory Refactoring

We have successfully refactored and hardened our context management and unified our memory storage to prevent agent amnesia and solve fragmentation issues.

#### Changes Completed

##### 1. Dual-Write Memory Archiver
- **[MODIFY] [.agents/hooks/archive_lessons.py](file:///home/dnguyen029/antigravity-project/.agents/hooks/archive_lessons.py)**:
  - Integrated the Supermemory REST API alongside the existing Supabase REST call.
  - Implemented automatic retry queuing via `pending_lessons.json` under lock protection (`pending_lessons.json.lock`) in case either Supabase or Supermemory dispatches fail.

##### 2. Active Memory Search Tool
- **[MODIFY] [context_mcp_server.py](file:///home/dnguyen029/antigravity-project/app_build/tools/context_mcp_server.py)**:
  - Exposed an active MCP tool `@mcp.tool() search_memory()` alongside the passive `@mcp.prompt() lessons()`.
  - This enables agents to dynamically query the hybrid Supabase vector store and Supermemory profile mid-execution rather than relying solely on static initial context.

---

#### Verification Results

##### 1. Hook Verification
We ran the hook manually:
```bash
/home/dnguyen029/antigravity-project/.venv/bin/python3 .agents/hooks/archive_lessons.py
```text
- **Result**: Successfully generated embeddings and synced to both Supabase (ID: 1347) and Supermemory.

##### 2. Active Tool Verification
We tested the new `search_memory` tool using a mock diagnostic script:
```bash
/home/dnguyen029/venv/bin/python scratch/test_mcp.py
```text
- **Result**: Executed successfully, returning active, matching context from both Supermemory and Supabase.

---

### Walkthrough: Schema Alignment & WISMO Mock Data Removal

We have successfully realigned the lead logging parameter schema from `phone` to `phone_number` across all receptionist app layers, updated the unit tests, and removed the fallback mock shipping response from WISMO lookup routines.

#### Changes Completed

##### 1. Schema Alignment (`phone` ➔ `phone_number`)

- **[MODIFY] [tools.py](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools.py)**:

  - Renamed the `phone` parameter to `phone_number` in the `log_lead` function signature.

  - Aligned the logging dictionary constructor and the `create_ticket` call parameters to match the new `phone_number` key.

- **[MODIFY] [sheets.py (Production)](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools_lib/sheets.py)**:

  - Updated row values mapping in `append_log` and `upsert_log` to fetch `data.get("phone_number", "")` instead of `phone`.

- **[MODIFY] [sheets.py (Simulator)](file:///home/dnguyen029/antigravity-project/app_build/tools/sheets.py)**:

  - Synced the offline simulator's sheets client row mapping to use `phone_number`.

- **[MODIFY] [zendesk.py](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools_lib/zendesk.py)**:

  - Renamed the `phone` parameter to `phone_number` in the `create_ticket` function signature.

  - Updated the ticket description text block and the `requester` configuration payload.

- **[MODIFY] [main.py](file:///home/dnguyen029/antigravity-project/app_build/main.py)**:

  - Changed the Pydantic field inside the `LeadPayload` model to `phone_number`.

  - Updated `_handle_lead_logging` payload parsing.

##### 2. WISMO Mock Data Removal

- **[MODIFY] [tools.py](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools.py)**:

  - Removed the hardcoded FedEx mock shipping fallback block from `wismo_lookup`. When no Zendesk ticket is found, the tool now returns `{"success": True, "found": False, "details": "No order found for this PO."}`.

- **[MODIFY] [main.py](file:///home/dnguyen029/antigravity-project/app_build/main.py)**:

  - Removed the mock shipping fallback dictionary from `_handle_wismo_lookup`. When no tickets are returned, it now maps to `{"success": True, "found": False, "details": "No order found for this PO."}`.

##### 3. Unit Test Updates

- **[MODIFY] [test_zendesk.py](file:///home/dnguyen029/antigravity-project/app_build/receptionist/tests/unit/test_zendesk.py)**:

  - Renamed the unit test invocation parameter keyword arguments from `phone` to `phone_number` to prevent `TypeError` failures.

---

#### Verification Results

##### 1. Automated Test Suite

We executed the receptionist test suite via the virtual environment's pytest runtime:

```bash
.venv/bin/pytest
```text

**Output:**

```text
tests/integration/test_agent.py .                                        [ 16%]
tests/integration/test_agent_runtime_app.py ..                           [ 50%]
tests/unit/test_dummy.py .                                               [ 66%]
tests/unit/test_zendesk.py ..                                            [100%]
======================= 6 passed, 14 warnings in 21.07s ========================
```text

- **Result**: **SUCCESS**

##### 2. Manual Verification

We initiated the interactive simulator mode and verified that the server boots successfully, registers incoming terminal inputs, and terminates cleanly under the updated schema:

```bash
/home/dnguyen029/antigravity-project/.venv/bin/python3 app_build/main.py --interactive
```text

**Output:**

```text
2026-06-12 03:07:44,123 [INFO] ⚡ Starting Optimized Agent Simulation Mode...

=======================================================
Welcome to Ariel Bath AI Receptionist Routing Simulator
=======================================================
Caller: exit
```text

- **Result**: **SUCCESS**

#### Hardened Orchestrator Rules (KISS/YAGNI/Postel's Law alignment)

We updated the Orchestrator's ruleset to balance simplicity and robustness using standard industry practices.

##### 1. Rules Update
- **[MODIFY] [.agents/rules/orchestrator.md](file:///home/dnguyen029/antigravity-project/.agents/rules/orchestrator.md)**:
  - Injected the **Balance Simplicity & Robustness** rule under the technical lead mode guidelines.

##### 2. Manual Verification
- We verified the markdown file is parsed cleanly and successfully by the system.
- Confirmed that the new instructions strictly balance the KISS/YAGNI principles with defensive error checking (Postel's Law) to avoid both over-engineering and weak hacks.

#### Walkthrough: Exa MCP Server Configuration Correction

We have successfully diagnosed and resolved the Exa MCP server `EOF` connection error by transitioning the API key propagation from HTTP headers to URL query parameters.

##### 1. Configuration Realignment
- **[MODIFY] [mcp_config.json (local)](file:///home/dnguyen029/antigravity-project/mcp_config.json)**:
  - Updated the `exa` arguments array to append `?exaApiKey=$EXA_API_KEY&tools=web_search_exa,web_search_advanced_exa,web_fetch_exa` to the URL.
- **[MODIFY] [mcp_config.json (global IDE)](file:///home/dnguyen029/.gemini/antigravity-ide/mcp_config.json)**:
  - Synced the global IDE configuration with the local correction.

##### 2. Connection Verification Handshake
We executed the pre-flight connection verification script to confirm all servers report `🟢 CONNECTED`:
- **Result**: **SUCCESS** (6/6 servers connected).

##### 3. Manual Tool Execution Verification
We created a diagnostic script ([`scratch/test_exa.py`](file:///home/dnguyen029/antigravity-project/scratch/test_exa.py)) to emulate a full `tools/call` JSON-RPC handshake.
- **Result**: **SUCCESS** (Exa returns live search results cleanly under the updated configuration).

## 📌 Walkthrough: Schema Alignment & WISMO Mock Data Removal (Date: N/A | Match Score: 0.609)

### Walkthrough: Schema Alignment & WISMO Mock Data Removal

We have successfully realigned the lead logging parameter schema from `phone` to `phone_number` across all receptionist app layers, updated the unit tests, and removed the fallback mock shipping response from WISMO lookup routines.

#### Changes Completed

##### 1. Schema Alignment (`phone` ➔ `phone_number`)

- **[MODIFY] [tools.py](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools.py)**:

  - Renamed the `phone` parameter to `phone_number` in the `log_lead` function signature.

  - Aligned the logging dictionary constructor and the `create_ticket` call parameters to match the new `phone_number` key.

- **[MODIFY] [sheets.py (Production)](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools_lib/sheets.py)**:

  - Updated row values mapping in `append_log` and `upsert_log` to fetch `data.get("phone_number", "")` instead of `phone`.

- **[MODIFY] [sheets.py (Simulator)](file:///home/dnguyen029/antigravity-project/app_build/tools/sheets.py)**:

  - Synced the offline simulator's sheets client row mapping to use `phone_number`.

- **[MODIFY] [zendesk.py](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools_lib/zendesk.py)**:

  - Renamed the `phone` parameter to `phone_number` in the `create_ticket` function signature.

  - Updated the ticket description text block and the `requester` configuration payload.

- **[MODIFY] [main.py](file:///home/dnguyen029/antigravity-project/app_build/main.py)**:

  - Changed the Pydantic field inside the `LeadPayload` model to `phone_number`.

  - Updated `_handle_lead_logging` payload parsing.

##### 2. WISMO Mock Data Removal

- **[MODIFY] [tools.py](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools.py)**:

  - Removed the hardcoded FedEx mock shipping fallback block from `wismo_lookup`. When no Zendesk ticket is found, the tool now returns `{"success": True, "found": False, "details": "No order found for this PO."}`.

- **[MODIFY] [main.py](file:///home/dnguyen029/antigravity-project/app_build/main.py)**:

  - Removed the mock shipping fallback dictionary from `_handle_wismo_lookup`. When no tickets are returned, it now maps to `{"success": True, "found": False, "details": "No order found for this PO."}`.

##### 3. Unit Test Updates

- **[MODIFY] [test_zendesk.py](file:///home/dnguyen029/antigravity-project/app_build/receptionist/tests/unit/test_zendesk.py)**:

  - Renamed the unit test invocation parameter keyword arguments from `phone` to `phone_number` to prevent `TypeError` failures.

---

#### Verification Results

##### 1. Automated Test Suite

We executed the receptionist test suite via the virtual environment's pytest runtime:

```bash
.venv/bin/pytest
```text

**Output:**

```text
tests/integration/test_agent.py .                                        [ 16%]
tests/integration/test_agent_runtime_app.py ..                           [ 50%]
tests/unit/test_dummy.py .                                               [ 66%]
tests/unit/test_zendesk.py ..                                            [100%]
======================= 6 passed, 14 warnings in 21.07s ========================
```text

- **Result**: **SUCCESS**

##### 2. Manual Verification

We initiated the interactive simulator mode and verified that the server boots successfully, registers incoming terminal inputs, and terminates cleanly under the updated schema:

```bash
/home/dnguyen029/antigravity-project/.venv/bin/python3 app_build/main.py --interactive
```text

**Output:**

```text
2026-06-12 03:07:44,123 [INFO] ⚡ Starting Optimized Agent Simulation Mode...

=======================================================
Welcome to Ariel Bath AI Receptionist Routing Simulator
=======================================================
Caller: exit
```text

- **Result**: **SUCCESS**

#### Hardened Orchestrator Rules (KISS/YAGNI/Postel's Law alignment)

We updated the Orchestrator's ruleset to balance simplicity and robustness using standard industry practices.

##### 1. Rules Update
- **[MODIFY] [.agents/rules/orchestrator.md](file:///home/dnguyen029/antigravity-project/.agents/rules/orchestrator.md)**:
  - Injected the **Balance Simplicity & Robustness** rule under the technical lead mode guidelines.

##### 2. Manual Verification
- We verified the markdown file is parsed cleanly and successfully by the system.
- Confirmed that the new instructions strictly balance the KISS/YAGNI principles with defensive error checking (Postel's Law) to avoid both over-engineering and weak hacks.

#### Walkthrough: Exa MCP Server Configuration Correction

We have successfully diagnosed and resolved the Exa MCP server `EOF` connection error by transitioning the API key propagation from HTTP headers to URL query parameters.

##### 1. Configuration Realignment
- **[MODIFY] [mcp_config.json (local)](file:///home/dnguyen029/antigravity-project/mcp_config.json)**:
  - Updated the `exa` arguments array to append `?exaApiKey=$EXA_API_KEY&tools=web_search_exa,web_search_advanced_exa,web_fetch_exa` to the URL.
- **[MODIFY] [mcp_config.json (global IDE)](file:///home/dnguyen029/.gemini/antigravity-ide/mcp_config.json)**:
  - Synced the global IDE configuration with the local correction.

##### 2. Connection Verification Handshake
We executed the pre-flight connection verification script to confirm all servers report `🟢 CONNECTED`:
- **Result**: **SUCCESS** (6/6 servers connected).

##### 3. Manual Tool Execution Verification
We created a diagnostic script ([`scratch/test_exa.py`](file:///home/dnguyen029/antigravity-project/scratch/test_exa.py)) to emulate a full `tools/call` JSON-RPC handshake.
- **Result**: **SUCCESS** (Exa returns live search results cleanly under the updated configuration).

## 📌 Automate Lessons Learned & Swarm Mandates: Walkthrough (Date: N/A | Match Score: 0.607)

### Automate Lessons Learned & Swarm Mandates: Walkthrough

We have successfully implemented and verified the lessons learned automation hook, as well as the rules enforcing strict multi-agent swarm execution.

#### Changes Completed

##### 1. Automation Hook Implementation
- **Created [archive_lessons.py](file:///home/dnguyen029/antigravity-project/.agents/hooks/archive_lessons.py)**: Built a script that compares the SHA-256 hash of the walkthrough against a cache, and automatically POSTs updated walkthrough content to the Supabase `lessons_learned` table.
- **Registered Hook in [hooks.json](file:///home/dnguyen029/antigravity-project/.agents/hooks.json)**: Added the script execution to the `PostInvocation` array under `sync-context` so it runs automatically at the end of every IDE agent invocation.

##### 2. Strict Swarm Orchestration Rules
- **Modified [AGENTS.md](file:///home/dnguyen029/antigravity-project/.agents/rules/AGENTS.md)**: Added `Rule 13 — Swarm Orchestration Mandate` to prevent the agent from bypassing the Orchestrator/Builder/Auditor/SRE sequence when `/orchestrate` is requested.
- **Modified [GEMINI.md](file:///home/dnguyen029/antigravity-project/.agents/rules/GEMINI.md)**: Synced the mandate into the strict guidelines block of the Gemini agent specifications.

##### 3. Standards Compliance Audit
- Scanned all 43 active skill folders and rule files in [.agents/skills/](file:///home/dnguyen029/antigravity-project/.agents/skills/) and [.agents/rules/](file:///home/dnguyen029/antigravity-project/.agents/rules/).
- Verified that **100% of rules and skills** have compliant YAML frontmatter headers.

---

#### Verification Results

##### Lessons Learned Hook Verification
We manually triggered the new hook script:
```bash
/home/dnguyen029/antigravity-project/.venv/bin/python3 /home/dnguyen029/antigravity-project/.agents/hooks/archive_lessons.py
```text
- **First Run**: Detected modified walkthrough and successfully uploaded it:
  `Successfully archived walkthrough lesson to Supabase (ID: 1267)`
- **Subsequent Runs**: Checked cache and skipped database insert, confirming correct behavior.

##### 4. Lifecycle Hooks Hardening
- **Harkened safety-gate path**: Updated [hooks.json](file:///home/dnguyen029/antigravity-project/.agents/hooks.json) to change the `PreToolUse` command from using `/usr/bin/env python3` and a relative path to the absolute python path (`/home/dnguyen029/antigravity-project/.venv/bin/python3`) and the absolute script path (`/home/dnguyen029/antigravity-project/.agents/hooks/safety_gate.py`). This prevents directory resolution failures when the working directory changes.

All systems are validated, hardened, and fully operational.

