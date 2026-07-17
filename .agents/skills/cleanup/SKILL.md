---
name: cleanup
description: Maintain workspace hygiene by removing temporary files, redundant artifacts, and system trash.
---

# 🧹 Cleanup Skill (Workspace Hygiene)

> **Objective**: Maintain workspace hygiene by removing temporary files, redundant artifacts, and system trash without losing important data.

## 🛠️ Key Capabilities

- **Automated Hygiene Audit**: Analyze `.gemini/`, `.swarm/`, and `tmp/` directories to find unused files.
- **Risk-Aware Deletion**: Only delete files confirmed in `.gitignore` or known trash directories.
- **State Preservation**: Ensure logic files (`mission/`, `config/`, `scripts/`) are absolutely protected.
- **Archive Verification**: Automatically check Supabase status before deletion to ensure no "Zero-Amnesia" occurs.

## ⌨️ Usage Protocol

### 1. Manual Execution

Use the script directly:

```bash
/home/dnguyen029/antigravity-project/.venv/bin/python3 app_build/tools/cleanup.py            # Check before deleting (dry-run)
/home/dnguyen029/antigravity-project/.venv/bin/python3 app_build/tools/cleanup.py --force    # Perform actual deletion
```

### 2. Workflow Integration

Always run `/cleanup` before releasing a new version or when starting a new Session ID to reduce context noise.

## 🛡️ Guardrails

1. **Wait-and-Verify**: Never delete files modified within the last 1 hour.
2. **Anchor Protection**: Prohibit deleting any content in the `mission/` or `config/` directories.
3. **Log Accountability**: All deletion actions must be recorded in `ERRORS.md` or `FINDINGS.md`.

---

> Certified by @orchestrator - Version 1.0.0
