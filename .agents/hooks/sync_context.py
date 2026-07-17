#!/usr/bin/env python3
import sys
import json
import os

def main():
    try:
        # Resolve project root dynamically
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

        # 1. Non-blocking Stream Protection
        if sys.stdin.isatty():
            # Return empty schema error on wrong TTY binds
            print(json.dumps({}), flush=True)
            return

        # Read the post-invocation hook details from stdin
        input_data = sys.stdin.read()
        # Debug logging to verify key names
        debug_payload_path = os.path.join(project_root, "debug_hook_payload.json")
        with open(debug_payload_path, "w") as df:
            df.write(input_data)
            
        if not input_data.strip():
            print(json.dumps({}), flush=True)
            return
            
        payload = json.loads(input_data)
        tool_call = payload.get("toolCall", {})
        tool_name = tool_call.get("name")
        arguments = tool_call.get("args", {})
        response = payload.get("response", {})
        artifact_dir = payload.get("artifactDirectoryPath")
    except Exception as e:
        # Protobuf expects strict unmarshaling; on error, pass an empty object
        # to prevent crashing the agent executor runtime loop.
        print(json.dumps({}), flush=True)
        return

    # 2. State & Context Synchronization Logic
    try:
        # Pre-flight: Workspace Integrity Checks
        bootstrap_path = os.path.join(project_root, "bootstrap.md")
        ripple_path = os.path.join(project_root, "RIPPLE_MAP.md")
        if not os.path.exists(bootstrap_path) or not os.path.exists(ripple_path):
            print(json.dumps({}), flush=True)
            return

        live_file_path = os.path.join(project_root, "production_artifacts/agent_live.md")
        
        # Pre-flight checks:
        # 1. Ensure parent directory exists (auto-create if missing)
        parent_dir = os.path.dirname(live_file_path)
        if not os.path.exists(parent_dir):
            os.makedirs(parent_dir, exist_ok=True)
            
        # 2. Ensure parent directory is writeable (if file doesn't exist yet)
        if not os.path.exists(live_file_path):
            if not os.access(parent_dir, os.W_OK):
                print(json.dumps({}), flush=True)
                return
        # 3. Ensure target file is writeable if it exists
        elif not os.access(live_file_path, os.W_OK):
            print(json.dumps({}), flush=True)
            return

        tool_to_phase = {
            "write_to_file": "Creating File",
            "replace_file_content": "Modifying File",
            "multi_replace_file_content": "Multi-Line Modification",
            "run_command": "Executing Command",
            "view_file": "Viewing File",
            "list_dir": "Listing Directory",
            "grep_search": "Searching Codebase",
        }
        phase = tool_to_phase.get(tool_name, f"Executing {tool_name}")
        
        target = ""
        if tool_name in ["write_to_file", "replace_file_content", "multi_replace_file_content", "view_file"]:
            target = (
                arguments.get("targetFile") or 
                arguments.get("TargetFile") or 
                arguments.get("target_file") or
                arguments.get("absolutePath") or 
                arguments.get("AbsolutePath") or 
                arguments.get("absolute_path") or ""
            )
            if target:
                target_base = os.path.basename(target)
                phase += f" ({target_base})"
        elif tool_name == "run_command":
            cmd = (
                arguments.get("commandLine") or 
                arguments.get("CommandLine") or 
                arguments.get("command_line") or 
                arguments.get("command") or ""
            )
            if cmd:
                cmd_short = cmd.split()[0] if cmd.split() else ""
                phase += f" ({cmd_short})"

        # Determine active agent and phase node dynamically
        active_agent = "Builder"
        phase_node = "Execution"

        plan_exists = False
        if artifact_dir:
            plan_exists = os.path.exists(os.path.join(artifact_dir, "implementation_plan.md"))
        if not plan_exists:
            plan_exists = os.path.exists(os.path.join(project_root, "implementation_plan.md"))

        task_exists = False
        if artifact_dir:
            task_exists = os.path.exists(os.path.join(artifact_dir, "task.md"))
        if not task_exists:
            task_exists = os.path.exists(os.path.join(project_root, "task.md"))

        target_file = target or ""
        target_basename = os.path.basename(target_file) if target_file else ""

        # Command context
        cmd = ""
        if tool_name == "run_command":
            cmd = (
                arguments.get("commandLine") or 
                arguments.get("CommandLine") or 
                arguments.get("command_line") or 
                arguments.get("command") or ""
            )

        if target_basename == "implementation_plan.md":
            active_agent = "Orchestrator"
            # If it's tool call write/replace, we might be correcting
            phase_node = "Correction" if tool_name in ["replace_file_content", "multi_replace_file_content"] else "Planning"
        elif target_basename in ["task.md", "walkthrough.md"]:
            active_agent = "Auditor"
            phase_node = "Verification"
        elif target_basename and ("mcp_config.json" in target_basename or ".env" in target_basename):
            active_agent = "SRE"
            phase_node = "Execution"
        elif cmd:
            cmd_lower = cmd.lower()
            if any(x in cmd_lower for x in ["verify_mcp_connections.py", "pytest", "playwright", "jest", "vitest", "eslint", "pylint", "flake8", "mypy"]):
                active_agent = "Auditor"
                phase_node = "Verification"
            elif any(x in cmd_lower for x in ["git reset", "git checkout --", "git revert"]):
                active_agent = "Auditor"
                phase_node = "Rollback"
            elif any(x in cmd_lower for x in ["uv ", "pip ", "npm ", "docker ", "gcloud ", "apt ", "setup"]):
                active_agent = "SRE"
                phase_node = "Execution"
            else:
                active_agent = "Builder"
                phase_node = "Execution"
        elif tool_name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
            active_agent = "Builder"
            phase_node = "Execution"
        elif tool_name in ["list_dir", "grep_search", "view_file"] and not target_basename:
            active_agent = "Orchestrator"
            phase_node = "Discovery"
        elif not plan_exists:
            active_agent = "Orchestrator"
            phase_node = "Discovery"
        elif plan_exists and not task_exists:
            active_agent = "Orchestrator"
            phase_node = "Approval"
        else:
            # Default fallbacks
            active_agent = "Builder"
            phase_node = "Execution"

        # Clean string formatting separating header from mermaid structure
        content = f"""# 🛰️ Swarm Live Execution Monitor

This dashboard displays the active execution phase and handoff flows of the Antigravity Swarm.

---

## ⚡ Active Task
* **Task**: IDE Developer Session
* **Active Agent**: {active_agent}
* **Current Phase**: {phase}

---

## 📊 Live Flow Monitor

```mermaid
graph TD
    Discovery(🔍 Discovery) --> Planning(📋 Planning)
    Planning --> Correction(🔄 Self-Correction)
    Correction -->|Flawed Plan| Planning
    Correction -->|Valid Plan| Approval(🛑 Approval Gate)
    Approval --> Execution(💻 Execution)
    Execution --> Verification(🛡️ Verification)
    Verification --> Escalation(🛑 Escalation Gate)
    Escalation -->|Failed| Rollback(⚠️ Rollback)
    Escalation -->|Passed| Success(🎉 Success)
    style {phase_node} fill:#ff9900,stroke:#333,stroke-width:4px,color:#000
```
"""
        with open(live_file_path, "w") as f:
            f.write(content)
    except Exception:
        pass

    # 3. Schema-Compliant Output Fix
    # Protojson requires an empty object {} to represent an empty/void response struct.
    print(json.dumps({}), flush=True)

if __name__ == "__main__":
    main()