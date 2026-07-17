#!/usr/bin/env python3
"""
mcp_hygiene.py — PreInvocation hook
------------------------------------
Scans /proc for orphaned or duplicate processes matching configured MCP servers
and terminates them to prevent port/connection conflicts during swarm loops.

To satisfy the Antigravity IDE's hook schema (protojson):
1. All logging outputs MUST write to sys.stderr.
2. The script MUST output an empty JSON object '{}' to sys.stdout on exit.
"""
import os
import sys
import json
import signal

def log(msg: str) -> None:
    sys.stderr.write(f"[Hygiene] {msg}\n")
    sys.stderr.flush()

def is_complex_shell_command(arg: str) -> bool:
    shell_markers = ["&&", "||", ";", "$", "=", "import "]
    return any(marker in arg for marker in shell_markers)

def kill_orphaned_mcp_servers() -> None:
    # Resolve project root dynamically
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    config_path = os.path.join(project_root, "mcp_config.json")

    if not os.path.exists(config_path):
        log("mcp_config.json not found, skipping hygiene sweep.")
        return

    try:
        with open(config_path, "r") as f:
            config = json.load(f)
        servers = config.get("mcpServers", {})
    except Exception as e:
        log(f"Failed to parse mcp_config.json: {e}")
        return

    # Build list of substrings to match from configured command/arguments
    substrings = []
    for name, srv in servers.items():
        substrings.append(name)
        cmd = srv.get("command")
        if cmd:
            substrings.append(os.path.basename(cmd))
        for arg in srv.get("args", []):
            if not arg:
                continue
            
            # Extract target URL domain ONLY if it is a remote MCP endpoint containing 'mcp'
            if "://" in arg:
                if "mcp" in arg:
                    try:
                        parts = arg.split("://")
                        for part in parts[1:]:
                            url_part = part.split()[0].replace('"', '').replace("'", "")
                            if "mcp" in url_part:
                                domain = url_part.split("/", 1)[0].split("?")[0]
                                substrings.append(domain)
                    except Exception:
                        pass
                continue  # Skip word tokenization for URLs to prevent matching URL segments
            
            # Skip word tokenization for complex inline shell commands
            if is_complex_shell_command(arg):
                continue
                
            # Check if standard arg contains "/"
            if "/" in arg:
                substrings.append(os.path.basename(arg))
            else:
                substrings.append(arg)

    # Exclude common commands, headers, and authentication tokens
    generic_blocklist = {
        "npx", "node", "python", "python3", "bash", "sh", "run", "exec", "remote",
        "bearer", "authorization", "header", "ignore-tool", "delete*", "transport",
        "google.auth", "creds", "scopes", "cloud-platform", "google", "chrome",
        "set", "env", "token", "delete", "auth", "get_operation", "evaluation",
        "guardrail", "deployment", "changelog", "version", "export", "import",
        "http-only"
    }

    # Filter out common short commands or empty strings
    clean_subs = []
    for s in substrings:
        if not s:
            continue
        clean = s.strip("\"'`()[]{}*").lower()
        if len(clean) > 2 and clean not in generic_blocklist:
            clean_subs.append(s)
    substrings = list(set(clean_subs))
    if not substrings:
        log("No matching server commands or arguments to verify.")
        return

    my_pid = os.getpid()
    if not os.path.exists("/proc"):
        log("/proc filesystem not accessible, skipping sweep.")
        return

    # Find the active Language Server PID
    active_ls_pid = None
    for pid_str in os.listdir("/proc"):
        if not pid_str.isdigit():
            continue
        try:
            with open(f"/proc/{pid_str}/cmdline", "r") as f:
                cmdline = f.read().replace("\x00", " ").strip()
            if "language_server_linux_x64" in cmdline or "language_server" in cmdline:
                active_ls_pid = int(pid_str)
                break
        except Exception:
            continue

    if active_ls_pid:
        log(f"Detected active Language Server PID: {active_ls_pid}")

    log(f"Scanning for orphaned/duplicate processes matching signatures: {substrings}")
    killed_count = 0
    for pid_str in os.listdir("/proc"):
        if not pid_str.isdigit():
            continue
        pid = int(pid_str)
        if pid == my_pid or pid == active_ls_pid:
            continue
            
        try:
            ppid = None
            with open(f"/proc/{pid}/status", "r") as sf:
                for line in sf:
                    if line.startswith("PPid:"):
                        ppid = int(line.split()[1])
                        break
            
            with open(f"/proc/{pid}/cmdline", "r") as f:
                cmdline = f.read().replace("\x00", " ").strip()

            if any(sub in cmdline for sub in substrings):
                is_orphaned = False
                if active_ls_pid:
                    is_descendant = False
                    curr_ancestor = ppid
                    for _ in range(10):
                        if not curr_ancestor or curr_ancestor <= 1:
                            break
                        if curr_ancestor == active_ls_pid:
                            is_descendant = True
                            break
                        next_ppid = None
                        try:
                            with open(f"/proc/{curr_ancestor}/status", "r") as sf:
                                for line in sf:
                                    if line.startswith("PPid:"):
                                        next_ppid = int(line.split()[1])
                                        break
                        except Exception:
                            break
                        curr_ancestor = next_ppid
                    if not is_descendant:
                        is_orphaned = True
                else:
                    is_orphaned = True

                if is_orphaned:
                    log(f"Found orphaned/duplicate MCP process: PID {pid} ({cmdline}). Sending SIGTERM...")
                    os.kill(pid, signal.SIGTERM)
                    killed_count += 1
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            continue

    if killed_count == 0:
        log("No orphaned process conflicts detected.")
    else:
        log(f"Successfully terminated {killed_count} orphaned process(es).")

def main() -> None:
    if os.environ.get("BYPASS_MCP_VERIFICATION") == "1":
        log("BYPASS_MCP_VERIFICATION=1 detected. Skipping hygiene sweep.")
        print(json.dumps({}), flush=True)
        sys.exit(0)
    try:
        kill_orphaned_mcp_servers()
    except Exception as e:
        log(f"Hygiene error: {e}")
    finally:
        # Satisfy hook protojson requirements: stdout must be an empty JSON object
        print(json.dumps({}), flush=True)

if __name__ == "__main__":
    main()
