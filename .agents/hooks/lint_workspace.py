#!/usr/bin/env python3
"""
Lint Workspace Hook — Runs ruff check in the receptionist application.
Called automatically by the Antigravity IDE hook system on PostInvocation.
"""

import os
import sys
import json
import subprocess

def log(msg):
    sys.stderr.write(str(msg) + "\n")
    sys.stderr.flush()

def main():
    try:
        # Resolve project root dynamically
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
        
        # Target directory: app_build/receptionist
        target_dir = os.path.join(project_root, "app_build", "receptionist")
        
        if not os.path.exists(target_dir):
            log(f"Pre-flight warning: target directory {target_dir} does not exist.")
            return

        # Execute uv run --with ruff ruff check .
        cmd = ["uv", "run", "--with", "ruff", "ruff", "check", "."]
        
        log(f"Running linter in {target_dir}...")
        result = subprocess.run(
            cmd,
            cwd=target_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if result.returncode != 0:
            log("[Hook Warning] Linting checks failed in app_build/receptionist:")
            if result.stdout:
                log(result.stdout.strip())
            if result.stderr:
                log(result.stderr.strip())
        else:
            log("[Hook Success] Linting checks passed in app_build/receptionist.")
            
    except Exception as e:
        log(f"[Hook Error] Failed to run lint hook: {e}")
    finally:
        # Protojson requires an empty object {} to represent an empty/void response struct on stdout.
        print(json.dumps({}), flush=True)

if __name__ == "__main__":
    main()
