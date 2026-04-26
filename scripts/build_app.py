#!/usr/bin/env python3
"""
Concatenate src/ files into a single JSX file for Babel transpilation.
Order matters — dependencies must come before dependents.
"""

import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(SCRIPT_DIR)
SRC = os.path.join(BASE, "src")
OUTPUT = os.path.join(SCRIPT_DIR, "smakfynd-v7.jsx")

# Concatenation order (dependencies first)
FILES = [
    "constants.jsx",
    "theme.jsx",
    "utils.jsx",
    "components/ScoreBars.jsx",
    "components/ProductImage.jsx",
    "hooks.jsx",
    "components/Card.jsx",
    "components/SaveButton.jsx",
    "components/AIQuestion.jsx",
    "components/LoginModal.jsx",
    "components/TrustBox.jsx",
    "components/WeeklyPick.jsx",
    "components/QuickFilters.jsx",
    "components/EditorsPicks.jsx",
    "components/FoodMatch.jsx",
    "components/NewsletterCTA.jsx",
    "components/WineOfDay.jsx",
    "components/StoreMode.jsx",
    "components/AgeGate.jsx",
    "App.jsx",
]

parts = []
total_lines = 0
for f in FILES:
    path = os.path.join(SRC, f)
    if not os.path.exists(path):
        print(f"  MISSING: {f}")
        continue
    content = open(path).read()
    lines = content.count('\n')
    total_lines += lines
    parts.append(f"// {'═' * 60}")
    parts.append(f"// {f}")
    parts.append(f"// {'═' * 60}")
    parts.append(content)
    print(f"  {f}: {lines} lines")

result = '\n'.join(parts)
with open(OUTPUT, 'w') as f:
    f.write(result)

size = os.path.getsize(OUTPUT) / 1024
print(f"\nConcatenated: {len(FILES)} files, {total_lines} lines → {OUTPUT} ({size:.0f} KB)")
