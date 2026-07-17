# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Antigravity Hook Absolute Path and Directory Relocation (Date: N/A | Match Score: 0.619)

Relocated the sync_context hook to .agents/hooks/sync_context.py and updated .agents/hooks.json to use the absolute path reference, avoiding path resolution errors during runtime. Updated .agents/rules/GEMINI.md to match the new hook path.

## 📌 Workspace Rule Path Verification and Metadata Formatting (Date: N/A | Match Score: 0.615)

Corrected broken relative map paths and memory bridge script paths inside auditor.md and librarian.md to match the active root DOMAIN_MAP.md. Added standard YAML frontmatter headers to guardrails.md and documented the rules/skills metadata standards inside bootstrap.md.

## 📌 Walkthrough — Correcting Exa Search MCP Connection Configuration (Date: N/A | Match Score: 0.613)

### Walkthrough — Correcting Exa Search MCP Connection Configuration

This walkthrough summarizes the execution steps, code changes, and test results for correcting the Exa Search MCP connection string within the global IDE settings.

#### Changes Made

##### Global IDE Configuration
Updated [mcp_config.json](file:///home/dnguyen029/.gemini/antigravity-ide/mcp_config.json#L10-L16) to replace the invalid URL-parameter-based authentication for the Exa MCP server with standard header-based authentication:
- **Before**: `https://mcp.exa.ai/mcp?exaApiKey=$EXA_API_KEY&tools=web_search_exa,web_search_advanced_exa,web_fetch_exa`
- **After**: `https://mcp.exa.ai/mcp` with argument `--header "x-api-key: $EXA_API_KEY"`

#### Verification Performed

##### Automated Tests
Ran the MCP connection verifier script:
```bash
/home/dnguyen029/venv/bin/python app_build/verify_mcp_connections.py
```text
- **Result**: **All 7 servers connected successfully** (no skipped, no failed).
- **Status Report**: The verification script generated the updated [system_status_report.md](file:///home/dnguyen029/antigravity-project/production_artifacts/system_status_report.md) showing all green statuses.

---
All tasks are completed. You can now rebuild and preview the agent to verify that the initialization error is resolved!

## 📌 Walkthrough - Align Swarm Folder Maps (Date: N/A | Match Score: 0.612)

### Walkthrough - Align Swarm Folder Maps

Refactored the project workspace maps to ensure that swarm agents utilize the correct actual file paths and can leverage Obsidian-style wikilinks.

#### Changes Made

##### Documentation & References

###### [DOMAIN_MAP.md](file:///home/dnguyen029/antigravity-project/DOMAIN_MAP.md)
- Removed all legacy and non-existent paths (such as `src/core/`, `src/agents/`, `ORDER_OF_OPERATIONS.md`).
- Added correct paths pointing to the actual execution and configuration directories (`app_build/`, `.agents/`, `production_artifacts/`).
- Added dual link capability (both standard file URL markdown links and Obsidian `[[Wikilinks]]`).

---

#### Verification Results

##### Manual Verification
- Verified that all mapped directories exist within the project root (`/home/dnguyen029/antigravity-project`).
- Verified that standard markdown URLs point to valid existing workspace paths.

## 📌 Walkthrough - Configurator Alignment & Asset Decomposition Completed (Date: N/A | Match Score: 0.611)

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

