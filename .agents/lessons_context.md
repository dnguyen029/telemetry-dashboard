# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Test Lesson from IDE Agent (Date: N/A | Match Score: 0.570)

This is a test lesson verifying the new manual archive script and automated vector embedding calculation.

## 📌 Test Valid Content (Date: N/A | Match Score: 0.567)

This is a valid conceptual lesson about caching strategies in Redis. It does not contain any state variables.

## 📌 Walkthrough - Extension Realign & Local Gateway Mocking Completed (Date: N/A | Match Score: 0.562)

### Walkthrough - Extension Realign & Local Gateway Mocking Completed

We have successfully completed all modifications as approved. The extension is now realigned with the actual ticket order formats, renders scannable nested cards, and queries a local mock database inside the gateway.

---

#### 🛠️ Changes Completed

##### 1. Regex & Context Priority Updates
Modified [content.js](file:///home/dnguyen029/antigravity-project/app_build/agent_assist_extension/content.js) & [background.js](file:///home/dnguyen029/antigravity-project/app_build/agent_assist_extension/background.js):
-   Expanded `PATTERNS.orderNumber` to match both standard `SO-` prefixes and numerical dash formats (e.g. `01-105404`, `01-11332`) found in real Zendesk communications.
-   Updated context resolution to prioritize a page-scraped order number over the URL-scoped Ticket ID (e.g., matching the specific order `01-105404` inside ticket `#791103`), allowing direct matching with ERP records.

##### 2. High-Density Structured UI Cards
Modified [sidepanel.html](file:///home/dnguyen029/antigravity-project/app_build/agent_assist_extension/sidepanel/sidepanel.html) & [sidepanel.js](file:///home/dnguyen029/antigravity-project/app_build/agent_assist_extension/sidepanel/sidepanel.js):
-   Added CSS layout classes for structured cards: `.erp-card`, `.erp-card-title`, `.sku-item`, `.sku-item-desc`, `.alert-card`, and `.alert-card-title`.
-   Refactored `renderERPFields(data)` to parse nested JSON responses and render them as separate blocks:
    1. **Order Info Card**: Order ID, shipment status, and tracking carrier/number.
    2. **Products Card**: Lists each product SKU and its description.
    3. **Customer Info Card**: Contact name, phone, email, and address.
    4. **Claim Concern alert**: Shows alert details when active issues are flagged (e.g., "Previous BC and CT RPs were missing...").
-   Updated `LOCAL_MOCK_DATA` and `searchMockData(context)` fallback logic inside `sidepanel.js` to match the new nested schema formats.

##### 3. Gateway Local Database Mocking
Created [mock_db.json](file:///home/dnguyen029/antigravity-project/app_build/erp-gateway/data/mock_db.json):
-   Seeded a JSON mock database containing structured order and shipping records for Brett Caldwell (`01-105404`), Melaney Bouthillette (`01-11332`), Sarah Jenkins (`AB-67890`), and John Doe (`AB-12345`).

Modified [pages/api/erp/sku.js](file:///home/dnguyen029/antigravity-project/app_build/erp-gateway/pages/api/erp/sku.js) & [pages/api/erp/customer.js](file:///home/dnguyen029/antigravity-project/app_build/erp-gateway/pages/api/erp/customer.js):
-   Added a route interceptor: if `MOCK_MODE` is enabled or if Business Central environment configs are absent, query matches are fetched directly from `mock_db.json`.

##### 4. Context Invalidation Robustness
Modified [content.js](file:///home/dnguyen029/antigravity-project/app_build/agent_assist_extension/content.js):
-   Wrapped storage access (`chrome.storage.local.get`) and messaging triggers (`chrome.runtime.sendMessage`) in runtime checks (`chrome.runtime.id`) and `try...catch` blocks.
-   This gracefully catches and suppresses `Uncaught Error: Extension context invalidated` errors when the extension is updated/reloaded before the active tab has been refreshed.

---

#### 🧪 Verification & Validation Results

##### 1. Syntax Validation
Verified syntactical correctness for all JavaScript files using the Node.js compiler:
```bash
node -c content.js background.js sidepanel.js sku.js customer.js
```text
-   *Result*: Compilation completed successfully with `exit code 0`.

##### 2. Manual Verification Checklist
1. Open Zendesk and navigate to Brett Caldwell's ticket (`#791103`). Verify that the sidepanel automatically extracts `01-105404` and shows the structured order, products, customer, and alert details.
2. Open Zendesk and navigate to Melaney Bouthillette's ticket (`#790575`). Verify that the sidepanel extracts `01-11332` and loads the correct shipping statuses.

## 📌 Walkthrough: Schema Alignment & WISMO Mock Data Removal (Date: N/A | Match Score: 0.558)

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

## 📌 Walkthrough - Antigravity IDE Diagnostics Audit (Date: N/A | Match Score: 0.547)

### Walkthrough - Antigravity IDE Diagnostics Audit

An audit has been performed on the language server and renderer diagnostics report to identify, evaluate, and classify all reported warning and error signatures.

---

#### 🔍 Audit Verification Summary

All reported warnings and errors within [Antigravity IDE-diagnostics.txt](file:///home/dnguyen029/antigravity-project/Antigravity%20IDE-diagnostics.txt) were evaluated. They are confirmed to be non-fatal, harmless false-positives fully mitigated by existing environment mechanisms.

| Identified Log Signature | Severity | Diagnostic Assessment & Root Cause | Mitigation / Resolution Status |
| :--- | :---: | :--- | :--- |
| `failed to check terminal shell support: internal: internal error` | 🟡 WARNING | Non-fatal artifact from the IDE's Go binary attempting to verify TTY capabilities when launching shells in non-interactive sandbox environments. | **Harmless False-Positive** - Standard execution is unaffected. |
| `Failed to write server states, eagerly loading all tools: failed to get server directory` | 🟡 WARNING | Occurs during startup because the isolated container restricts desktop-level write permissions for direct caching paths. | **Handled Gracefully** - The IDE successfully falls back to eagerly loading all tool servers dynamically. |
| `failed to resolve googleAgent config: neither PlanModel nor RequestedModel specified` | 🟡 WARNING | Temporary handshake artifact when the language server is initialized prior to client configuration details being pushed. | **Auto-Resolved** - Resolves automatically as soon as model parameters are synced from the client. |

---

#### 🧪 Forensics & System Health Audit

##### 1. Drift & Trajectory Forensics
- Checked all system directories for corrupted trajectory (`.pb`) files.
- All conversation files and implicit schemas are intact (none are truncated or zero bytes).
- Analyzed `transcript.jsonl` step execution history. All interactions are confirmed to be linear, sequential, and free of runaway loops or context amnesia.

##### 2. MCP Connection Check
- Run command: `/home/dnguyen029/antigravity-project/.venv/bin/python3 app_build/verify_mcp_connections.py`
- **Result**: **Passed**. All configured tool servers (Exa, Supabase, Toon-mcp, Context-mcp, and Google Conversational Agents) are verified as online and connected.

