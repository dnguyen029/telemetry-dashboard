#!/usr/bin/env python3
import os
import sys
import json
from datetime import datetime

def main():
    try:
        # Resolve project root dynamically
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

        exit_status = os.environ.get("AG_EXIT_STATUS", "").strip()
        task_id = os.environ.get("AG_TASK_ID", "").strip()
        last_error = os.environ.get("AG_LAST_ERROR", "").strip()

        if exit_status == "failure":
            log_path = os.path.join(project_root, "failure_log.txt")
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_entry = (
                f"[{timestamp}] Task ID: {task_id or 'N/A'}\n"
                f"Exit Status: {exit_status}\n"
                f"Last Error: {last_error or 'None'}\n"
                f"{'-'*40}\n"
            )
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(log_entry)
    except Exception as e:
        sys.stderr.write(f"[alert_handler] Error writing failure log: {e}\n")
    finally:
        # Hook schema requires printing empty JSON object to stdout
        print(json.dumps({}), flush=True)

if __name__ == "__main__":
    main()
