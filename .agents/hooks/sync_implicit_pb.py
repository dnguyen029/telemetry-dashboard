#!/usr/bin/env python3
import os
import glob
import json

def main():
    implicit_dir = "/home/dnguyen029/.gemini/antigravity-ide/implicit"
    conv_dir = "/home/dnguyen029/.gemini/antigravity-ide/conversations"
    
    if os.path.isdir(implicit_dir) and os.path.isdir(conv_dir):
        pb_files = glob.glob(os.path.join(implicit_dir, "*.pb"))
        for pb_path in pb_files:
            filename = os.path.basename(pb_path)
            dest_path = os.path.join(conv_dir, filename)
            if not os.path.exists(dest_path) and not os.path.islink(dest_path):
                try:
                    os.symlink(pb_path, dest_path)
                except Exception:
                    pass
    # Protojson requires an empty object {} to represent an empty/void response struct on stdout.
    print(json.dumps({}), flush=True)

if __name__ == "__main__":
    main()
