# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Workspace Hygiene and Legacy Deletion (Date: N/A | Match Score: 0.641)

Cleaned up git-ignored root artifacts (implementation_plan.md, task.md, walkthrough.md) and deleted legacy/ and archive/ directories to prevent agents from loading stale/obsolete instructions. Preserved system_status_report.md which is generated dynamically by tool verification scripts.

## 📌 Walkthrough - Standalone Admin Portal & RingCentral Dashboard (Date: N/A | Match Score: 0.640)

### Walkthrough - Standalone Admin Portal & RingCentral Dashboard

We have successfully migrated the admin portal overlay modal to a standalone, full-screen `/admin` page route and integrated the live RingCentral Call & Queue Dashboard.

---

#### Changes Completed

##### 1. Backend Route Integration
- **[NEW] [app/api/ringcentral/route.ts](file:///home/dnguyen029/swarm-agency/app/api/ringcentral/route.ts)**:
  - Safe OAuth JWT client authorization integration with RingCentral.
  - Active queue metrics and extension status extraction.
  - Implementation of a **30-second server-side memory cache** protecting the endpoints from rate limits (429s).
  - Resilient fallback mode delivering mock/cached metrics if credentials are not configured or are expired.

##### 2. Standalone Page Route
- **[NEW] [app/admin/page.tsx](file:///home/dnguyen029/swarm-agency/app/admin/page.tsx)**:
  - Renders a passcode authorization gate (`admin`).
  - Features sessionStorage state retention to preserve login status across simple browser page refreshes.
  - Integrates the tab routing switcher, setting the **RingCentral Dashboard** as the default tab.
  - Complies with the luxury editorial design style guidelines (warm organic backdrop gradients and elegant serif typography).

##### 3. Modular Tab Component Extraction
To improve maintainability and avoid single-file bloat, the original modal's tabs were extracted into separate component files:
- **[NEW] [components/admin/LeadsTab.tsx](file:///home/dnguyen029/swarm-agency/components/admin/LeadsTab.tsx)**: Manages client lead list inbounds and fetches `/api/leads`.
- **[NEW] [components/admin/TelemetryTab.tsx](file:///home/dnguyen029/swarm-agency/components/admin/TelemetryTab.tsx)**: Visualizes Supabase query logs.
- **[NEW] [components/admin/CatalogTab.tsx](file:///home/dnguyen029/swarm-agency/components/admin/CatalogTab.tsx)**: Mappings of the local product registry.
- **[NEW] [components/admin/RingCentralTab.tsx](file:///home/dnguyen029/swarm-agency/components/admin/RingCentralTab.tsx)**: The new real-time dashboard displaying call metrics, active queue sizes, active extensions, and custom SVG progress bar analytics for specialist call volume.

##### 4. Routing & Cleanups
- **[MODIFY] [components/Navbar.tsx](file:///home/dnguyen029/swarm-agency/components/Navbar.tsx)**:
  - Redirects the "PORTAL ACCESS" link directly to `/admin` instead of toggling the modal.
  - Decoupled modal state parameters and dynamically checks sessionStorage for authorization status.
- **[MODIFY] [app/page.tsx](file:///home/dnguyen029/swarm-agency/app/page.tsx)**: Cleaned up dynamic imports, modal layout triggers, and unused component logic.
- **[MODIFY] [app/competitor-dashboard/page.tsx](file:///home/dnguyen029/swarm-agency/app/competitor-dashboard/page.tsx)**: Removed old Navbar modal props.
- **[MODIFY] [swarm-agency/.env](file:///home/dnguyen029/swarm-agency/.env)**: Sourced `RINGCENTRAL_` credentials.

---

#### Verification Results

We verified compiling and building the Next.js application within the subfolder. The production build succeeded with zero errors:

```bash
npm run build --prefix /home/dnguyen029/swarm-agency
```text
**Compilation Output:**
```text
✓ Checking validity of types
✓ Collecting page data
✓ Generating static pages (16/16)
✓ Collecting build traces
✓ Finalizing page optimization
```text
All routes compiled successfully.

---

#### 🎨 Configurator Refactoring, Brand Anonymization & Mobile Optimization

Both visual customizers have been fully separated, anonymized to generic portfolio names to protect customer identities, and optimized for mobile devices:

1. **Brand Name Substitutions**:
   - `TK Balloons` -> **`Luxury Balloon Studio`**
   - `Ariel Bath` / `Ariel Vanity` -> **`Luxury Cabinet Studio`**
2. **Dedicated Separated Routes**:
   - **`/configurator`**: Renders the standalone **Luxury Cabinet Studio** using the main website's `Navbar`/`Footer` layout.
   - **`/configurator/balloons`**: Renders the **Luxury Balloon Studio** layout (the capsule switcher toggles have been completely removed from both headers).
3. **Mobile Layout Optimizations**:
   - Visualizer container heights adjusted dynamically (`h-[380px] sm:h-[450px] md:h-[550px]`).
   - SVG cabinet models and wall mirrors wrapped in a responsive scale factor (`scale-[0.6] xs:scale-[0.72] sm:scale-90 md:scale-100 origin-bottom`) to prevent container overflows on mobile devices.
   - Expected savings stats grid updated to stack columns vertically on mobile screens (`grid-cols-1 sm:grid-cols-3`).

---

#### 📊 Dashboard Visual Tour & Recordings

We recorded the interactive session of the dashboard, displaying the new **Abandoned Call Stats**, the **Hourly Call Distribution Chart**, the **Active Queue Breakdown**, and the **Role-Based Passcodes**:

- **telemetry**: Viewer role (restricts view to the RingCentral dashboard only, hiding admin configuration tabs).
- **suprememaster**: Admin role (unlocks full access to Leads, Database telemetry logs, Catalog, and Call status).

![Dashboard Verification Walkthrough Recording](/home/dnguyen029/.gemini/antigravity-ide/brain/e8178b26-79b5-49b2-a50a-e4cadf093911/dashboard_update_check_1784223809756.webp)

##### Visual Layout Verification:
````carousel
![Inbound KPI cards showing Answered, Missed, and Abandoned stats](/home/dnguyen029/.gemini/antigravity-ide/brain/e8178b26-79b5-49b2-a50a-e4cadf093911/admin_dashboard_initial_1784223816013.png)
<!-- slide -->
![Peak load periods bar chart at the bottom](/home/dnguyen029/.gemini/antigravity-ide/brain/e8178b26-79b5-49b2-a50a-e4cadf093911/admin_dashboard_top_1784223820501.png)
````

---

#### 🚀 Deployment Status

All modifications and new components have been committed and successfully pushed to origin on GitHub. Vercel is actively building the deployment.

---

#### How to Test Locally

1. Settle in the directory and run the local development server:
   ```bash
   npm run dev --prefix /home/dnguyen029/swarm-agency
   ```text
2. Navigate to `http://localhost:3000/configurator` to test the Luxury Cabinet Studio.
3. Navigate to `http://localhost:3000/configurator/balloons` to test the Luxury Balloon Studio.
4. Verify passcode validation:
   - Use `telemetry` for restricted Call analytics.
   - Use `suprememaster` for full admin tab layout.

## 📌 Walkthrough — Refactoring MCP Configurations (Date: N/A | Match Score: 0.638)

### Walkthrough — Refactoring MCP Configurations

This walkthrough summarizes the refactoring steps, implementation details, and verification results for removing the deprecated `supermemory` server and cleaning up legacy stdout filter pipes from all `mcp_config.json` files.

---

#### 🛠️ Changes Implemented

##### 1. Refactoring Script
Created the [patch_mcp_config.py](file:///home/dnguyen029/antigravity-project/patch_mcp_config.py) automation script:
- Dynamically iterates over the workspace-local, global IDE, global Desktop, and shared system-level `mcp_config.json` files.
- Removes the deprecated `supermemory` server block from `mcpServers` if present.
- Sanitizes the `args` parameters of remaining servers (like `supabase` and `google-conversational-agents`) by stripping obsolete ` | grep --line-buffered "^{"` pipes, since output filtering is now performed robustly by `mcp_timeout_wrapper.py`.

##### 2. Configuration Cleanup
The automation script was executed and successfully updated three of the configuration files:
-   **Workspace-Local Config**: [`mcp_config.json`](file:///home/dnguyen029/antigravity-project/mcp_config.json)
    -   Cleaned `supabase` arguments.
-   **Global Desktop Config**: [`~/.gemini/antigravity/mcp_config.json`](file:///home/dnguyen029/.gemini/antigravity/mcp_config.json)
    -   Removed `supermemory` server block.
    -   Cleaned `supabase` arguments.
-   **Shared Global Config**: [`~/.gemini/config/mcp_config.json`](file:///home/dnguyen029/.gemini/config/mcp_config.json)
    -   Removed `supermemory` server block.
    -   Cleaned `google-conversational-agents` and `supabase` arguments.

*(Note: The global IDE config did not contain `supermemory` or legacy pipes and was skipped cleanly.)*

---

#### ✅ Verification Results

##### 1. Programmatic Config Content Assertions
We executed a Python verification command to validate that:
-   The `supermemory` configuration block is not present in any config file.
-   The obsolete `grep` filter pipes are not present in any server `args`.
-   **Result**: **Passed** with 100% compliance.

##### 2. Connection Verification Check
We executed the pre-flight connection verifier script:
```bash
/home/dnguyen029/antigravity-project/.venv/bin/python3 app_build/verify_mcp_connections.py
```text
-   **Result**: **Success**. All 5 remaining configured MCP servers (`exa`, `supabase`, `toon-mcp`, `context-mcp`, `google-conversational-agents`) successfully established connections (`🟢 CONNECTED`).
-   **Status Report**: The results were compiled into [`system_status_report.md`](file:///home/dnguyen029/antigravity-project/production_artifacts/system_status_report.md).

## 📌 Walkthrough: Deprecate Supermemory and Consolidate Memory under Supabase (Date: N/A | Match Score: 0.637)

### Walkthrough: Deprecate Supermemory and Consolidate Memory under Supabase

We have successfully deprecated the Supermemory MCP server, consolidated all memory operations under Supabase, updated the synchronization hooks, and verified the changes.

#### Changes Made

##### 1. Configuration Cleanup
- **[mcp_config.json (Local)](file:///home/dnguyen029/antigravity-project/mcp_config.json)**: Removed the `supermemory` block from `mcpServers`.
- **[mcp_config.json (Global IDE)](file:///home/dnguyen029/.gemini/antigravity-ide/mcp_config.json)**: Removed the `supermemory` block from `mcpServers`.
- **[verify_mcp_connections.py](file:///home/dnguyen029/antigravity-project/app_build/verify_mcp_connections.py)**: Removed the Supermemory-specific `resources/list` ping verification step.

##### 2. Context Server Adaptation
- **[context_mcp_server.py](file:///home/dnguyen029/antigravity-project/app_build/tools/context_mcp_server.py)**:
  - Removed all subprocess handlers, retry loops, and string sanitization rules related to Supermemory.
  - Refactored `lessons` and `search_memory` to fetch context and ground truth lessons solely from Supabase.

##### 3. Synchronization Hooks Simplification
- **[archive_lessons.py](file:///home/dnguyen029/antigravity-project/.agents/hooks/archive_lessons.py)**: Removed direct HTTP POST uploads to `api.supermemory.ai`. Simplifies file hash caches to rely on Supabase synchronization success.
- **[flush_pending_lessons.py](file:///home/dnguyen029/antigravity-project/.agents/hooks/flush_pending_lessons.py)**: Removed the `post_to_supermemory` helper and consolidated retry checks to focus solely on Supabase.
- **[archive_lesson.py](file:///home/dnguyen029/antigravity-project/app_build/tools/archive_lesson.py)**: Cleaned up queuing logic to skip Supermemory queuing on successful Supabase writes.
- **[index_codebase.py](file:///home/dnguyen029/antigravity-project/app_build/tools/index_codebase.py)**: Deprecated the REST upload phase to Supermemory.

---

#### Verification Results

##### 1. Pre-flight MCP Verification
- **Command**: `/home/dnguyen029/antigravity-project/.venv/bin/python3 app_build/verify_mcp_connections.py`
- **Result**: `🟢 CONNECTED` for all 5 remaining servers (`exa`, `supabase`, `toon-mcp`, `context-mcp`, and `google-conversational-agents`).

##### 2. Context Prompt Diagnostic Test
- **Command**: `/home/dnguyen029/venv/bin/python -c 'import asyncio, sys; sys.path.append("/home/dnguyen029/antigravity-project/app_build/tools"); import context_mcp_server; print(asyncio.run(context_mcp_server.lessons()))'`
- **Result**: Successfully resolved in under 2 seconds, displaying the ground truth lessons learned from Supabase.

## 📌 Walkthrough: Context Management & Memory Refactoring (Date: N/A | Match Score: 0.636)

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

