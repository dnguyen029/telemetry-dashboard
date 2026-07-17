#!/usr/bin/env python3
import os
import sys
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("verify_ide_health")

def verify_settings():
    """Validates settings.json formatting and the presence of explicit terminal profiles."""
    settings_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".vscode", "settings.json"))
    if not os.path.exists(settings_path):
        logger.error(f"settings.json not found at {settings_path}")
        return False

    try:
        with open(settings_path, "r") as f:
            settings = json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse settings.json as valid JSON: {e}")
        return False

    required_keys = [
        "terminal.integrated.defaultProfile.linux",
        "terminal.integrated.profiles.linux"
    ]

    missing_keys = [k for k in required_keys if k not in settings]
    if missing_keys:
        logger.error(f"Missing terminal keys in settings.json: {missing_keys}")
        return False

    # Check that default profile is set
    default_profile = settings.get("terminal.integrated.defaultProfile.linux")
    profiles = settings.get("terminal.integrated.profiles.linux")

    if not isinstance(profiles, dict) or default_profile not in profiles:
        logger.error(f"Default profile '{default_profile}' is not defined in profiles map.")
        return False

    logger.info("settings.json terminal profiles validated successfully.")
    return True

def check_orphaned_supermemory_processes():
    """Scans /proc to find any lingering processes containing 'supermemory' in their command line."""
    if not os.path.exists("/proc"):
        logger.warning("/proc filesystem not available on this platform. Skipping process scans.")
        return True

    found_orphans = []
    for pid_str in os.listdir("/proc"):
        if not pid_str.isdigit():
            continue
        pid = int(pid_str)
        try:
            with open(f"/proc/{pid}/cmdline", "r") as f:
                cmdline = f.read().replace("\x00", " ").strip()
            if "supermemory" in cmdline.lower() and "verify_ide_health" not in cmdline.lower():
                found_orphans.append((pid, cmdline))
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            continue

    if found_orphans:
        for pid, cmd in found_orphans:
            logger.warning(f"Found lingering/orphaned supermemory process: PID {pid} ({cmd})")
        return False

    logger.info("No lingering supermemory processes found.")
    return True

def verify_python_env():
    """Verifies that the python environment matches the bootstrap.md specification."""
    expected_interpreter = "/home/dnguyen029/antigravity-project/.venv/bin/python"
    current_executable = sys.executable
    if not current_executable.startswith(expected_interpreter):
        logger.warning(f"Python interpreter mismatch. Expected: {expected_interpreter}*, got: {current_executable}")
        return False
    logger.info(f"Python environment aligned: {current_executable}")
    return True

def main():
    logger.info("Starting Antigravity IDE Health Diagnostic Checks...")
    
    settings_ok = verify_settings()
    processes_ok = check_orphaned_supermemory_processes()
    env_ok = verify_python_env()

    if settings_ok and processes_ok and env_ok:
        logger.info("All health stabilization checks PASSED successfully.")
        sys.exit(0)
    else:
        logger.error("Some health checks FAILED. Review warnings above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
