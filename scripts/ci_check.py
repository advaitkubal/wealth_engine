import subprocess
import sys

def run_command(cmd, name):
    print(f"Running {name}...")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ {name} failed:")
        print(result.stdout)
        print(result.stderr)
        return False
    print(f"✅ {name} passed.")
    return True

def main():
    print("Starting CI Checks...")
    
    checks = [
        ("backend/.venv/bin/pytest backend/tests/", "Pytest"),
        ("backend/.venv/bin/ruff check backend/app/ backend/tests/", "Ruff Linter"),
        ("backend/.venv/bin/mypy backend/app/ --ignore-missing-imports", "Mypy"),
        ("npx tsc --noEmit", "TypeScript Compiler")
    ]
    
    success = True
    for cmd, name in checks:
        if not run_command(cmd, name):
            success = False
            
    if success:
        print("\n🎉 All CI checks passed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Some CI checks failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
