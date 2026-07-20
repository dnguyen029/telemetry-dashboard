# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Walkthrough: Schema Alignment & WISMO Mock Data Removal (Date: N/A | Match Score: 0.613)

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

## 📌 Walkthrough: Dashboard Migration & Redesign (Date: N/A | Match Score: 0.612)

### Walkthrough: Dashboard Migration & Redesign

We have successfully migrated the RingCentral Telemetry and Ariel Bath Competitor pricing dashboards into a standalone project (`telemetry-dashboard`) and completely redesigned the interface using **Shadcn UI** and **UI/UX Pro Max** layout specifications.

---

#### 🛠️ Work Accomplished

##### 1. Project Scaffolding
- Scaffolded a clean Next.js 15 App Router codebase under the [telemetry-dashboard/](file:///home/dnguyen029/swarm-agency/telemetry-dashboard/) directory.
- Configured environmental credentials and installed central packages: `@supabase/supabase-js`, `lucide-react`, and `@google/genai`.

##### 2. Shadcn UI Integration
- Initialized Shadcn configurations and installed structural components: `card`, `table`, `tabs`, `badge`, `button`, `tooltip`, and `progress`.
- Configured **Fira Sans** (font-sans) and **Fira Code** (font-mono) typography mappings inside the Tailwind configuration.

##### 3. Competitor Data Decoupling
- Extracted the core price list dataset out of the visual UI code and placed it under a dedicated data module at [competitorData.ts](file:///home/dnguyen029/swarm-agency/telemetry-dashboard/lib/competitorData.ts).

##### 4. High-Density Layout Implementation
- Implemented the unified entrypoint workspace at [page.tsx](file:///home/dnguyen029/swarm-agency/telemetry-dashboard/app/page.tsx). It uses a clean tab controller to switch between:
  1. **Call Operations Telemetry** (live volume, queue lines, average wait times, active extensions, missed call hotspot heatmaps).
  2. **Competitor Pricing Analytics** (pricing matrices, regional stock outages, simulated landed costs slider, and the Gemini Pricing Copilot chat client).
- Fully updated the UI components to use high-density dark mode widgets, borders, and smooth transition states.

##### 5. Transition Safety
- Excluded the `telemetry-dashboard` folder from the storefront compiler configuration in [tsconfig.json](file:///home/dnguyen029/swarm-agency/tsconfig.json#L27) to isolate environments.
- Kept all legacy admin/competitor routes and components intact inside the storefront repository to serve as a live backup during the migration transition phase.

---

#### 🧪 Verification Results

##### Production Compilation Builds
1. Standalone Project: Ran `npm run build` inside `telemetry-dashboard/` ➔ **SUCCESS** (Compiled 100% cleanly with no errors).
2. Storefront Project: Ran `npx tsc --noEmit` in root ➔ **SUCCESS** (Compiled 100% cleanly with no errors).

## 📌 Swarm Rules and Workflow Upgrade Walkthrough (Date: N/A | Match Score: 0.602)

### Swarm Rules and Workflow Upgrade Walkthrough

We have successfully updated the swarm rules and workflows to enforce Ripple Analysis, Configuration Provenance, and Loop Thrashing Prevention.

#### Changes Completed

##### Swarm Rules

###### [MODIFY] [AGENTS.md](file:///home/dnguyen029/antigravity-project/.agents/rules/AGENTS.md)
- Updated Rule 6 (Plan Approval Gate) to include `Ripple Analysis` and `Configuration Provenance` as mandatory sections of the `implementation_plan.md`.

###### [MODIFY] [guardrails.md](file:///home/dnguyen029/antigravity-project/.agents/rules/guardrails.md)
- Updated Rule 6 (Mandatory Database Search & Plan Approval Gate) to explicitly verify that the plan contains the new sections.

###### [MODIFY] [orchestrator.md](file:///home/dnguyen029/antigravity-project/.agents/rules/orchestrator.md)
- Added explicit instructions for:
  - **Ripple Analysis**: Cross-referencing files against [RIPPLE_MAP.md](file:///home/dnguyen029/antigravity-project/.agents/docs/RIPPLE_MAP.md) during plan generation.
  - **Configuration Provenance**: Performing a git log/blame and Supabase memory check before editing any configuration parameters.
  - **Loop Prevention**: Auditing `.agents/session_history.json` to avoid repeating failed attempts.

##### Workflows

###### [MODIFY] [orchestrate.md](file:///home/dnguyen029/antigravity-project/.agents/workflows/orchestrate.md)
- Updated the Step 2 Self-Correction check list to ensure `implementation_plan.md` contains sections for both "Ripple Analysis" and "Configuration Provenance".

---

#### Verification Results

##### Automated Frontmatter Validation
We ran a python script to parse and validate the YAML frontmatter headers of the modified files:
```bash
/home/dnguyen029/antigravity-project/.venv/bin/python3 -c "import sys, yaml; [yaml.safe_load(open(f).read().split('---')[1]) for f in ['/home/dnguyen029/antigravity-project/.agents/rules/AGENTS.md', '/home/dnguyen029/antigravity-project/.agents/rules/guardrails.md', '/home/dnguyen029/antigravity-project/.agents/workflows/orchestrate.md', '/home/dnguyen029/antigravity-project/.agents/rules/orchestrator.md']]; print('ALL METADATA PARSING PASSED')"
```text
- **Output**: `ALL METADATA PARSING PASSED`
- **Status**: **SUCCESS**

## 📌 Walkthrough - shadcn MCP Path Configuration Resolved (Date: N/A | Match Score: 0.592)

### Walkthrough - shadcn MCP Path Configuration Resolved

We have successfully updated the `shadcn` MCP server config block in both local and global `mcp_config.json` files using a safe Python migration script.

---

#### Changes Completed

##### 1. Migrations Execution
- **[NEW] [update_mcp_config.py](file:///home/dnguyen029/.gemini/antigravity-ide/brain/a51b6821-0a2c-4622-9620-d31358727f08/scratch/update_mcp_config.py)**:
  - Safe Python script to load and parse `mcp_config.json` files.
  - Replaces the command execution block for `shadcn` to dynamically resolve `node` and `npx` from the user's pnpm bin directory via `bash -c`.

##### 2. Config File Patches
- **[MODIFY] [mcp_config.json (Local)](file:///home/dnguyen029/antigravity-project/mcp_config.json#L88-L95)**:
  - Updated configuration to execute the wrapped bash command.
- **[MODIFY] [mcp_config.json (Global)](file:///home/dnguyen029/.gemini/antigravity-ide/mcp_config.json#L96-L103)**:
  - Aligned the global configuration block to match.

---

#### Verification Results

##### 1. Script Execution Output
```text
Successfully updated config at /home/dnguyen029/antigravity-project/mcp_config.json
Successfully updated config at /home/dnguyen029/.gemini/antigravity-ide/mcp_config.json
```text

##### 2. Configuration Inspection
We verified both config files visually. The `shadcn` block is now configured as:
```json
"shadcn": {
  "command": "bash",
  "args": [
    "-c",
    "export PATH=\"/home/dnguyen029/.local/share/pnpm:$PATH\" && npx -y shadcn@latest mcp"
  ]
}
```text
This forces the editor's child processes to inherit the user's pnpm binaries upon startup, resolving path resolution issues.

## 📌 Walkthrough: Context Management & Memory Refactoring (Date: N/A | Match Score: 0.591)

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

#### Walkthrough: Schema Alignment & WISMO Mock Data Removal

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

