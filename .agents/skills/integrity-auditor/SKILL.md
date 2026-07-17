---
name: integrity-auditor
description: "Guardian of the Governance Engine and Mechanical Governance."
category: Auditing
version: 1.0.0
---

# integrity-auditor

This skill empowers the agent to enforce the **[VERIFIED-GOVERNED]** state by performing high-fidelity quartet audits and managing the "Mechanical Stop" guardrails. It is the primary tool for the **Auditor** role.

## 🎯 Mandates

1. **Fail-Fatal**: Immediate protocol veto if any architectural drift or unauthorized mutation is detected.
2. **Governance Signature Verification**: Mandatory verification of SHA-256 signatures for all turn handoffs and mission state transitions.
3. **Resonance Integrity**: Ensure that all 4-Lane Quartet nodes are synchronized with the master roadmap.

## 🛠️ Functions

### `verify_seal`
Validates the cryptographic seal in `config/state_sync.json` and `mission/FINDINGS.md`.
- **Tool**: `scripts/lifecycle/postflight.js`

### `resonance_check`
Detects unauthorized changes to core anchors (GEMINI.md, AGENTS.md, mcp_config.json).
- **Tool**: `scripts/lifecycle/audit/librarian_audit.js`

### `mechanical_stop`
Enforces the Zod-gated blocking logic for destructive commands.
- **Tool**: `src/schemas/tool_validation.js`

## 🧭 Workflow

1. **Pre-Flight**: Run `mutationProbe` to verify active guardrails.
2. **Audit**: Run Lane-Parallel integrity checks.
3. **Certification**: Issue the `VERIFIED-GOVERNED` seal for the current turn.
4. **Handoff**: Verify the recipient's signature.
