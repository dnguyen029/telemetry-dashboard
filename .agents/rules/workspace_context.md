---
trigger: always_on
description: Environment specifications, runtime paths, and workspace details for the standalone Antigravity IDE 2.0.
---

# Standalone Antigravity IDE 2.0 Workspace Environment

> [!IMPORTANT]
> **🚨 CRITICAL ARCHITECTURE MANDATE**
> Antigravity IDE 2.0 is a **standalone Go-based desktop application** running locally in the Chromebook's Linux container. It is **NOT** a VS Code extension, a browser-based web editor, or a remote cloud shell. All file operations, terminals, and commands execute directly within this local standalone desktop environment.

This document defines the host environment specification for the active workspace context in the standalone Antigravity IDE 2.0 application.

## 💻 Environment Specifications

- **OS**: Linux (Asus Chromebook Plus Linux container)
- **Active Workspace Directory**: `/home/dnguyen029/telemetry-dashboard`
- **Active Python Virtual Environment**: `/usr/bin/python3`
- **Toon Server Runtime**: `/home/dnguyen029/telemetry-dashboard/.agents/skills/toon-mcp/mcp-server-toon/.venv/bin/python`
- **Global IDE Application Data Directory**: `/home/dnguyen029/.gemini/antigravity-ide/`
- **Active CLI Execution Path**: `/home/dnguyen029/.local/bin/agy`

## 🔌 Integrated Services & Configurations

- **Database (Supabase)**: Configured using stdio `mcp-remote` connection wrapper in [mcp_config.json](file:///home/dnguyen029/.gemini/antigravity-ide/mcp_config.json).
- **Search (Exa)**: Configured via `exa` MCP tool mappings.
- **Environment Variables**: Loaded dynamically from local project [.env](file:///home/dnguyen029/telemetry-dashboard/.env).

> [!WARNING]
> **🚨 CRITICAL ENVIRONMENT MANDATES (DO NOT ALTER)**
> * **Python Interpreter Lock**: The workspace interpreter settings in `.vscode/settings.json` MUST remain locked to `/home/dnguyen029/telemetry-dashboard/.venv/bin/python`. Do NOT modify this to point to any global virtual environments, as doing so breaks standard IDE extension activation and throws the error `command 'python-envs.set' not found`.
> * **Stdio Wrapper Mandate**: Remote HTTP/SSE server configurations in `mcp_config.json` (such as Supabase and Exa) MUST utilize the `npx -y mcp-remote` stdio wrapper for the Go-based IDE loader. Do NOT configure direct HTTP/SSE properties in the local IDE configurations.

## 💡 Usage Mandate

Before asking the user about workspace paths, runtime virtual environments, configuration file schemas, or OS specs, refer to these specs. This environment context is persistent.
