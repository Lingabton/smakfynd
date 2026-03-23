#!/usr/bin/env python3
"""
Build smakfynd-v7.jsx with embedded real data.
Run on Gabriel's Mac: python3 ~/smakfynd/scripts/build_site.py
"""
import json, os

DATA_DIR = os.path.expanduser("~/smakfynd/data")
SITE_FILE = os.path.expanduser("~/smakfynd/scripts/smakfynd-v7.jsx") 
OUTPUT = os.path.expanduser("~/smakfynd/site/smakfynd-v7-live.jsx")

# Load web data
data = json.load(open(os.path.join(DATA_DIR, "smakfynd_web.json")))
print(f"Loaded {len(data)} products")

# Read the JSX template
jsx = open(SITE_FILE).read()

# Replace empty SAMPLE_PRODUCTS with real data
js_data = json.dumps(data, ensure_ascii=False)
jsx = jsx.replace(
    'const SAMPLE_PRODUCTS = []; // Will be replaced by loaded data',
    f'const SAMPLE_PRODUCTS = {js_data};'
)

# Ensure output dir exists
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
open(OUTPUT, 'w').write(jsx)

size = os.path.getsize(OUTPUT) / 1024
print(f"Built site: {OUTPUT} ({size:.0f} KB)")
print(f"Products embedded: {len(data)}")
