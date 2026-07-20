#!/usr/bin/env python3
import os
import sys

# Dynamically inject user site-packages path to resolve package imports in isolated environments
user_site_packages = os.path.expanduser("~/.local/lib/python3.11/site-packages")
if user_site_packages not in sys.path:
    sys.path.insert(0, user_site_packages)

import hashlib
import requests  # type: ignore
import json
from google import genai
from google.genai import types

def log(msg):
    sys.stderr.write(str(msg) + "\n")
    sys.stderr.flush()

def load_env(project_root):
    env_path = os.path.join(project_root, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                stripped = line.strip()
                if stripped and not stripped.startswith("#") and "=" in stripped:
                    key, val = stripped.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip("'\"")

def get_file_hash(file_path):
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def main():
    try:
        # Resolve project root dynamically
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
        
        # Pre-flight: Workspace Integrity Checks
        bootstrap_path = os.path.join(project_root, "bootstrap.md")
        ripple_path = os.path.join(project_root, "RIPPLE_MAP.md")
        if not os.path.exists(bootstrap_path) or not os.path.exists(ripple_path):
            log("Pre-flight: bootstrap.md or RIPPLE_MAP.md is missing. Workspace is not initialized. Skipping archive.")
            return

        # Trigger codebase indexing automatically
        if os.path.exists(os.path.join(project_root, "app_build/tools/index_codebase.py")):
            try:
                log("Triggering codebase reindexing...")
                if project_root not in sys.path:
                    sys.path.append(project_root)
                import importlib
                index_codebase = importlib.import_module("app_build.tools.index_codebase")
                index_codebase.run_indexing()
            except Exception as idx_err:
                log(f"Warning: Failed to run codebase indexer: {idx_err}")

        walkthrough_path = os.path.join(project_root, "production_artifacts/walkthrough.md")
        hash_cache_path = os.path.join(project_root, ".agents/hooks/.walkthrough_hash")
        
        # Pre-flight checks:
        # 1. Verify walkthrough exists and is readable
        if not os.path.exists(walkthrough_path) or not os.access(walkthrough_path, os.R_OK):
            log("Pre-flight: walkthrough.md does not exist or is not readable. Skipping archive.")
            return

        # 2. Verify env configuration
        load_env(project_root)
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            log("Pre-flight: SUPABASE_URL or SUPABASE_KEY is missing from environment. Skipping archive.")
            return

        # 3. Ensure hash cache directory exists and is writeable
        hash_dir = os.path.dirname(hash_cache_path)
        if not os.path.exists(hash_dir):
            try:
                os.makedirs(hash_dir, exist_ok=True)
            except Exception as e:
                log(f"Pre-flight: failed to create hash cache directory: {e}")
                return
                
        if not os.access(hash_dir, os.W_OK):
            log("Pre-flight: hash cache directory is not writeable. Skipping archive.")
            return

        try:
            current_hash = get_file_hash(walkthrough_path)
        except Exception as e:
            log(f"Error calculating walkthrough hash: {e}")
            return

        # Check if hash matches cache
        if os.path.exists(hash_cache_path):
            try:
                with open(hash_cache_path, "r") as hf:
                    cached_hash = hf.read().strip()
                if current_hash == cached_hash:
                    # No changes to walkthrough, skip archiving
                    return
            except Exception:
                pass

        # Read walkthrough content
        try:
            with open(walkthrough_path, "r", encoding="utf-8") as wf:
                lines = wf.readlines()
        except Exception as e:
            log(f"Error reading walkthrough: {e}")
            return

        if not lines:
            return

        # Extract topic (first heading line) and clean it up
        topic = "Walkthrough Alignment"
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("#"):
                topic = stripped.lstrip("#").strip()
                break

        content = "".join(lines).strip()

        # Scribe to Supabase
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

        payload: dict = {
            "topic": topic,
            "agent": "IDE Agent",
            "content": content
        }

        # Generate embedding if GEMINI_API_KEY is available
        gemini_key = os.environ.get("GEMINI_API_KEY")
        embedding_val = None
        if gemini_key:
            try:
                text_to_embed = f"{topic}\n{content}".strip()
                if text_to_embed:
                    client = genai.Client(api_key=gemini_key)
                    emb_res = client.models.embed_content(
                        model="models/gemini-embedding-001",
                        contents=text_to_embed,
                        config=types.EmbedContentConfig(output_dimensionality=384)
                    )
                    if emb_res and emb_res.embeddings:
                        embedding_val = emb_res.embeddings[0].values
                        payload["embedding"] = embedding_val
                        log("Generated 384-dimensional embedding for archiving.")
            except Exception as emb_err:
                log(f"Warning: Failed to generate embedding: {emb_err}")

        supabase_synced = False
        try:
            res = requests.post(f"{url}/rest/v1/lessons_learned", headers=headers, json=payload, timeout=15)
            if res.status_code in [200, 201]:
                log(f"Successfully archived walkthrough lesson to Supabase (ID: {res.json()[0].get('id')})")
                supabase_synced = True
            else:
                log(f"Failed to archive lesson to Supabase: Status {res.status_code} - {res.text}")
        except Exception as e:
            log(f"Error during Supabase post: {e}")

        # Cache walkthrough hash if synced successfully
        if supabase_synced:
            try:
                with open(hash_cache_path, "w") as hf:
                    hf.write(current_hash)
            except Exception as cache_err:
                log(f"Failed to write hash cache: {cache_err}")
        else:
            # Queue to pending_lessons.json for later retry (flush_pending_lessons.py)
            queue_path = os.path.join(project_root, "pending_lessons.json")
            lock_path = os.path.join(project_root, "pending_lessons.json.lock")
            log(f"Queueing unsynced lesson (Supabase: {supabase_synced})")

            import time
            acquired = False
            start_time = time.time()
            while time.time() - start_time < 10:
                try:
                    fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                    os.close(fd)
                    acquired = True
                    break
                except FileExistsError:
                    time.sleep(0.1)

            if acquired:
                try:
                    queue = []
                    if os.path.exists(queue_path):
                        try:
                            with open(queue_path, "r", encoding="utf-8") as qf:
                                queue = json.load(qf)
                        except Exception:
                            queue = []
                    if not isinstance(queue, list):
                        queue = []

                    queue.append({
                        "topic": topic,
                        "content": content,
                        "agent": "IDE Agent",
                        "tags": [],
                        "embedding": embedding_val,
                        "supabase_synced": supabase_synced,
                        "supermemory_synced": True, # set True to satisfy any legacy schema checks
                        "retry_count": 0,
                        "containerTag": "telemetry-dashboard"
                    })

                    with open(queue_path, "w", encoding="utf-8") as qf:
                        json.dump(queue, qf, indent=2)
                    log("Successfully queued lesson in pending_lessons.json")
                    
                    # Update walkthrough hash since we queued it for guaranteed delivery
                    with open(hash_cache_path, "w") as hf:
                        hf.write(current_hash)
                except Exception as q_err:
                    log(f"Failed to write to queue file: {q_err}")
                finally:
                    try:
                        os.remove(lock_path)
                    except Exception:
                        pass
            else:
                log("Failed to acquire pending_lessons lock file — lesson was not queued.")

    finally:
        # Protojson requires an empty object {} to represent an empty/void response struct on stdout.
        print(json.dumps({}), flush=True)

if __name__ == "__main__":
    main()
