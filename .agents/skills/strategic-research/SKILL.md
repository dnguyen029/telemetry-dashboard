---
name: strategic-research
description: "Master of Institutional Wisdom extraction and Wisdom-First Archival."
category: Research
version: 1.0.0
---

# strategic-research

This skill empowers the agent to perform deep semantic research into session history and codify "Institutional Wisdom" into structured archives. It is the primary tool for the **Librarian** role.

## 🎯 Mandates

1. **Wisdom-First**: Prioritize the extraction of Architectural Decision Logs (ADLs) and High-Signal Knowledge over generic telemetry.
2. **Zero-Bloat**: Actively filter and prune redundant information before archival to maintain context efficiency.
3. **Traceability**: Every piece of wisdom MUST be linked to its original session ID and anchor file.

## 🛠️ Functions

### `extract_wisdom`
Scans `mission/FINDINGS.md` and conversation logs for patterns tagged with `[ADL]`, `[WISDOM]`, or `[KNOWLEDGE]`.
- **Target**: `mission/FINDINGS.md`
- **Output**: Structured JSON for L3 sync.

### `l3_sync`
Synchronizes findings to the Supabase L3 Vector Search using the `sync_supabase_wisdom.js` infrastructure.
- **Protocol**: Verify SHA-256 seal before indexing.

### `bloat_audit`
Identifies and proposes the deletion of low-signal mission files or redundant Redis keys.

## 🧭 Workflow

1. **Recon**: Query Supabase lessons learned to understand the historical context.
2. **Extraction**: Identify new patterns in the current session.
3. **Refinement**: Deduplicate against existing Supabase L3 entries.
4. **Archival**: Seal and sync.
