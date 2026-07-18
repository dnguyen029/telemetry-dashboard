# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Walkthrough - Telephony & Sheets Fixes (Date: N/A | Match Score: 0.570)

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

## 📌 Walkthrough - Standalone Admin Portal & RingCentral Dashboard (Date: N/A | Match Score: 0.566)

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

