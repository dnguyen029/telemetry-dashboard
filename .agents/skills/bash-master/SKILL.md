---
name: bash-master
description: Authority for defensive, portable, and production-grade shell scripting (Bash/POSIX).
version: 1.0.0
category: tools
---

# 🐚 Bash Master Skill

Expert authority for writing safe, testable, and high-performance shell scripts.

## 🛡️ Defensive Patterns

- Use 'set -euo pipefail' for strict error handling.
- Always quote variables to prevent word splitting.
- Use [[]] instead of [ ] for safer conditionals in Bash.

## 📦 Portability

- Favor POSIX compliance for system utilities.
- Use 'command -v' instead of 'which' to locate binaries.

## 🧪 Testing & Linting

- Always run ShellCheck on modified scripts.
- Use BATS (Bash Automated Testing System) for unit testing complex logic.
