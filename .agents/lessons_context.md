# 🧠 Active lessons learned context (Ground Truth)
<!-- Method: semantic -->

## 📌 Test Lesson from IDE Agent (Date: N/A | Match Score: 0.703)

This is a test lesson verifying the new manual archive script and automated vector embedding calculation.

## 📌 Walkthrough - Swarm SDK Migration (Date: N/A | Match Score: 0.676)

### Walkthrough - Swarm SDK Migration

We have successfully migrated the standalone Python SDK swarm scripts into a dedicated Git repository.

#### Changes Made
- Created a new directory at `/home/dnguyen029/antigravity-sdk` and initialized it as a Git repository.
- Copied all agent profiles (`auditor.txt`, `builder.txt`, `faq_receptionist.txt`, `librarian.txt`, `orchestrator.txt`, `receptionist.txt`, `router.txt`, `sre.txt`, `wismo_receptionist.txt`), documentation (`librarian.md`), and execution scripts (`native_orchestrator.py`) into the new repository.
- Added a `README.md` file documenting the purpose of the new repository.
- Staged all files in the new Git repository (`git add .`) and committed them.
- Cleaned up the old `/home/dnguyen029/archived_swarm` folder.

#### Verification & Testing
- Verified that the new repository status is clean:
  ```bash
  git status
  # Output: On branch master, nothing to commit, working tree clean
  ```text

## 📌 IDE Rule Namespace Collision and Markdown Lints (Date: N/A | Match Score: 0.663)

Renamed root GEMINI.md to DEVELOPMENT.md to resolve linter namespace collision with .agents/rules/GEMINI.md. Fixed MD022 heading spacer and MD060 table pipe space formatting lints in bootstrap.md and DEVELOPMENT.md.

## 📌 Walkthrough - Resolve Markdownlint Violations (Date: N/A | Match Score: 0.662)

### Walkthrough - Resolve Markdownlint Violations

Formatted and reflowed markdown files to resolve the reported markdownlint warnings.

#### Changes Made

##### Configuration/Rules Files

###### [GEMINI.md](file:///home/dnguyen029/antigravity-project/.agents/rules/GEMINI.md)
- Wrapped all lines exceeding the 120-character limit (MD013).
- Added a blank line above/below lists to satisfy blockquote formatting constraints (MD032).
- Normalized list item prefixes to use `-` consistently instead of mixing with `*` (MD004).
- Removed redundant consecutive blank lines (MD012).

###### [guardrails.md](file:///home/dnguyen029/antigravity-project/.agents/rules/guardrails.md)
- Wrapped lines exceeding 120 characters to comply with MD013.
- Removed redundant multiple empty lines at the end of the file (MD012).

###### [agent_live.md](file:///home/dnguyen029/antigravity-project/production_artifacts/agent_live.md)
- Added a blank line under the heading `## ⚡ Active Task` (MD022).
- Surrounded the active task list with blank lines (MD032).
- Standardized task list markers to `-` to align with the list style (MD004).

#### Verification Results

Formatting and structures were manually checked to align with markdown standards, resolving the IDE-reported diagnostics.

## 📌 Walkthrough - Align Swarm Folder Maps (Date: N/A | Match Score: 0.658)

### Walkthrough - Align Swarm Folder Maps

Refactored the project workspace maps to ensure that swarm agents utilize the correct actual file paths and can leverage Obsidian-style wikilinks.

#### Changes Made

##### Documentation & References

###### [DOMAIN_MAP.md](file:///home/dnguyen029/antigravity-project/DOMAIN_MAP.md)
- Removed all legacy and non-existent paths (such as `src/core/`, `src/agents/`, `ORDER_OF_OPERATIONS.md`).
- Added correct paths pointing to the actual execution and configuration directories (`app_build/`, `.agents/`, `production_artifacts/`).
- Added dual link capability (both standard file URL markdown links and Obsidian `[[Wikilinks]]`).

---

#### Verification Results

##### Manual Verification
- Verified that all mapped directories exist within the project root (`/home/dnguyen029/antigravity-project`).
- Verified that standard markdown URLs point to valid existing workspace paths.

