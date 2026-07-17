"""
Dashboard Sync Hook — Updates agent_live.md with the current execution phase.
Called automatically by the Antigravity IDE hook system on lifecycle events.

Usage: python3 update_dashboard.py <phase>
Phases: processing, execution, idle
"""

import sys
import re
import os
from datetime import datetime
from pathlib import Path

# Resolve project root dynamically
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

# Pre-flight: Workspace Integrity Checks
bootstrap_path = os.path.join(project_root, "bootstrap.md")
ripple_path = os.path.join(project_root, "RIPPLE_MAP.md")
if not os.path.exists(bootstrap_path) or not os.path.exists(ripple_path):
    sys.exit(0)

DASHBOARD = Path(project_root) / "production_artifacts/agent_live.md"

PHASES = {
    "processing": "🔍 Processing",
    "execution": "💻 Executing",
    "idle": "🕐 Idle",
}

def main():
    phase_key = sys.argv[1] if len(sys.argv) > 1 else "idle"
    
    exit_status = os.environ.get("AG_EXIT_STATUS", "").strip()
    last_error = os.environ.get("AG_LAST_ERROR", "").strip()
    
    if phase_key == "idle":
        if exit_status == "failure":
            error_desc = f" - Error: {last_error}" if last_error else ""
            label = f"🔴 Failed{error_desc}"
        else:
            label = "🕐 Idle"
    else:
        label = PHASES.get(phase_key, phase_key)
        
    timestamp = datetime.now().strftime("%I:%M %p")

    if not DASHBOARD.exists():
        return

    content = DASHBOARD.read_text()
    content = re.sub(
        r"[*\-] \*\*Current Phase\*\*:.*",
        f"- **Current Phase**: {label} ({timestamp})",
        content,
    )
    if phase_key == "idle":
        target_node = "Rollback" if exit_status == "failure" else "Success"
        content = re.sub(
            r"style \w+ (fill:#ff9900,stroke:#333,stroke-width:4px,color:#000)",
            f"style {target_node} \\1",
            content,
        )
    DASHBOARD.write_text(content)

if __name__ == "__main__":
    main()
