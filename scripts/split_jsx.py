#!/usr/bin/env python3
"""
Split smakfynd-v7.jsx into logical source files under src/.
Run once to create the initial split. After that, edit src/ files directly.
"""

import re, os

BASE = os.path.expanduser("~/smakfynd")
SRC = os.path.join(BASE, "scripts", "smakfynd-v7.jsx")
OUT = os.path.join(BASE, "src")

jsx = open(SRC).read()
lines = jsx.split('\n')

# Define split points by line content patterns
sections = [
    ("constants.jsx", 1, "// ── Color system ──"),
    ("theme.jsx", "// ── Color system ──", "function rescale("),
    ("utils.jsx", "function rescale(", "function MiniBar("),
    ("components/ScoreBars.jsx", "function MiniBar(", "function getImageUrl("),
    ("components/ProductImage.jsx", "function getImageUrl(", "function useSaved()"),
    ("hooks.jsx", "function useSaved()", "function Card("),
    ("components/Card.jsx", "function Card(", "function SaveButton("),
    ("components/SaveButton.jsx", "function SaveButton(", "function AIQuestion("),
    ("components/AIQuestion.jsx", "function AIQuestion(", "function EditorsPicks("),
    ("components/EditorsPicks.jsx", "function EditorsPicks(", "const WINE_AI_URL"),
    ("components/FoodMatch.jsx", "const WINE_AI_URL", "function StoreMode("),
    ("components/StoreMode.jsx", "function StoreMode(", "function AgeGate("),
    ("components/AgeGate.jsx", "function AgeGate(", "function Smakfynd()"),
    ("App.jsx", "function Smakfynd()", None),
]

def find_line(pattern, lines):
    for i, l in enumerate(lines):
        if pattern in l:
            return i
    return None

for filename, start_pat, end_pat in sections:
    if isinstance(start_pat, int):
        start = start_pat - 1
    else:
        start = find_line(start_pat, lines)
        if start is None:
            print(f"  SKIP {filename}: pattern '{start_pat}' not found")
            continue

    if end_pat is None:
        end = len(lines)
    else:
        end = find_line(end_pat, lines)
        if end is None:
            print(f"  SKIP {filename}: end pattern '{end_pat}' not found")
            continue

    content = '\n'.join(lines[start:end]).strip() + '\n'

    path = os.path.join(OUT, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(f"// src/{filename}\n")
        f.write(content)

    print(f"  {filename}: lines {start+1}-{end} ({end-start} lines)")

print(f"\nSplit into {len(sections)} files in {OUT}/")
