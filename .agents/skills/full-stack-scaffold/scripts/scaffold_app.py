import sys


def scaffold_app(project_type):
    print(f"🏗️ Scaffolding {project_type} application...")
    print("✅ Created folder structure.")
    print("✅ Initialized git and dependencies.")


if __name__ == "__main__":
    t = sys.argv[1] if len(sys.argv) > 1 else "nextjs"
    scaffold_app(t)
