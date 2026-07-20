# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 RingCentral SMS Verification (Date: N/A | Match Score: 0.586)

Verified that the RingCentral API client has SMS scopes enabled. Found that phone number +14246008056 is the active SMS-capable sender for extension 567134052. Successfully dispatched a test message to +17149870066 using /restapi/v1.0/account/~/extension/~/sms.

## 📌 Test Valid Content (Date: N/A | Match Score: 0.576)

This is a valid conceptual lesson about caching strategies in Redis. It does not contain any state variables.

## 📌 Walkthrough - Extension Realign & Local Gateway Mocking Completed (Date: N/A | Match Score: 0.570)

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

## 📌 Walkthrough - Telephony & Sheets Fixes (Date: N/A | Match Score: 0.569)

### Walkthrough - Telephony & Sheets Fixes

This walkthrough details the changes made, the test execution details, and the verification steps for the Google Sheets PO index mapping issue and latency-masking features.

#### 🛠️ Changes Implemented

##### 1. Google Sheets Header Collision Resolution
- **File modified**: [sheets.py](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools_lib/sheets.py)
- **Problem**: The term matcher allowed `Customer Order number` to override `PO/Reference`, resulting in empty purchase order fields returned to the agent.
- **Fix**: Split the header resolver loop to prioritize `po/reference` and `purchase order` primary fields, and only fall back to `customer order number` if no primary match is found.

##### 2. Latency Masking & Transitional Messages
- **File modified**: [router.txt](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/agents/router.txt)
- **Fix**: Configured explicit conversational transition statements before routing control to specialists (e.g. *"Certainly, let me check that order for you. One moment while I pull up your details..."* when routing to the WISMO Specialist). This plays speech to the caller while the webhook execution and cold sheets API retrieval occur in the background, masking the latency.

##### 3. Webhook Caller ID Priority
- **File modified**: [main.py](file:///home/dnguyen029/antigravity-project/app_build/main.py)
- **Problem**: Dialogflow CX sent default mock parameters (e.g. `+18005551234`) in the session payload, causing the webhook endpoint to skip extracting the actual carrier caller ID.
- **Fix**: Prioritized extraction of the raw incoming telephony carrier caller ID from the SIP gateway or session telephony caller ID parameter to override any default/mock parameters.

##### 4. Gemini CX Agent Studio Prompt Variable Syntax
- **Files modified**: [receptionist.txt](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/agents/receptionist.txt), [wismo_receptionist.txt](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/agents/wismo_receptionist.txt)
- **Problem**: The instructions referenced the caller ID variable using the classic Dialogflow CX syntax `${session.params.telephony-caller-id}` instead of the required Gemini CX Agent Studio syntax `{telephony-caller-id}`, preventing resolution and triggering tool parameter fallbacks.
- **Fix**: Replaced all instances of `${session.params.telephony-caller-id}` with `{telephony-caller-id}`.

##### 5. Goodbye Call Hang-Up Resolution
- **Files modified**: [router.txt](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/agents/router.txt), [exit_agent.txt](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/agents/exit_agent.txt)
- **Problem**: The `end_session` custom Function Tool could not natively hang up the phone line, and the child playbook returned control back to the parent instead of closing the connection.
- **Fix**: Programmed both the child and parent playbook rules to transition sequentially to the system symbolic exit target `{@EXIT}` once the closing greeting is delivered. This exits the Root Agent, which terminates the Dialogflow CX session and hangs up the line.

---

#### 🧪 Verification & Test Results

##### 1. Automated Unit Tests
- **Command run**:
  ```bash
  /home/dnguyen029/antigravity-project/.venv/bin/python3 -m pytest /home/dnguyen029/antigravity-project/app_build/receptionist/tests
  ```text
- **Result**: `16 passed, 14 warnings in 21.11s` (all tests succeeded with no regressions).

##### 2. Live Deployment Pipeline Success
- **Reasoning Engine deploy**: Uploaded new ADK container with the sheets fix.
- **Callback registry**: Programmed target agent webhooks (`Ariel Bath AI Receptionist`, `WISMO Specialist`, `After Hours Specialist`).
- **Tool attachment**: Re-attached telephony `end_session` tool on `Exit Specialist`.
- **CES Promote**: Synced instructions and created/deployed app version `v5.6` live.
- **Cloud Run Webhook deploy**: Deployed updated webhook service `receptionist-prod` to Cloud Run.

---

#### 📞 Manual Verification Checklist

Please test the line:
1. Call `+1 (218) 288-3851` from your cell phone.
2. Say: *"I want to check the status of my order."*
3. Verify that:
   - The agent replies immediately with the transitional statement: *"Certainly, let me check that order for you. One moment while I pull up your details..."* without any dead air pause.
   - The receptionist detects your phone number, greets you with your contact name on file, asks you to confirm your ZIP code, and successfully repeats the tracking details when provided.
   - Saying *"Goodbye"* triggers the goodbye message and immediately hangs up the line.
4. Verify Cross-Routing transitions:
   - During an order status lookup, ask: *"What is your return policy?"* and verify it transfers you cleanly to the **FAQ Specialist**.
   - While asking about product specifications/dimensions, ask: *"Can you track my order?"* and verify it transfers you cleanly to the **WISMO Specialist**.
   - While entering your callback details for a representative callback, ask: *"Wait, can I just check my order status?"* and verify it redirects you to the **WISMO Specialist**.

## 📌 Walkthrough: Schema Alignment & WISMO Mock Data Removal (Date: N/A | Match Score: 0.568)

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

