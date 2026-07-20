# 🚀 Antigravity 2.0 Workspace Bootstrap Guide

This document defines the host environment specification, installation prerequisites, file paths, and pre-flight check commands for setting up and verifying the Antigravity 2.0 workspace.

---

## 💻 Host Environment & Software Stack

* **Device**: Asus cx5403 expertbook chromebook plus (Linux development environment)
* **Execution Paths**:
  * Python runtime: `/usr/bin/python3`
  * Toon Server runtime: `.agents/skills/toon-mcp/mcp-server-toon/.venv/bin/python` (isolated for dependency management)

### Software Components

1. **Antigravity 2.0 Desktop App**: Standalone "Mission Control" desktop application for orchestration.
2. **Antigravity IDE 2.0 App**: Standalone code editor and agent workspace environment (Go-based loader).
3. **Antigravity CLI and Python SDK**: The underlying engine (`agy` CLI tool) executing agent lifecycles.

### Configuration Hierarchy

* **`settings.json`**: Global preferences, agent tool permissions (e.g., enabling `ShellTool`), and UI status bar indicators (e.g., displaying the active `quota`).
* **`config.json`**: Security and policy engine settings containing `globalPermissionGrants` that authorize command execution and directory reads without constant prompt interruptions.
* **`mcp_config.json`**: Connector definitions mapping command executions, keys, and environments for active MCP tool servers (Supabase, Exa).

---

## 🔧 One-Time Installation Setup

The command-line tools are installed once on the machine. You do not need to execute these commands during regular development sessions.

```bash
# Install the Google Agents CLI tool globally (one-time operation)
uv tool install google-agents-cli
```

---

## 🔑 GCP Service Account Authentication

If you encounter authentication or read permission denied errors when using the `google-conversational-agents` MCP server:

```bash
# Authenticate the environment using the service account key
gcloud auth activate-service-account sheets-receptionist-sa@arielcsx.iam.gserviceaccount.com --key-file=/home/dnguyen029/telemetry-dashboard/sheets-receptionist-key.json --project=arielcsx
```

This guarantees that both the host terminal and the stdio proxy connections inherit the correct permissions to query and modify Dialogflow CX agents on the Google Conversational Agents platform.

### 📊 Google Workspace MCP Integration

For developer agents operating within the Antigravity TUI, CLI, and IDE, you should use the native **Google Workspace MCP servers** (Gmail, Drive, Calendar). This replaces the older GWS CLI setup. 

To prevent context bloat and keep tool definitions under the recommended limit of 50, we restrict access strictly to essential tools for Drive, Gmail, and Calendar, and disable Chat and People completely.

#### 1. Setup inside `mcp_config.json`
Add the following configuration blocks to both your local project `mcp_config.json` and global `~/.gemini/antigravity-ide/mcp_config.json`:

```json
    "gmail": {
      "serverUrl": "https://gmailmcp.googleapis.com/mcp/v1",
      "oauth": {
        "clientId": "YOUR_OAUTH_CLIENT_ID",
        "clientSecret": "YOUR_OAUTH_CLIENT_SECRET"
      },
      "enabled_tools": ["search_threads", "create_draft"]
    },
    "drive": {
      "serverUrl": "https://drivemcp.googleapis.com/mcp/v1",
      "oauth": {
        "clientId": "YOUR_OAUTH_CLIENT_ID",
        "clientSecret": "YOUR_OAUTH_CLIENT_SECRET"
      },
      "enabled_tools": ["search_files", "read_file_content", "create_file"]
    },
    "calendar": {
      "serverUrl": "https://calendarmcp.googleapis.com/mcp/v1",
      "oauth": {
        "clientId": "YOUR_OAUTH_CLIENT_ID",
        "clientSecret": "YOUR_OAUTH_CLIENT_SECRET"
      },
      "enabled_tools": ["list_events"]
    }
```

#### 2. Authentication
Once added, open the settings screen in the IDE (or TUI panel `/mcp`), find each server in the customizations list, click **Authenticate**, sign in with your Google account, and submit the authorization code.

---

### ⚠️ Legacy Google Workspace CLI (`gws`) Setup (Deprecated)

The old `gws` CLI tool remains configured for legacy automation tasks. Since the terminal sandbox restricts standard CLI access, use the absolute path and Service Account settings:

1. **Absolute Binary Path**:
   ```bash
   /home/dnguyen029/.local/share/pnpm/nodejs/22.22.2/lib/node_modules/@googleworkspace/cli/node_modules/.bin_real/gws <service> <resource> <method> [flags]
   ```

2. **Credentials Env**:
   ```bash
   export GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE=/home/dnguyen029/telemetry-dashboard/sheets-receptionist-key.json
   ```

3. **Required Sharing**: Share files/folders with the service account email: `sheets-receptionist-sa@arielcsx.iam.gserviceaccount.com`

---

## 📁 Key Workspace Paths & Configurations

* **Local MCP Config**: [mcp_config.json](file:///home/dnguyen029/telemetry-dashboard/mcp_config.json)
* **Global Desktop Settings**: [mcp_config.json (Desktop)](file:///home/dnguyen029/.gemini/antigravity/mcp_config.json)
* **Global IDE Settings**: [mcp_config.json (IDE)](file:///home/dnguyen029/.gemini/antigravity-ide/mcp_config.json)
* **Environment Variables**: [.env](file:///home/dnguyen029/telemetry-dashboard/.env)
* **Swarm Orchestrator (Archived/Deprecated)**: `native_orchestrator.py` (moved to `/home/dnguyen029/archived_swarm/`)
* **Connection Verifier**: [verify_mcp_connections.py](file:///home/dnguyen029/telemetry-dashboard/app_build/verify_mcp_connections.py)
* **Hook Configurations Registry**: [hooks.json](file:///home/dnguyen029/telemetry-dashboard/.agents/hooks.json)
* **Quality Gate Validator**: [python-validate.sh](file:///home/dnguyen029/telemetry-dashboard/.agents/hooks/python-validate.sh)
* **System Logs Directory**: `/home/dnguyen029/.gemini/antigravity-cli/brain/`

---

## 🔌 Pre-Flight Health Diagnostics

Before executing swarm tasks or coding operations, verify the health of all tool servers (Exa, Supabase, TOON, Context MCP):

```bash
/usr/bin/python3 app_build/verify_mcp_connections.py
```

This updates [system_status_report.md](file:///home/dnguyen029/telemetry-dashboard/production_artifacts/system_status_report.md) with active server response times and health status.

### 🧹 Process Hygiene and Cleanup

To prevent lingering background processes and duplicate MCP connections when wrapping CLI utilities or `mcp-remote` proxies:
* **Process Groups**: The wrapper (`mcp_timeout_wrapper.py`) starts subprocesses in their own isolated session groups using `preexec_fn=os.setsid`.
* **Clean Termination**: Upon session shutdown or timeout, the wrapper issues termination signals to the entire group (`os.killpg(os.getpgid(proc.pid), signal.SIGTERM)`) rather than just the parent shell, cleaning up nested shells and Node/npx proxies.
* **Orphan Sweeper**: The pre-flight connection script (`verify_mcp_connections.py`) scans `/proc` on startup and terminates duplicate and orphaned MCP connection processes left by crashed sessions.

---

## ⚙️ MCP Configuration & Transport Resolution

All remote HTTP/SSE connections loaded inside the Go-based Antigravity IDE require stdio wrappers via `mcp-remote`. Declare headers as CLI flags in the arguments array:

```json
"supabase": {
  "command": "bash",
  "args": [
    "-c",
    "npx -y mcp-remote \"https://mcp.supabase.com/mcp?project_ref=gqcnnwtytzqweoxtpnyz&features=database\" --header \"Authorization:Bearer YOUR_TOKEN\""
  ]
}
```

> [!IMPORTANT]
> **Transport Resolution for Google Conversational Agents**: Some remote servers reject default Streamable HTTP negotiation checks, resulting in silent hangs or connection timeout errors. For these servers, you **must** append the `--transport http-only` flag to the proxy arguments:

---

## 📄 Rule and Skill File Metadata Standards (YAML Frontmatter)

In Antigravity 2.0, all Rule and Skill files must use standard YAML frontmatter headers at the top of their Markdown content. This metadata is parsed by the high-level routing engine to enable progressive context disclosure (loading rules on-demand, which saves tokens).

### 1. Rules Files (`.agents/rules/` or global `~/.gemini/`)

Rules files use YAML frontmatter to define how they are triggered and describe their purpose to the router:

```yaml
---
trigger: always_on
description: Swarm safety constraints, cost bounds, and destructive command blocks.
---
# Rules Content Title
...
```

* **Trigger values**:
  * `always_on`: Applied to every turn.
  * `manual`: Only loaded when explicitly mentioned/called.
  * `model_decision`: The router dynamically decides if this rule applies based on its description.
  * `glob`: Loaded when matching files are modified (e.g. `glob: "**/*.py"`).

### 2. Skills Files (`.agents/skills/<skill_name>/SKILL.md`)

Skills must declare their metadata so they can be parsed for tool activations:

```yaml
---
name: my-custom-skill
description: Useful for compiling python scripts and testing API connections.
---
# Skill Title
...
```
