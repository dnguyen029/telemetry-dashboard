# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Walkthrough - Standalone Admin Portal & RingCentral Dashboard (Date: N/A | Match Score: 0.603)

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

#### 📊 Dashboard Visual Tour & Recordings

We recorded the interactive session of the dashboard, displaying the new **Abandoned Call Stats**, the **Hourly Call Distribution Chart**, and the **Active Queue Breakdown**:

![Dashboard Verification Walkthrough Recording](/home/dnguyen029/.gemini/antigravity-ide/brain/e8178b26-79b5-49b2-a50a-e4cadf093911/dashboard_update_check_1784223809756.webp)

##### Visual Layout Verification:
````carousel
![Inbound KPI cards showing Answered, Missed, and Abandoned stats](/home/dnguyen029/.gemini/antigravity-ide/brain/e8178b26-79b5-49b2-a50a-e4cadf093911/admin_dashboard_initial_1784223816013.png)
<!-- slide -->
![Peak load periods bar chart at the bottom](/home/dnguyen029/.gemini/antigravity-ide/brain/e8178b26-79b5-49b2-a50a-e4cadf093911/admin_dashboard_top_1784223820501.png)
````

---

#### How to Test Locally

1. Settle in the directory and run the local development server:
   ```bash
   npm run dev --prefix /home/dnguyen029/swarm-agency
   ```text
2. Navigate to `http://localhost:3000/admin`.
3. Verify the passcode validation using the key `admin`.
4. Inspect the default landing view (RingCentral Status) showing active call queues (with queue-by-queue breakdowns), abandonment rates, and the peak load hour breakdown.

## 📌 Agent Guidelines & Mandate Realignment (Date: N/A | Match Score: 0.593)

Updated AGENTS.md to include Rule 3 - Exa Search Priority. All swarm agents are now directed to prioritize Exa MCP tools (web_search_exa, web_search_advanced_exa, web_fetch_exa) over native browser/generic searches to prevent token bloat, optimize context budgets, and receive cleaner search outputs.

## 📌 Walkthrough: Chrome Extension Upgraded Features & Signals (Date: N/A | Match Score: 0.589)

### Walkthrough: Chrome Extension Upgraded Features & Signals

This walkthrough documents the design and functional enhancements added to our research chrome extension side panel for extracting marketing, localization, performance, and social signals.

---

#### 🚀 Accomplished Work

##### 📊 1. Marketing Pixels & Localization Extraction
-   **Target Component**: [content.js](file:///home/dnguyen029/antigravity-project/app_build/research_spy_extension/content.js)
-   **Changes**:
    -   Enhanced transient script injection to extract active marketing trackers: Facebook Pixel (`window.fbq`), TikTok Pixel (`window.ttq`), and Google Pixel/GTM (`window.google_tag_manager` / `window.ga` / `window.gtag`).
    -   Scraped primary market configurations from the Shopify context: active currency (`window.Shopify.currency.active`) and target country (`window.Shopify.country`).
    -   Cleaned up all injected document attributes after extraction to maintain target site DOM integrity.
-   **Result**: Agents get marketing stack configurations and market targets directly on store analysis.

##### ⚡ 2. Page Load Performance Speed
-   **Target Component**: [content.js](file:///home/dnguyen029/antigravity-project/app_build/research_spy_extension/content.js)
-   **Changes**:
    -   Queried Navigation Timing API timings (`window.performance.timing`) to calculate page render speed: `loadEventEnd - navigationStart`.
    -   Created fallback calculation using `performance.now()` if the load event did not finalize.
-   **Result**: Displays actual rendering speed directly to benchmark performance.

##### 🔗 3. Social Handles Detection
-   **Target Component**: [content.js](file:///home/dnguyen029/antigravity-project/app_build/research_spy_extension/content.js)
-   **Changes**:
    -   Added href pattern matching for standard social channels: Instagram, Facebook, TikTok, Twitter/X, Pinterest, and YouTube.
    -   Constructed a unique platform mapping payload bubbling handles back to the sidebar.
-   **Result**: Locates and formats direct competitor social links automatically.

##### 🎨 4. Sleek UI Integration
-   **Target Components**:
    -   [sidepanel.html](file:///home/dnguyen029/antigravity-project/app_build/research_spy_extension/sidepanel/sidepanel.html)
    -   [sidepanel.js](file:///home/dnguyen029/antigravity-project/app_build/research_spy_extension/sidepanel/sidepanel.js)
-   **Changes**:
    -   Added structural specs for target market details, page speed metrics, pixel badges, and social platform buttons.
    -   Populated elements securely using sanitized parameters (`textContent`, strict string domain regex matches, and secure `startsWith("http")` links to block `javascript:` links).
-   **Result**: Clean grid display that fits seamlessly inside our Slate & Indigo layout.

---

#### 🔬 Validation Results
-   **Syntax Compliance**: Run `/bin/bash .agents/hooks/python-validate.sh` - Successful with no errors.
-   **Git Diff Inspection**: Verified clean diff formatting with no trailing junk or syntax anomalies.

## 📌 Walkthrough: RingCentral Dashboard Telemetry Enhancements (Date: N/A | Match Score: 0.583)

### Walkthrough: RingCentral Dashboard Telemetry Enhancements

We have successfully refactored the RingCentral telemetry API route to resolve timezone display misalignments, prevent API rate-limit exhaustion in serverless environments, and ensure call logs are not truncated when call counts exceed the single-page limit.

#### Changes Completed

##### 1. Database Cache Provisioning
- **Table Created**: Created the `public.telemetry_cache` table in the Supabase database.
- **Security Hardening**: Enabled Row Level Security (RLS) on `telemetry_cache` to block anonymous public queries while permitting service-role updates from the Next.js API.

##### 2. Timezone Realignment
- **Local Midnight Computation**: Replaced the rolling 24-hour UTC window in [route.ts](file:///home/dnguyen029/swarm-agency/app/api/ringcentral/route.ts) with dynamic PST/PDT midnight calculations using the `getPacificMidnightISO()` timezone-safe helper. This ensures the "Today's Call Volume" metrics properly reset at local calendar-day midnight (America/Los_Angeles timezone).

##### 3. Database-Persistent Caching
- **Supabase Integration**: Replaced the volatile Next.js in-memory variables (`cachedPayload`, `lastCacheTime`) with direct read and write actions to the `telemetry_cache` table using the existing Supabase client.
- **Rate-Limit Guarding**: Applied a robust 30-second TTL to the cached record. Even in serverless cold starts, all containers query the single source-of-truth cache in Supabase before querying RingCentral.

##### 4. Call-Log Pagination
- **Accurate Totals**: Replaced the single `perPage=1000` fetch with an iterative pagination loop checking for the existence of subsequent pages in the `navigation.nextPage` field, ensuring complete call capture.

---

#### Verification & Testing Results

##### 1. TypeScript & Lint Checks
- Ran `npx tsc --noEmit` and confirmed clean compilation with **0 errors**.
- Verified lint output.

##### 2. Endpoint Verification
Started the Next.js development server locally and performed queries using `curl`:
- **First Query (Cache Miss)**: Queried `http://localhost:3000/api/ringcentral`.
  - **Result**: Compiled and ran successfully. Returned status `online` and integration source `"RingCentral Live API"` with `"cached": false` in `2859ms`.
- **Second Query (Cache Hit)**: Re-queried `http://localhost:3000/api/ringcentral` immediately.
  - **Result**: Returned cached data instantly with `"cached": true` in `198ms`.
- **Database Verification**: Verified the cached JSON payload is written correctly to the `telemetry_cache` table in the database with status `online` and a valid UTC timestamp.

## 📌 Agent Profile Updates & Handshake Sealing (Date: N/A | Match Score: 0.575)

Hardcoded the Exa Search Priority rule directly into individual agent prompt cards (architect.txt, auditor.txt, builder.txt, librarian.txt, sre.txt) under Boundaries & Constraints. All agents are now programmatically constrained to use Exa search endpoints.

