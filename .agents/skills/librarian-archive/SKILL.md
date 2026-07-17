---
name: librarian-archive
description: Manages the swarm's long-term memory (Supabase). Archives patterns and lessons tagged with #AISP-V1.
metadata:
  version: '2.0'
  author: 'Antigravity'
category: system
---

# 📚 librarian-archive (Phase 57.0)

This skill transforms mission-specific insights into "Knowledge Base." It ensures that the swarm grows "smarter" with every task by persisting architectural patterns to the L3 cloud store.

## 🏛️ Memory Architecture

1. **Extraction**: During `postflight` (via `scribe.js`), the Scribe scans the session logs for findings tagged with `#AISP-V1`.
2. **Archival**: Extracted lessons are pushed to the `lessons_learned` table in Supabase.
3. **Retrieval**: Agents use the **Recall-First Protocol** to query these lessons before planning.

## 🛠️ Tools & Commands

### 1. Verification
Check if a lesson was successfully archived in Supabase:
```bash
# Use the Supabase MCP tool to query the lessons_learned table
mcp_supabase_execute_sql "SELECT * FROM lessons_learned ORDER BY created_at DESC LIMIT 1;"
```

## 🧠 Swarm Integration

- **Primary Agent**: Primarily used by the **Librarian (Lane 4)**.
- **Trigger**: Automatically triggered by `entry.js` -> `SwarmController` -> `scribe.js`.
- **Mandate**: Every archived finding MUST include the `#AISP-V1` header.

> [!IMPORTANT]
> The #AISP-V1 tag is the primary trigger for the extraction engine. Without it, the lesson will remain trapped in the transient mission logs.

