#!/usr/bin/env python3
import os, re

BASE = os.path.expanduser("~/smakfynd")
JSX_PATH = os.path.join(BASE, "site", "smakfynd-v7-slim.jsx")
OUT_PATH = os.path.join(BASE, "docs", "index.html")

jsx = open(JSX_PATH).read()
jsx = re.sub(r'^import\s+\{[^}]+\}\s+from\s+"react";\s*\n', '', jsx)

m = re.search(r'export\s+default\s+function\s+(\w+)', jsx)
if m:
    comp = m.group(1)
else:
    m2 = re.search(r'export\s+default\s+(\w+)', jsx)
    comp = m2.group(1) if m2 else "SmakfyndApp"

jsx = re.sub(r'export\s+default\s+', '', jsx)

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
    root.render(<{comp} />);
  </script>
</body>
</html>"""

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w") as f:
    f.write(html)
print(f"Built: {OUT_PATH} ({os.path.getsize(OUT_PATH)/1024:.0f} KB)")
print(f"Main component: {comp}")
