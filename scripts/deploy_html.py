#!/usr/bin/env python3
"""
Build standalone HTML from JSX for GitHub Pages deployment.
Usage: python3 deploy_html.py
"""
import os, re

BASE = os.path.expanduser("~/smakfynd")
JSX_PATH = os.path.join(BASE, "site", "smakfynd-v7-slim.jsx")
OUT_PATH = os.path.join(BASE, "docs", "index.html")

# Read JSX
jsx = open(JSX_PATH).read()

# Remove React import line (CDN provides it globally)
jsx = re.sub(r'^import\s+\{[^}]+\}\s+from\s+"react";\s*\n', '', jsx)

# Find the main component name (last function declaration)
components = re.findall(r'function\s+(\w+)\s*\(', jsx)
main_component = components[-1] if components else "SmakfyndApp"

# Fix: ensure default export is removed
jsx = re.sub(r'export\s+default\s+\w+;?\s*$', '', jsx)

html = f"""<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smakfynd — Smartare vinval på Systembolaget</title>
  <meta name="description" content="Hitta bästa vinerna för pengarna på Systembolaget. Vivino-betyg + pris = Smakfynd-poäng.">
  <meta property="og:title" content="Smakfynd — Smartare vinval på Systembolaget">
  <meta property="og:description" content="Hitta bästa vinerna för pengarna. Vivino-betyg + pris = Smakfynd-poäng.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://smakfynd.se">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍷</text></svg>">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.9/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const {{ useState, useMemo, useEffect, useRef }} = React;

{jsx}

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(<{main_component} />);
  </script>
</body>
</html>"""

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w") as f:
    f.write(html)

size_kb = os.path.getsize(OUT_PATH) / 1024
print(f"Built: {OUT_PATH} ({size_kb:.0f} KB)")
print(f"Main component: {main_component}")
print(f"\nNext steps:")
print(f"  cd ~/smakfynd")
print(f"  git add docs/")
print(f"  git commit -m 'Add GitHub Pages site'")
print(f"  git push")
print(f"  # Then go to: https://github.com/Lingabton/smakfynd/settings/pages")
print(f"  # Source: Deploy from a branch → main → /docs → Save")
