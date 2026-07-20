#!/usr/bin/env python3
"""
flush_pending_lessons.py — PreInvocation hook
---------------------------------------------
Reads pending_lessons.json from the project root and flushes each entry
to the Supabase REST API directly (bypassing MCP entirely).

This hook fires at the START of every session, well before any IDE shutdown
signals can interfere. It is the safe delivery window for lessons that were
queued when end-of-session MCP calls were killed by SIGTERM.

Pending lesson format (pending_lessons.json):
[
  {
    "topic": "...",
    "content": "...",
    "lesson": "...",
    "agent": "...",
    "tags": [...],
    "embedding": [...],
    "supabase_synced": false,
    "supermemory_synced": false,
    "retry_count": 0
  }
]

Max retries per lesson: 10. Lessons exceeding this are dropped and logged.
"""
import os
import sys
import json
import datetime
import time
import urllib
import urllib.request
import urllib.error

MAX_RETRIES = 10


def log(msg: str) -> None:
    sys.stderr.write(f"[flush_pending_lessons] {msg}\n")
    sys.stderr.flush()


def validate_memory_content(content: str) -> bool:
    """
    Validates if the memory content is suitable for long-term storage.
    Blocks automated transient variable state dumps, JSON structures with execution stats, and debug logs.
    """
    if not content:
        return False
        
    stale_indicators = [
        "active_goal",
        "turn_count",
        "last_sync",
        "[HANDOFF]",
        "[ORCHESTRATOR]",
        "[ACTION]",
        "core_mcp",
        "pending_risk"
    ]
    
    content_lower = content.lower()
    for ind in stale_indicators:
        if ind.lower() in content_lower:
            return False
            
    return True


def load_env(project_root: str) -> None:
    env_path = os.path.join(project_root, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                stripped = line.strip()
                if stripped and not stripped.startswith("#") and "=" in stripped:
                    key, val = stripped.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip().strip("'\""))


def acquire_lock(lock_path: str, timeout: int = 10) -> bool:
    start_time = time.time()
    while True:
        try:
            fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            return True
        except FileExistsError:
            if time.time() - start_time > timeout:
                return False
            time.sleep(0.1)


def release_lock(lock_path: str) -> None:
    try:
        os.remove(lock_path)
    except FileNotFoundError:
        pass


def post_to_supabase(content: str, topic: str, tags: list, embedding: list | None, agent: str, url: str, key: str) -> bool:
    """POST a single lesson to Supabase REST API."""
    try:
        payload = {
            "topic": topic or "Lesson Learned",
            "content": content,
            "agent": agent or "IDE Agent",
            "tags": tags or []
        }
        if embedding:
            payload["embedding"] = embedding

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{url}/rest/v1/lessons_learned",
            data=data,
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            if status in (200, 201):
                log("Successfully flushed lesson to Supabase")
                return True
            else:
                body = resp.read().decode("utf-8", errors="ignore")[:200]
                log(f"Supabase returned unexpected status {status}: {body}")
                return False
    except Exception as e:
        log(f"HTTP error posting to Supabase: {e}")
        return False


def main() -> None:
    try:
        # Resolve project root
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

        # Pre-flight: workspace integrity
        if not os.path.exists(os.path.join(project_root, "bootstrap.md")):
            return

        queue_path = os.path.join(project_root, "pending_lessons.json")
        lock_path = os.path.join(project_root, "pending_lessons.json.lock")

        # Nothing to flush
        if not os.path.exists(queue_path):
            return

        # Load env for API keys
        load_env(project_root)
        sb_url = os.environ.get("SUPABASE_URL", "").strip()
        sb_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip() or os.environ.get("SUPABASE_KEY", "").strip()

        # Acquire lock to read/write the queue file
        if not acquire_lock(lock_path):
            log("Could not acquire queue lock file — skipping flush in this turn")
            return

        try:
            # Read queue
            try:
                with open(queue_path, "r", encoding="utf-8") as f:
                    queue = json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                log(f"Could not read pending_lessons.json: {e}")
                return

            if not isinstance(queue, list) or not queue:
                # Empty or malformed — clean up
                if os.path.exists(queue_path):
                    os.remove(queue_path)
                return

            log(f"Found {len(queue)} pending lesson(s) in offline queue")

            remaining = []
            for entry in queue:
                if not isinstance(entry, dict):
                    continue

                retry_count = entry.get("retry_count", 0)
                content = entry.get("content") or entry.get("lesson") or ""
                
                # Discard state variables/debug logs to prevent stale entries
                if not validate_memory_content(content):
                    log(f"Discarding stale/transient lesson queue entry: '{entry.get('topic', 'Lesson')}'")
                    continue

                topic = entry.get("topic") or "Lesson Learned"
                agent = entry.get("agent") or "IDE Agent"
                tags = entry.get("tags") or []
                embedding = entry.get("embedding")
                container_tag = entry.get("containerTag", "telemetry-dashboard")

                supabase_synced = entry.get("supabase_synced", False)

                if retry_count >= MAX_RETRIES:
                    log(f"Dropping lesson after {MAX_RETRIES} retries: {topic}")
                    continue

                if not content:
                    continue

                # Sync to Supabase
                if not supabase_synced:
                    if sb_url and sb_key:
                        log(f"Attempting Supabase sync for: '{topic}'")
                        if post_to_supabase(content, topic, tags, embedding, agent, sb_url, sb_key):
                            supabase_synced = True
                    else:
                        log("Supabase credentials not available")

                # Track changes or queue for retry
                entry["supermemory_synced"] = True
                entry["supabase_synced"] = supabase_synced

                if supabase_synced:
                    log(f"Fully synchronized to Supabase: '{topic}'")
                else:
                    entry["retry_count"] = retry_count + 1
                    entry["last_attempt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                    remaining.append(entry)
                    log(f"Queued for retry (attempt {retry_count + 1}/{MAX_RETRIES}): '{topic}'")

            # Write back remaining (or remove file if empty)
            if remaining:
                with open(queue_path, "w", encoding="utf-8") as f:
                    json.dump(remaining, f, indent=2)
                log(f"{len(remaining)} lesson(s) remain in offline queue")
            else:
                if os.path.exists(queue_path):
                    os.remove(queue_path)
                log("Queue fully flushed and cleared")
        finally:
            release_lock(lock_path)

    except Exception as e:
        log(f"Unexpected error in main execution: {e}")

    finally:
        # Hook schema requires printing empty JSON object to stdout
        print(json.dumps({}), flush=True)


if __name__ == "__main__":
    main()
