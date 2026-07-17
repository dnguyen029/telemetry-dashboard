##!/usr/bin/env python3
import sys
import json
import os

def main():
    try:
        # 1. Non-blocking Stream Protection
        if sys.stdin.isatty():
            print(json.dumps({
                "decision": "deny", 
                "reason": "Safety gate validation error: Script cannot run in an interactive terminal."
            }), flush=True)
            return

        # Read the tool call details from stdin
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"decision": "allow"}), flush=True)
            return

        payload = json.loads(input_data)
        tool_call = payload.get("toolCall", {})
        tool_name = tool_call.get("name")
        arguments = tool_call.get("args", {})
        artifact_dir = payload.get("artifactDirectoryPath")
    except Exception as e:
        # Fail closed on parse errors + immediate flush
        print(json.dumps({
            "decision": "deny",
            "reason": f"Safety gate validation failed to parse input: {str(e)}"
        }), flush=True)
        return

    # 0. Loop Protection Guards (Runaway Loops & Cost Guardrails)
    initial_num_steps = payload.get("initialNumSteps", 0)
    if initial_num_steps >= 150:
        print(json.dumps({
            "decision": "deny",
            "reason": f"Runaway Loop Guard: Agent has exceeded 150 steps ({initial_num_steps}). Execution halted to prevent quota waste."
        }), flush=True)
        return

    transcript_path = payload.get("transcriptPath")
    if transcript_path and os.path.exists(transcript_path):
        try:
            with open(transcript_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            error_count = 0
            # Scan recent history backwards
            for line in reversed(lines[-60:]):
                try:
                    step_data = json.loads(line.strip())
                    s_type = step_data.get("type", "")
                    
                    if s_type in ["TOOL_OUTPUT", "PLANNER_RESPONSE", "TOOL_RESPONSE"]:
                        content_str = str(step_data.get("content", "")).lower()
                        status = str(step_data.get("status", ""))
                        
                        if status == "ERROR" or "error invalid tool call" in content_str or "the command failed with exit code" in content_str:
                            error_count += 1
                        else:
                            # A successful tool output breaks the consecutive error chain
                            if s_type != "PLANNER_RESPONSE":
                                break
                except Exception:
                    continue
            
            if error_count >= 3:
                print(json.dumps({
                    "decision": "deny",
                    "reason": "Cost Guardrail: 3 consecutive tool failures detected in transcript. Halting all execution loops."
                }), flush=True)
                return
        except Exception:
            pass # Fail open on read errors

    # 1. Prohibited Directories (Access Protection)
    prohibited_folders = [".venv", ".git", "venv", "node_modules"]
    paths_to_check = []
    for arg_name in ["path", "AbsolutePath", "DirectoryPath", "TargetFile", "SearchPath", "file_path"]:
        if arg_name in arguments and isinstance(arguments[arg_name], str):
            paths_to_check.append(arguments[arg_name])

    for file_path in paths_to_check:
        normalized_path = file_path.replace("\\", "/")
        parts = normalized_path.split("/")
        if any(folder in parts for folder in prohibited_folders):
            print(json.dumps({
                "decision": "deny",
                "reason": f"Access to prohibited directory path '{file_path}' is blocked."
            }), flush=True)
            return

    # 2. Destructive Commands & Shell Guardrails
    if tool_name in ["run_command", "execute_command"]:
        # Fallback to alternative common naming variants for the command arg
        cmd = (arguments.get("CommandLine") or arguments.get("command") or arguments.get("cmd") or "").strip()
        cmd_lower = cmd.lower()
        
        # Dangerous file deletion checks
        if "rm " in cmd_lower or "rmdir" in cmd_lower:
            # Block any rm command unless restricted to temp/safe folders
            if not any(safe_p in cmd_lower for safe_p in ["/tmp/", "scratch/"]):
                print(json.dumps({
                    "decision": "deny",
                    "reason": f"Destructive command blocked: execution of '{cmd}' is prohibited."
                }), flush=True)
                return
                
        # Git history protection
        if "git " in cmd_lower and ("reset --hard" in cmd_lower or "push" in cmd_lower and "--force" in cmd_lower):
            print(json.dumps({
                "decision": "deny",
                "reason": "Destructive Git operations (hard resets, force pushes) are blocked."
            }), flush=True)
            return

    # 3. Quota Optimization Guards (Broad Searches)
    if tool_name in ["grep_search", "list_dir"]:
        path_arg = arguments.get("SearchPath") or arguments.get("DirectoryPath") or arguments.get("path") or ""
        # Strip trailing slashes for clean string matching
        path_arg_clean = path_arg.rstrip("/")
        
        # Block scanning workspace root or home too broadly
        if path_arg_clean in ["", "/", "/home", "/home/dnguyen029", "/home/dnguyen029/antigravity-project"]:
            if tool_name == "grep_search":
                # Look for alternative common variations of "Query"
                query_arg = arguments.get("Query") or arguments.get("query") or arguments.get("pattern") or ""
                if query_arg in ["", "*", ".*"] or len(query_arg) < 2:
                    print(json.dumps({
                        "decision": "deny",
                        "reason": "Broad grep search on workspace root is blocked to optimize token/quota usage."
                    }), flush=True)
                    return
            elif tool_name == "list_dir" and path_arg_clean in ["", "/", "/home", "/home/dnguyen029"]:
                print(json.dumps({
                    "decision": "deny",
                    "reason": "Listing system root directories is blocked to prevent token waste."
                }), flush=True)
                return

    # 4. Plan Approval Gate / Root Cause Gate (Writing/modifying files) + MCP Config Protection
    write_tools = ["write_file", "edit_file", "write_to_file", "replace_file_content", "multi_replace_file_content", "delete_file"]
    if tool_name in write_tools:
        target_file = arguments.get("TargetFile") or arguments.get("file_path") or arguments.get("path") or ""
        target_basename = os.path.basename(target_file)
        
        # MCP Configuration Lock & Boundary Protection
        if "mcp_config.json" in target_basename:
            print(json.dumps({
                "decision": "deny",
                "reason": "MCP Configuration Lock: Modifications to all mcp_config.json files are strictly locked. Please make any configuration changes manually."
            }), flush=True)
            return

        # Don't restrict writing to plan/task/walkthrough files themselves
        if target_basename not in ["implementation_plan.md", "task.md", "walkthrough.md"]:
            plan_file = "implementation_plan.md"
            
            # Formulate potential paths for the implementation plan
            paths_to_check = []
            if artifact_dir:
                paths_to_check.append(os.path.join(artifact_dir, plan_file))
            paths_to_check.append(os.path.join("/home/dnguyen029/antigravity-project", plan_file))
            paths_to_check.append(plan_file)
            
            plan_to_read = None
            for p in paths_to_check:
                if os.path.exists(p):
                    plan_to_read = p
                    break
                    
            if not plan_to_read:
                print(json.dumps({
                    "decision": "deny",
                    "reason": "Plan Approval Gate: 'implementation_plan.md' must exist before modifying code files."
                }), flush=True)
                return
                
            try:
                with open(plan_to_read, "r", encoding="utf-8") as f:
                    content = f.read().lower()
                has_rca = "root cause" in content or "rca" in content
                has_proposed = "proposed changes" in content or "proposed" in content or "plan" in content
                has_verification = "verification plan" in content or "verification" in content
                has_approval = "[approved]" in content
                if not (has_rca and has_proposed and has_verification):
                    print(json.dumps({
                        "decision": "deny",
                        "reason": "Plan Approval Gate: 'implementation_plan.md' must document Root Cause Analysis (RCA), Proposed Changes, and a Verification Plan."
                    }), flush=True)
                    return
                if not has_approval:
                    print(json.dumps({
                        "decision": "deny",
                        "reason": "Plan Approval Gate: 'implementation_plan.md' must contain the exact string '[APPROVED]' to verify user consent."
                    }), flush=True)
                    return
            except Exception as e:
                print(json.dumps({
                    "decision": "deny",
                    "reason": f"Plan Approval Gate: Failed to read implementation plan: {str(e)}"
                }), flush=True)
                return

            # Modern Web Guidance Gate & Context7 Documentation Gate
            is_web_file = False
            for ext in [".html", ".css", ".js", ".jsx", ".ts", ".tsx"]:
                if target_file.lower().endswith(ext):
                    # Exclude non-web configuration files
                    if not target_basename.endswith("config.json") and not target_basename.endswith("hooks.json") and "hooks/" not in target_file:
                        is_web_file = True
                        break

            has_checked_web_guidance = False
            has_checked_context7 = False
            user_mentions_library = False
            mentioned_library = None
            libraries = ["react", "next.js", "nextjs", "prisma", "express", "tailwind", "django", "spring boot", "supabase", "firebase", "framer-motion", "motion", "zustand", "postcss", "vite", "typescript", "playwright", "eslint"]

            if transcript_path and os.path.exists(transcript_path):
                try:
                    with open(transcript_path, "r", encoding="utf-8") as f:
                        for line in f:
                            try:
                                step_data = json.loads(line.strip())
                                tool_calls = step_data.get("tool_calls") or []
                                for tc in tool_calls:
                                    tc_name = tc.get("name", "")
                                    tc_args = tc.get("args", {}) or {}

                                    if "context7" in tc_name.lower():
                                        has_checked_context7 = True
                                    if tc_name == "call_mcp_tool" and "context7" in str(tc_args.get("ServerName", "")).lower():
                                        has_checked_context7 = True

                                    if tc_name == "run_command":
                                        cmd_str = str(tc_args.get("CommandLine", "")).lower()
                                        if "modern-web-guidance" in cmd_str:
                                            has_checked_web_guidance = True

                                if step_data.get("type") == "USER_INPUT":
                                    content_lower = str(step_data.get("content", "")).lower()
                                    for lib in libraries:
                                        if lib in content_lower:
                                            user_mentions_library = True
                                            mentioned_library = lib
                            except Exception:
                                continue
                except Exception:
                    pass

            if is_web_file and not has_checked_web_guidance:
                print(json.dumps({
                    "decision": "deny",
                    "reason": "Modern Web Guidance Gate: You must execute modern-web-guidance search or retrieve first before modifying HTML/CSS/JS/TS files. Run: `npx -y modern-web-guidance@latest search \"<query>\"`."
                }), flush=True)
                return

            if user_mentions_library and not has_checked_context7:
                print(json.dumps({
                    "decision": "deny",
                    "reason": f"Context7 Documentation Gate: The user query mentions the library/framework '{mentioned_library}'. You must first use the Context7 MCP server to fetch the latest documentation for this library (resolve-library-id followed by query-docs) to prevent using outdated API patterns."
                }), flush=True)
                return

    # 5. Database Modification Checks
    if tool_name == "execute_sql":
        query = (arguments.get("query") or arguments.get("sql") or "").strip().upper()
        write_keywords = ["INSERT ", "UPDATE ", "DELETE ", "DROP ", "CREATE ", "ALTER ", "REPLACE ", "TRUNCATE "]
        if any(kw in query for kw in write_keywords):
            print(json.dumps({
                "decision": "deny",
                "reason": "Modifying SQL query blocked by default safety policies."
            }), flush=True)
            return

    # Default: Allow the tool execution
    print(json.dumps({"decision": "allow"}), flush=True)

if __name__ == "__main__":
    main()