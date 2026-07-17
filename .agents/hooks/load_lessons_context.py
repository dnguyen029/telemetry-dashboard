#!/usr/bin/env python3
import os
import sys

# Dynamically inject user site-packages path to resolve package imports in isolated environments
user_site_packages = os.path.expanduser("~/.local/lib/python3.11/site-packages")
if user_site_packages not in sys.path:
    sys.path.insert(0, user_site_packages)

import json
import requests
from google import genai
from google.genai import types

def load_env(project_root):
    env_path = os.path.join(project_root, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip("'\"")

def main():
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
        load_env(project_root)

        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
        gemini_key = os.environ.get("GEMINI_API_KEY")

        if not url or not key:
            # Silently exit on missing env to avoid blocking IDE lifecycle
            print(json.dumps({}), flush=True)
            return

        # 1. Read stdin to get user's prompt
        prompt = ""
        if not sys.stdin.isatty():
            try:
                input_data = sys.stdin.read()
                # Debug logging to verify key names
                debug_path = os.path.join(project_root, ".agents", "hooks", ".debug_prompt_payload.json")
                with open(debug_path, "w") as df:
                    df.write(input_data)
                if input_data.strip():
                    payload = json.loads(input_data)
                    # Check common prompt fields in payload
                    prompt = (
                        payload.get("prompt") or 
                        payload.get("userPrompt") or 
                        payload.get("request") or 
                        payload.get("message") or 
                        payload.get("text") or ""
                    )
                    # If not found directly, extract from transcriptPath if available
                    if not prompt:
                        transcript_path = payload.get("transcriptPath")
                        if transcript_path and os.path.exists(transcript_path):
                            with open(transcript_path, "r", encoding="utf-8") as tf:
                                for line in tf:
                                    try:
                                        data = json.loads(line)
                                        if data.get("type") == "USER_INPUT":
                                            content = data.get("content", "")
                                            if content and "Comments on artifact" not in content:
                                                if "<USER_REQUEST>" in content:
                                                    prompt = content.split("<USER_REQUEST>")[1].split("</USER_REQUEST>")[0].strip()
                                                else:
                                                    prompt = content.strip()
                                    except Exception:
                                        pass
            except Exception:
                pass

        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }

        records = None
        method_used = "chronological"

        # 2. Try Semantic Search if prompt and gemini_key exist
        if prompt and gemini_key:
            try:
                # Generate embedding
                client = genai.Client(api_key=gemini_key)
                emb_res = client.models.embed_content(
                    model="models/gemini-embedding-001",
                    contents=prompt,
                    config=types.EmbedContentConfig(output_dimensionality=384)
                )
                if not emb_res or not emb_res.embeddings or len(emb_res.embeddings) == 0:
                    raise ValueError("No embeddings returned")
                first_embedding = emb_res.embeddings[0]
                if not first_embedding or not first_embedding.values:
                    raise ValueError("Embedding values are empty")
                embedding = first_embedding.values
                embedding_str = f"[{','.join(map(str, embedding))}]"


                # Call match_lessons RPC on Supabase.
                # Request 15 matching rows to allow room for topic-level deduplication.
                payload = {
                    "query_embedding": embedding_str,
                    "match_threshold": 0.3,
                    "match_count": 15
                }
                res = requests.post(f"{url}/rest/v1/rpc/match_lessons", headers=headers, json=payload, timeout=10)
                if res.status_code == 200:
                    records = res.json()
                    method_used = "semantic"
            except Exception:
                # Fallback to chronological on any semantic failure
                pass

        # 3. Fallback to Chronological if Semantic search is not applicable or returned no records
        if not records:
            try:
                # Fetch 15 rows to allow topic-level deduplication.
                res = requests.get(
                    f"{url}/rest/v1/lessons_learned?select=topic,content,created_at&order=created_at.desc&limit=15",
                    headers=headers,
                    timeout=10
                )
                if res.status_code == 200:
                    records = res.json()
            except Exception:
                pass

        lessons_md = "# 🧠 Active lessons learned context (Ground Truth)\n"
        lessons_md += f"<!-- Method: {method_used} -->\n\n"
        if records:
            # Deduplicate by topic to prevent crowding out
            seen_topics = set()
            unique_records = []
            for rec in records:
                topic = rec.get("topic", "N/A").strip()
                if topic not in seen_topics:
                    seen_topics.add(topic)
                    unique_records.append(rec)
                    if len(unique_records) >= 5:
                        break
            
            for rec in unique_records:
                topic = rec.get("topic", "N/A").strip()
                content = rec.get("content", "N/A").strip()
                created_at = rec.get("created_at", "N/A").strip()
                similarity = rec.get("similarity")
                score_str = f" | Match Score: {similarity:.3f}" if similarity is not None else ""
                
                # Demote headings to prevent H1 duplicates (MD025) and fix heading increment (MD001)
                # and convert unordered list style '*' to '-' (MD004)
                cleaned_lines = []
                for line in content.splitlines():
                    # Remove trailing spaces (MD009)
                    line = line.rstrip()
                    # Demote headings (H1 -> H3, H2 -> H4, etc.)
                    if line.startswith("#"):
                        line = "##" + line
                    # Fix fenced code block missing language (MD040)
                    stripped = line.lstrip()
                    if stripped == "```":
                        indent = len(line) - len(stripped)
                        line = line[:indent] + "```text"
                    # Fix unordered list style from '*' to '-'
                    elif stripped.startswith("* "):
                        indent = len(line) - len(stripped)
                        line = line[:indent] + "- " + stripped[2:]
                    cleaned_lines.append(line)
                
                cleaned_content = "\n".join(cleaned_lines)
                # Ensure no multiple blank lines (MD012)
                while "\n\n\n" in cleaned_content:
                    cleaned_content = cleaned_content.replace("\n\n\n", "\n\n")
                
                lessons_md += f"## 📌 {topic} (Date: {created_at}{score_str})\n\n{cleaned_content}\n\n"
        else:
            lessons_md += "No historical lessons learned found in database.\n\n"

        # Write to cached context file in the .agents folder
        context_file_path = os.path.join(project_root, ".agents", "lessons_context.md")
        with open(context_file_path, "w") as f:
            f.write(lessons_md)

    except Exception:
        pass

    # Satisfy hook protojson requirements: stdout must be an empty JSON object
    print(json.dumps({}), flush=True)

if __name__ == "__main__":
    main()
