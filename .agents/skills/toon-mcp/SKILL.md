---
name: toon-mcp
description: Trajectory-Oriented Observation Network (TOON) protocol for high-fidelity tool-call auditing and serialization.
---

# TOON-MCP Skill

## 🎯 Overview
TOON (Trajectory-Oriented Observation Network) is the primary serialization and auditing protocol for the Antigravity Swarm. It ensures that complex tool trajectories are captured with high fidelity (>0.85 score) and safely audited before execution.

## 🛠️ Key Capabilities
- **High-Entropy Serialization**: Purifies tool outputs > 2,000 characters to prevent context bloating.
- **Trajectory Scoring**: Calculates the efficiency and correctness of agent paths.
- **Auditor Interception**: Integrates with `auditor_gate.js` to block unsafe mutations.

## 📜 Usage Protocol
1. **Purification**: Use `diagnostic_toon.js` to analyze trajectory health.
2. **Audit**: Mandatory for all Lane 3 mutations.

---
*Certified by @orchestrator - Version 2.0.0*
