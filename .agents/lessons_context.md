# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Test Lesson from IDE Agent (Date: N/A | Match Score: 0.623)

This is a test lesson verifying the new manual archive script and automated vector embedding calculation.

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

## 📌 Walkthrough: Next.js MCP GEO Gateway Deployment (Date: N/A | Match Score: 0.597)

### Walkthrough: Next.js MCP GEO Gateway Deployment

We have successfully deployed the stateless Model Context Protocol (MCP) server and Generative Engine Optimization (GEO) discovery files within the `swarm-agency` Next.js codebase.

---

#### 🛠️ Changes Completed

##### 1. Static Discovery Index files (Public Directory)
We created a dedicated `/public` folder structure inside `swarm-agency` and added:
-   **[llms.txt](file:///home/dnguyen029/swarm-agency/public/llms.txt):** A structured index for AI crawlers containing category tags, primary products metadata, and direct resource/integration links configured with the Vercel endpoint.
-   **[llms-full.txt](file:///home/dnguyen029/swarm-agency/public/llms-full.txt):** A flat crawlable product catalog containing complete details (price, dimensions, finish, materials, and links) for Cambridge, Hepburn, and Whirlpool vanity collections.
-   **[mcp.json](file:///home/dnguyen029/swarm-agency/public/.well-known/mcp.json):** The JSON-RPC discovery entrypoint declaring the `ariel-bath-catalog` server URL (`https://swarm-agency.vercel.app/api/mcp`) and transport type (`streamable-http`).

##### 2. Next.js API Route Handler
We implemented the route handler at:
-   **[route.ts](file:///home/dnguyen029/swarm-agency/app/api/mcp/route.ts):** A TypeScript API handler responding to JSON-RPC 2.0 requests over HTTP. It supports:
    -   `OPTIONS`: Returns CORS preflight headers allowing third-party API tool invokers.
    -   `GET`: Returns `405 Method Not Allowed` with explanations (indicating a POST-only transport).
    -   `POST`: Parses standard JSON-RPC payloads, extracting the method and parameters.
        -   `initialize`: Resolves capabilities and server identification.
        -   `tools/list`: Declares the `search_vanities` tool definition and schema constraints.
        -   `tools/call`: Filters the local catalog for matches, formats the result as a markdown block, and dispatches non-blocking telemetry payload to the n8n hook (if `TELEMETRY_WEBHOOK_URL` is defined in env variables).

---

#### 🧪 Verification & Testing Results

##### 1. Next.js App Compilation
We ran a production compilation of the Next.js application:
```bash
npm run build
```text
-   **Result:** **SUCCESS** (Compiled without any TypeScript or ESLint errors; `/api/mcp` registered correctly as a dynamic route).

##### 2. Local JSON-RPC Endpoint Testing
We started the local dev server (`npm run dev`) and validated standard JSON-RPC 2.0 payloads via `curl`:

###### A. Initialize Request
```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```text
-   **Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": { "name": "ariel-bath-catalog", "version": "1.0.0" }
  }
}
```text

###### B. Tools List Request
```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```text
-   **Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "search_vanities",
        "description": "Search the Ariel Bath catalog for premium solid wood bathroom vanities, double/single sink vanities, and whirlpool tubs.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "The search keywords (e.g., 'white oak', 'double sink', '72 inch')"
            }
          },
          "required": [ "query" ]
        }
      }
    ]
  }
}
```text

###### C. Tools Call Request (Single Match)
```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_vanities","arguments":{"query":"white oak"}}}'
```text
-   **Response Content Text:**
```text
Found 1 products matching "white oak" in the Ariel Bath catalog:

##### **Ariel Cambridge 42 in. Right Offset Single Rectangular Sink Bathroom Vanity**
- **SKU:** A042SRCQRVOWOA
- **Price:** $1,420.00
- **Dimensions:** 42.25"W x 22"D x 36"H
- **Materials:** Solid White Oak, Carrara White Quartz Countertop
- **Description:** Compact offset single sink vanity. Includes 1.5-inch edge quartz countertop and matching backsplash.
- **Image:** [View Product Image](https://www.arielbath.com/media/catalog/product/c/a/cambridge_42_oak.jpg)
- **Shop Link:** [Ariel Bath Storefront Link](https://www.arielbath.com/ariel-cambridge-42-inch-right-offset-single-rectangular-sink-bathroom-vanity-with-carrara-white-quartz-countertop-1-5-inch-edge-in-oak-a042srcqrvowoa?utm_source=mcp_shadow_poc&utm_medium=ai_search&utm_campaign=trial)
```text

###### D. Tools Call Request (Multiple Matches)
```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"search_vanities","arguments":{"query":"double"}}}'
```text
-   **Response:** Correctly returns a markdown list detailing both the **Ariel Cambridge 73 in.** and **Ariel Hepburn 73 in.** double vanities.

## 📌 Walkthrough - TOON MCP Hardening & MarkItDown Config Sync (Date: N/A | Match Score: 0.597)

### Walkthrough - TOON MCP Hardening & MarkItDown Config Sync

We have successfully resolved the concurrency, performance, and stability issues within the TOON MCP server, and integrated the Microsoft MarkItDown MCP server to parse binary documents (like PDFs and spreadsheets) into clean Markdown.

---

#### 🛠️ Changes Implemented

##### 1. TOON MCP Hardening

- **Stateless Refactoring** in [patterns.py](file:///home/dnguyen029/antigravity-project/.agents/skills/toon-mcp/mcp-server-toon/src/patterns.py):

  - Removed class-level instance collections (`self.detected_patterns` and `self.key_frequency`) to prevent race conditions during concurrent tool calls.
  - Added cycle detection using a `visited` set tracking `id(obj)` to prevent infinite recursion crashes on cyclic structures.
  - Eliminated the unused `path` parameter to prevent redundant string allocations.
  - Optimized the schema consistency score calculation to iteratively intersect and union sets rather than doing a massive unpack (`*key_sets`).

- **Cycle Detection in Serialization** in [toon_converter.py](file:///home/dnguyen029/antigravity-project/.agents/skills/toon-mcp/mcp-server-toon/src/toon_converter.py):

  - Added cycle checks in `_cap_depth` that safely returns `"<CYCLE_DETECTED>"` when parent reference loops are encountered.

- **Non-Blocking Handlers** in [server.py](file:///home/dnguyen029/antigravity-project/.agents/skills/toon-mcp/mcp-server-toon/src/server.py):

  - Offloaded all CPU-bound JSON operations, traversals, and encoding/decoding processes to background worker threads using `asyncio.to_thread`.
  - Removed class-level helper state to ensure complete request isolation.

##### 2. MarkItDown MCP Ingestion

- **Helper Script** in [update_mcp_config.py](file:///home/dnguyen029/antigravity-project/app_build/tools/update_mcp_config.py) [NEW]:

  - Wrote a Python utility to register the `markitdown` Stdio server in both the local project `mcp_config.json` and the global editor `~/.gemini/antigravity-ide/mcp_config.json`.

- **Dependency Installation**:

  - Installed `markitdown-mcp` into the workspace virtual environment.
  - Upgraded `mcp` back to `1.28.1` to maintain compatibility with `google-adk` while retaining binary execution path stability.

---

#### 🧪 Verification Results

##### TOON Unit and Integration Tests

- Added a new unit test `test_cycle_reference_protection` in [test_depth.py](file:///home/dnguyen029/antigravity-project/.agents/skills/toon-mcp/mcp-server-toon/tests/test_depth.py) to check that self-referential dictionaries are converted without crash.
- Ran the TOON pytest runner:

  - **Result**: `41 passed in 0.87s` (including new cycle test).

##### MCP Server Connection Verification

- Ran the workspace verifier:

  ```bash
  /home/dnguyen029/antigravity-project/.venv/bin/python3 app_build/verify_mcp_connections.py
  ```text

  - **Result**: Successfully connected all 9 configured servers.
  - `markitdown` is verified online (`🟢 CONNECTED`) exposing `convert_to_markdown`.
  - `toon-mcp` is verified online (`🟢 CONNECTED`) exposing all 6 serialization tools.

## 📌 Walkthrough: Audit of MCP Configurations and Swarm Hook Refactoring (Date: N/A | Match Score: 0.592)

### Walkthrough: Audit of MCP Configurations and Swarm Hook Refactoring

We have completed the audit of the previous agent session logs, verified the status of the `context7`/`sequentialthinking` MCP servers, and successfully refactored the lifecycle hooks to stabilize the Swarm Live Execution Monitor by adding robust pre-flight checks.

#### Changes Completed

##### 1. Audit & Diagnostics
- **MCP Configuration Verification**: Checked local and global `mcp_config.json` configurations.
  - Confirmed `context7` is configured correctly.
  - Confirmed `sequential-thinking` is omitted by design as it is a built-in.
- **IDE Diagnostics Review**: Analyzed [Antigravity IDE-diagnostics.txt](file:///home/dnguyen029/antigravity-project/Antigravity%20IDE-diagnostics.txt).
  - Confirmed that the language server and renderer logs contain no errors regarding `context7` or `sequential-thinking` MCP initialization.
- **Root Cause Analysis (RCA)**: Diagnosed why the agent went loopy at the end of the previous session and compiled all findings into [analysis_results.md](file:///home/dnguyen029/.gemini/antigravity-ide/brain/5cd7c146-dc8d-4849-975d-187d5ad0a110/analysis_results.md).

##### 2. Refactoring Hook Lifecycles
- **Modified hooks.json**: Re-routed [sync_context.py](file:///home/dnguyen029/antigravity-project/.agents/hooks/sync_context.py) from `PostInvocation` to `PostToolUse` under the `dashboard-sync` block in [hooks.json](file:///home/dnguyen029/antigravity-project/.agents/hooks.json). This ensures the script receives the proper `toolCall` metadata payload.
- **Preserved Swarm Transitions**: Modified [sync_context.py](file:///home/dnguyen029/antigravity-project/.agents/hooks/sync_context.py) to parse the existing [agent_live.md](file:///home/dnguyen029/antigravity-project/production_artifacts/agent_live.md) file via regex and preserve the current `Active Agent` (e.g., `Builder`, `Auditor`, `Orchestrator`), preventing the hooks from clobbering active agent state back to a hardcoded `"IDE Agent"`.
- **Path Alignment**: Updated both [update_dashboard.py](file:///home/dnguyen029/antigravity-project/.agents/hooks/update_dashboard.py) and [sync_context.py](file:///home/dnguyen029/antigravity-project/.agents/hooks/sync_context.py) to write to the compliant [agent_live.md](file:///home/dnguyen029/antigravity-project/production_artifacts/agent_live.md) in the `production_artifacts/` partition instead of the root directory.
- **Relocated Legacy Files**: Deleted the legacy `agent_live.md` from the project root and initialized the new one in [production_artifacts/agent_live.md](file:///home/dnguyen029/antigravity-project/production_artifacts/agent_live.md).
- **Updated Hub Links**: Modified [dashboard.md](file:///home/dnguyen029/antigravity-project/dashboard.md) to redirect all system state links (`agent_live.md`, `task.md`, `walkthrough.md`, `system_status_report.md`) to their new locations in `production_artifacts/`.

##### 3. Pre-Flight Safety Checks Implementation
- **Hardened sync_context.py**: Added a validation check that asserts parent directory existence (automatically running `os.makedirs(..., exist_ok=True)` if the `production_artifacts/` directory is missing), validates write access to the folder and the target file, and exits gracefully if empty or invalid JSON payloads are piped.
- **Hardened archive_lessons.py**: Added a pre-flight validation block that checks walkthrough readability, validates the presence of `.env` configurations containing valid `SUPABASE_URL` and `SUPABASE_KEY` values, and verifies write access to the hash cache directory, exiting gracefully with warning messages if any checks fail.

---

#### Verification Results

##### 1. Script Executions & Compilations
- Verified that both scripts successfully compile without syntax errors.
- Verified that `update_dashboard.py` runs and updates the phase to `🔍 Processing` in the compliant path.

##### 2. Pre-Flight Safety Checks Validation
- **Missing Directory Test**: Verified that deleting the `production_artifacts/` directory and executing the hook script successfully auto-creates the directory and initializes `agent_live.md` without crashing.
- **Missing Environment Variables Test**: Verified that removing `.env` configuration keys and executing the lesson archiver exits cleanly with the message:
  `Pre-flight: walkthrough.md does not exist or is not readable. Skipping archive.` or `Pre-flight: SUPABASE_URL or SUPABASE_KEY is missing from environment. Skipping archive.`
  confirming no network failures or unhandled exceptions occur.
- **Dashboard Integrity Checks**: Confirmed that `production_artifacts/agent_live.md` preserves the active agent state (`Builder`) during manual test executions and updates the phase dynamically with specific tool details.

