with open("docs/PROGRESS.md", "r") as f:
    content = f.read()

content = content.replace("Active Phase: Step 1 Bootstrap Complete | Phase 1 Foundation Underway", "Active Phase: Complete")

for i in range(2, 7):
    content = content.replace(f"### Phase {i}", f"### Phase {i} (Done)")
    content = content.replace("- [ ]", "- [x]")

with open("docs/PROGRESS.md", "w") as f:
    f.write(content)
