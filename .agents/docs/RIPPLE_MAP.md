# 🌊 RIPPLE_MAP.md - Architectural Dependency & Propagation Guide (2.0 IDE Edition)

> **Mandate**: When one "Primary Anchor" is modified, all "Downstream Echoes" MUST be synchronized in the same turn to prevent architectural drift and configuration conflicts in the standalone Antigravity IDE 2.0.

---

## 🛡️ 1. Swarm Rules & Governance

**Objective**: Ensuring consistency across agent rules, personas, and communication standards.

| Primary Anchor | Downstream Echoes (MUST SYNC) | Check Command / Method |
| :--- | :--- | :--- |
| **`AGENTS.md`** (Swarm Mandates) | [`.agents/rules/AGENTS.md`](file:///home/dnguyen029/antigravity-project/.agents/rules/AGENTS.md), [`bootstrap.md`](file:///home/dnguyen029/antigravity-project/bootstrap.md) | Verify rule definitions are parsed cleanly by the router |
| **`bootstrap.md`** (Host Specs) | [`.agents/rules/workspace_context.md`](file:///home/dnguyen029/antigravity-project/.agents/rules/workspace_context.md), [`.agents/rules/GEMINI.md`](file:///home/dnguyen029/antigravity-project/.agents/rules/GEMINI.md) | Ensure virtual environment runtimes match active config |

---

## 🔌 2. MCP Config & Tool Connections

**Objective**: Preventing timeout errors and ensuring 100% active tool servers.

| Primary Anchor | Downstream Echoes (MUST SYNC) | Check Command / Method |
| :--- | :--- | :--- |
| **`mcp_config.json`** (Local) | [`~/.gemini/antigravity-ide/mcp_config.json`](file:///home/dnguyen029/.gemini/antigravity-ide/mcp_config.json), [`app_build/verify_mcp_connections.py`](file:///home/dnguyen029/antigravity-project/app_build/verify_mcp_connections.py) | Run `python app_build/verify_mcp_connections.py` to confirm 7/7 connected |
| **`.env`** (Environment Keys) | [`mcp_config.json`](file:///home/dnguyen029/antigravity-project/mcp_config.json), [`~/.gemini/antigravity-ide/mcp_oauth_tokens.json`](file:///home/dnguyen029/.gemini/antigravity-ide/mcp_oauth_tokens.json) | Check environment keys are sourced cleanly |
| **`mcp-remote` version pin** | Both `mcp_config.json` copies must use same `@version` tag | Grep both configs for `mcp-remote@` to verify they match |

---

## 🧠 3. Database & Memory (L3)

**Objective**: Archiving lessons learned and synchronizing knowledge vaults.

| Primary Anchor | Downstream Echoes (MUST SYNC) | Check Command / Method |
| :--- | :--- | :--- |
| **Supabase schema** (`lessons_learned`) | [`.agents/hooks/sync_context.py`](file:///home/dnguyen029/antigravity-project/.agents/hooks/sync_context.py), [`app_build/main.py`](file:///home/dnguyen029/antigravity-project/app_build/main.py) | Run python .agents/hooks/sync_context.py to sync active context |
| **`.agents/hooks.json`** (Hook Registry) | [`.agents/hooks/flush_pending_lessons.py`](file:///home/dnguyen029/antigravity-project/.agents/hooks/flush_pending_lessons.py), [`.agents/hooks/archive_lessons.py`](file:///home/dnguyen029/antigravity-project/.agents/hooks/archive_lessons.py) | Any new hook file MUST be registered in `hooks.json` PreInvocation or PostInvocation |
| **`pending_lessons.json`** (Retry Queue) | [`.agents/hooks/flush_pending_lessons.py`](file:///home/dnguyen029/antigravity-project/.agents/hooks/flush_pending_lessons.py) | Queue is auto-flushed on session boot; max 10 retries per lesson before drop |
| **Active Task State** | [`production_artifacts/agent_live.md`](file:///home/dnguyen029/antigravity-project/production_artifacts/agent_live.md) | Check Mermaid execution graph status |

## 📋 4. CRM & Vertex AI Parameter Schema Lock

**Objective**: Ensuring CRM columns, Vertex AI agent input parameters, and tool execution signatures are completely synchronized.

| Primary Anchor | Downstream Echoes (MUST SYNC) | Check Command / Method |
| :--- | :--- | :--- |
| **Agent Parameter** (e.g. `phone_number`) | [`RECEPTIONIST_SOP.md`](file:///home/dnguyen029/antigravity-project/.agents/docs/RECEPTIONIST_SOP.md), [`app_build/receptionist/app/tools.py`](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools.py), [`app_build/receptionist/app/tools_lib/sheets.py`](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools_lib/sheets.py), [`app_build/receptionist/app/tools_lib/zendesk.py`](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/tools_lib/zendesk.py), [`app_build/tools/sheets.py`](file:///home/dnguyen029/antigravity-project/app_build/tools/sheets.py), [`app_build/main.py`](file:///home/dnguyen029/antigravity-project/app_build/main.py) | Verify Pydantic models and function signatures match the agent parameters and Google Sheet header names exactly. |

---

## 🤖 5. Vertex AI & CX Agent Studio Deployment Sync

**Objective**: Ensuring prompt changes and agent graph modifications are successfully packaged and deployed to Cloud Run/Vertex AI, reflecting in the CX Agent Studio Console.

| Primary Anchor | Downstream Echoes (MUST SYNC) | Check Command / Method |
| :--- | :--- | :--- |
| **Agent Prompts** ([`.agents/agents/`](file:///home/dnguyen029/antigravity-project/.agents/agents/)) | Local packaged directory ([`app_build/receptionist/app/agents/`](file:///home/dnguyen029/antigravity-project/app_build/receptionist/app/agents/)) | Copy prompts into local packaged directory before running `agents-cli deploy` |
| **ADK Graph Logic / Prompts** ([`app_build/receptionist/`](file:///home/dnguyen029/antigravity-project/app_build/receptionist/)) | Vertex AI Reasoning Engine & CX Agent Studio Console | Run `agents-cli deploy --no-confirm-project` to synchronize both the Cloud Run deployment and the CX Agent Studio Console |

---

## 🔄 6. Propagation Protocol

1. **Identify**: Use this map to check which configuration files or documents are impacted when you edit an anchor.
2. **Execute**: Modify the anchor and synchronize all downstream echoes in the same turn.
3. **Verify**: Run `python app_build/verify_mcp_connections.py` to validate standard connectivity and syntax parameters.
4. **Archival**: Log resolved features or changes in Supabase and sync context.
