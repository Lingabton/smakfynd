#!/bin/bash
# Full build pipeline — run from project root
cd "$(dirname "$0")"
python3 scripts/score_wines_v2.py && \
python3 scripts/build_app.py && \
python3 scripts/build_slim.py && \
python3 scripts/deploy_html.py && \
python3 scripts/generate_landing_pages.py && \
python3 scripts/validate_data.py && \
echo "" && echo "✓ Build complete!"
