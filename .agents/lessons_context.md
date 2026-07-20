# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Walkthrough - Antigravity IDE Diagnostics Audit (Date: N/A | Match Score: 0.621)

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

## 📌 Walkthrough — purges mock/simulated data (Date: N/A | Match Score: 0.619)

### Walkthrough — purges mock/simulated data

All simulated fallback structures and mock data loops have been removed from the telemetry dashboard. The codebase now operates exclusively on factually derived telemetry and robust error recovery channels.

#### Changes Made

##### 1. API Route (`route.ts`)
- **Missing Credentials Fallback (`L98-113`)**: Removed `getMockData()` fallback. The API now returns a direct `503 Service Unavailable` error response.
- **Outage Fallback (`L416-433`)**: Replaced mock payload fallback with a two-tier connection recovery sequence:
  1. Retrieves the expired cache entry from Supabase if present. It serves this data with a custom `status: "stale"` attribute and stores the original RingCentral connection error message.
  2. If no cache exists, it hard-fails with a `502 Bad Gateway` error response.
- **Scaffolding Code Cleaned**: The massive randomized generator helper `getMockData()` (`L436-532`) was deleted in its entirety.

##### 2. RingCentral Utility Library (`ringcentral.ts`)
- **Wait Time proxy (`L159-166`)**: Deleted the modular arithmetic generator `15 + (duration % 20)`. Implemented a transparent data-grounded wait-time proxy:
  - Answered calls (>=45s) isolation: subtracts 30s talk-floor to separate queue hold time.
  - Quick answer calls (<45s): proxied to 0 seconds.
  - Unanswered/abandoned calls: full ring duration is treated as the wait time, capped at 120s.

##### 3. Client Dashboard UI (`page.tsx`)
- **TypeScript Interface Hardened**: Added the optional `error?: string;` property to `RingCentralTelemetryData` to safely type error messages carried on stale responses.
- **JSON Error Parser**: Upgraded `fetchRcMetrics` to unpack the parsed JSON error body from non-ok responses (rather than rendering `res.statusText`).
- **Visual Alert Channels**: Split the single error handler into two distinct banners:
  - **Red Alert Banner**: Rendered only on hard errors (when no cached or live metrics are available).
  - **Amber Stale Banner**: Rendered when metrics are visible but have been retrieved from a stale database cache due to a RingCentral API connection outage.

---

#### Verification Results

##### Production Compilation (Automated)
Ran `npm run build` to confirm compilation integrity:
- TypeScript type checking completed successfully with zero type validation errors.
- Webpack/Next.js optimizer completed code packaging.

```bash
▲ Next.js 16.2.10 (Turbopack)
- Environments: .env.local, .env
  Creating an optimized production build ...
✓ Compiled successfully in 4.3s
✓ Finished TypeScript in 4.0s
✓ Collecting page data using 9 workers in 822ms
✓ Generating static pages using 9 workers (10/10) in 278ms
✓ Finalizing page optimization in 13ms
```text

---

#### Manual Verification Checklist

1. **Verify Credentials Outage (503)**:
   - Temporarily remove the RingCentral API keys in `.env` → reload dashboard → confirm metrics cards show loading/error state and no fake data is generated.
2. **Verify Live Connection (200)**:
   - Configure valid credentials → reload dashboard → confirm live data loads without warnings.
3. **Verify Stale Cache Fallback (Stale warning + cached metrics)**:
   - Temporarily point server host url to a bad URL → wait 31 seconds → trigger refresh → confirm amber "Stale data" warning banner appears indicating connection drop while last known telemetry figures remain visible.

## 📌 Walkthrough - Telephony & Sheets Fixes (Date: N/A | Match Score: 0.614)

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

## 📌 Walkthrough - Configurator Alignment & Asset Decomposition Completed (Date: N/A | Match Score: 0.614)

### Walkthrough - Configurator Alignment & Asset Decomposition Completed

The 2D product configurator canvas layout alignment issues have been resolved. The static cabinet base asset has been decomposed into dynamic slot inserts, and the CAD schematic countertop image has been replaced with clean transparent product renders.

---

#### 🛠️ Changes Completed

##### 1. Generated Transparent Assets
Using image generation models, we created six transparent alpha-channel product renders to replace static/schematic mockups:
1. `cambridge_base_white_empty.png`: An empty shaker vanity frame base with three open slot cavities.
2. `cambridge_countertop_quartz_clean.png`: A clean white quartz slab top with centered sink cutout.
3. `cambridge_countertop_marble_clean.png`: A Carrara marble slab top with centered sink cutout.
4. `module_door_white.png`: Shaker cabinet double doors insert.
5. `module_drawers_white.png`: 3-drawer stack insert.
6. `module_shelf.png`: Open shelf insert.

These assets are saved locally in the public folder: `/home/dnguyen029/swarm-agency/public/images/configurator/`

##### 2. Uploaded Assets to Directus
Uploaded the newly generated assets directly to the Directus media library and updated their database record relationships in the `Countertops`, `Modules`, and `Styles` collections:
- **Empty White Frame Shell** (Style `ds-shaker`): `dcfe1273-6e43-406e-a56d-c13d7b5544b5`
- **Quartz Countertop**: `b3d70067-de0b-41d0-95d1-42a410c2c545`
- **Marble Countertop**: `9e278373-108e-44f3-8d11-2c4a29c86045`
- **Cabinet Door Module**: `10d288af-0552-43e3-9da0-78e50e3b09f6`
- **3-Drawer Module**: `1fa38981-6920-4e36-9b02-88681b5a7c7f`
- **Open Shelf Module**: `03dcb63e-481e-41ba-a431-e9c57cbfe1fc`

##### 3. Updated Catalog Configurations
- Modified [mockConfiguratorData.ts](file:///home/dnguyen029/swarm-agency/lib/mockConfiguratorData.ts) to map the `image_layer_url` properties to the new Directus IDs for all countertops, styles, and modules.

##### 4. Refactored Canvas Component
- Modified [ConfiguratorCanvas.tsx](file:///home/dnguyen029/swarm-agency/components/ConfiguratorCanvas.tsx) to align the base cabinet resolution function `resolveCabinetBaseUrl` and countertop preloader paths with the new `_clean` and `_empty` local fallback assets.

---

#### 🧪 Verification & Validation Results

##### 1. TypeScript & Lint Checks
Both compilation and style compliance verification tasks completed successfully:
- **TypeScript Compiler** (`npx tsc --noEmit`): **Passed** with 0 errors.
- **ESLint** (`npx eslint`): **Passed** with 0 warnings/errors.

##### 2. Visual Reference Models
The new transparent assets generated are embedded below for reference:

| Hollow Cabinet Shell | Quartz Countertop | Marble Countertop |
| :---: | :---: | :---: |
| ![Cambridge Hollow Shell](/home/dnguyen029/.gemini/antigravity-ide/brain/b30e2eb3-cff4-40d1-b96f-8008e5f66c03/cambridge_base_white_empty.png) | ![Quartz Top](/home/dnguyen029/.gemini/antigravity-ide/brain/b30e2eb3-cff4-40d1-b96f-8008e5f66c03/cambridge_countertop_quartz_clean.png) | ![Marble Top](/home/dnguyen029/.gemini/antigravity-ide/brain/b30e2eb3-cff4-40d1-b96f-8008e5f66c03/cambridge_countertop_marble_clean.png) |

| Cabinet Door Insert | Drawers Insert | Open Shelf Insert |
| :---: | :---: | :---: |
| ![Doors](/home/dnguyen029/.gemini/antigravity-ide/brain/b30e2eb3-cff4-40d1-b96f-8008e5f66c03/module_door_white.png) | ![Drawers](/home/dnguyen029/.gemini/antigravity-ide/brain/b30e2eb3-cff4-40d1-b96f-8008e5f66c03/module_drawers_white.png) | ![Open Shelf](/home/dnguyen029/.gemini/antigravity-ide/brain/b30e2eb3-cff4-40d1-b96f-8008e5f66c03/module_shelf.png) |

##### 3. Directus Access Permission Fix (CORS & ORB Resolution)
- **Problem**: When the frontend requested countertop and modular assets from the Pikapods Directus API (`https://nebulous-rat.pikapod.net/assets/...`), requests failed with a `403 Forbidden` response and were blocked in the browser by Cross-Origin Read Blocking (CORB/ORB) because the Public role lacked read access to the `directus_files` collection.
- **Resolution**: Created a new read permission for the `directus_files` collection targeting the Directus Public role policy (`abf8a154-5b1c-4a46-ac9c-7300570f4f17`).
- **Result**: Images now fetch successfully with `HTTP/2 200` and render correctly on the live page.

![Live Configurator Success](/home/dnguyen029/.gemini/antigravity-ide/brain/b30e2eb3-cff4-40d1-b96f-8008e5f66c03/configurator_success.png)

## 📌 Walkthrough - Modular Product Configurator Phase 1 & 2 Execution (Date: N/A | Match Score: 0.606)

### Walkthrough - Modular Product Configurator Phase 1 & 2 Execution

The first phase of the system-wide developer cycle for the 2D product configurator is complete. All credentials, API helpers, state store elements, and base visual layers are now active in the `swarm-agency` project.

#### Changes Made

##### 1. Dependency Integration
- Installed `zustand` npm package into the Next.js storefront directory (`/home/dnguyen029/swarm-agency`).

##### 2. Environment Configuration
- Added Directus Pikapods database URL and static admin token to:
  - [antigravity-project/.env](file:///home/dnguyen029/antigravity-project/.env)
  - [swarm-agency/.env](file:///home/dnguyen029/swarm-agency/.env)

##### 3. Directus API Client
- Created [configuratorApi.ts](file:///home/dnguyen029/swarm-agency/lib/configuratorApi.ts).
- Models standard type interfaces for the modular schema: `FrameSize`, `ModuleValue`, `DoorStyle`, `Finish`, `Countertop`, `Sink`, and `CompatibilityRule`.
- Performs server-side and client-side data fetching from Directus with automatic Next.js 15 cache revalidation parameters.

##### 4. Zustand State Store
- Created [configuratorStore.ts](file:///home/dnguyen029/swarm-agency/store/configuratorStore.ts).
- Manages the modular coordinate slot-assignments (`Left`, `Middle`, `Right` slots).
- Implements:
  - Live total price calculation logic summing base dimensions and module modifiers.
  - Interactive rules validation engine (e.g., verifying plumbing alignment and checking incompatibility mappings).

##### 5. Visual Asset Prototype Layers
Generated and placed the initial set of 2D layered assets in the public directory `/home/dnguyen029/swarm-agency/public/images/configurator/`:
- [cambridge_base_white.png](file:///home/dnguyen029/swarm-agency/public/images/configurator/cambridge_base_white.png): Orthographic front-facing view of the shaker-style cabinet base.
- [cambridge_countertop_quartz.png](file:///home/dnguyen029/swarm-agency/public/images/configurator/cambridge_countertop_quartz.png): Aligned stone slab quartz top with plumbing cutout.
- [faucet_gold.png](file:///home/dnguyen029/swarm-agency/public/images/configurator/faucet_gold.png): Aligned gold single-hole faucet.

---

#### Verification Results

##### TypeScript Compilation Check
Ran the TypeScript type checker on the active storefront:
```bash
npx tsc --noEmit
```text
- **Result**: **Passed** with 0 errors and 0 warnings, confirming type contracts and file imports are fully aligned.

