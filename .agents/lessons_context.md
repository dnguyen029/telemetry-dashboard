# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Test Lesson from IDE Agent (Date: N/A | Match Score: 0.683)

This is a test lesson verifying the new manual archive script and automated vector embedding calculation.

## 📌 Resolving Pyright extraPaths and sibling imports in Python tests (Date: N/A | Match Score: 0.655)

Pyright is unable to resolve dynamic runtime modifications to sys.path such as sys.path.insert(0, tools_path) when performing static analysis. This leads to false 'Cannot find module' linting errors in the IDE for files like project_utils. Specifying extraPaths in pyrightconfig.json resolves the static check. However, running pytest from the root folder also fails if sibling/child import paths are not dynamically appended to sys.path at runtime in Python (NameError/ModuleNotFoundError). Explicitly inserting the module's parent folder into sys.path at the top of context_mcp_server.py and archive_lesson.py ensures correct runtime resolution for testing frameworks.

## 📌 Test Valid Content (Date: N/A | Match Score: 0.654)

This is a valid conceptual lesson about caching strategies in Redis. It does not contain any state variables.

## 📌 Walkthrough: Audit of MCP Configurations and Swarm Hook Refactoring (Date: N/A | Match Score: 0.642)

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

## 📌 Walkthrough: Semantic Vector Search Integration (Date: N/A | Match Score: 0.623)

### Walkthrough: Semantic Vector Search Integration

We have successfully migrated the `context-mcp` lessons learned retrieval system from static chronological ordering to context-aware semantic search powered by Supabase `pgvector` and Google GenAI embeddings.

#### Changes Made

##### 1. Database Backfill
- Created a one-time scratch script [backfill_embeddings.py](file:///home/dnguyen029/.gemini/antigravity-ide/brain/8e777cd2-3fea-4f8c-aad1-9e650e74f033/scratch/backfill_embeddings.py) to generate 384-dimensional embeddings (using `models/gemini-embedding-001`) for all existing lessons in Supabase and update them.
- Executed the backfill script successfully, updating all 45 historical lessons in the database.

##### 2. Archival Pipeline Updates
- Modified [.agents/hooks/archive_lessons.py](file:///home/dnguyen029/antigravity-project/.agents/hooks/archive_lessons.py) to call the Google GenAI embeddings API whenever a new walkthrough/lesson is archived.
- The generated 384-dimensional embedding is stored directly in the `embedding` column on insert.

##### 3. Context MCP Server Upgrades
- Modified [context_mcp_server.py](file:///home/dnguyen029/antigravity-project/app_build/tools/context_mcp_server.py) to add a `query` parameter to the `lessons` prompt and `get_supabase_lessons()` helper.
- If a query is provided, the server generates an embedding and performs a cosine-similarity vector search via Supabase's `match_lessons` RPC database function.
- Implemented robust fallback logic: if no query is passed, or if the API/database call fails, it falls back gracefully to retrieving the latest 5 lessons chronologically.

---

#### Verification & Testing

##### Automated Test Suite
- Created [test_vector_search.py](file:///home/dnguyen029/antigravity-project/app_build/test_vector_search.py) to programmatically test both code paths.
- **Test 1 (Fallback Verification):** Verified that sending an empty query correctly falls back to chronological retrieval (using the header `=== LESSONS LEARNED (Latest Chronological — ground truth) ===`).
- **Test 2 (Vector Search Verification):** Verified that sending a query (e.g. `"Dialogflow agent playbooks"`) generates the embedding, invokes Supabase's `match_lessons` function, and retrieves context-relevant lessons (using the header `=== LESSONS LEARNED (Semantic Vector Search — ground truth) ===`).

Both verification tests completed successfully.

