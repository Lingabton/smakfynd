#!/bin/bash
# Full build pipeline — run from project root
cd "$(dirname "$0")"

# Snapshot docs/ before building (for deploy gate diff)
python3 scripts/deploy_gate.py snapshot && \

# Build pipeline (order matters)
python3 scripts/score_wines_v2.py && \
python3 scripts/build_app.py && \
python3 scripts/build_slim.py && \
python3 scripts/deploy_html.py && \
python3 scripts/generate_landing_pages.py && \
python3 scripts/validate_data.py && \

# Deploy gate: generate diff report (use --allowlist for VISIBLE deploys)
python3 scripts/deploy_gate.py check "$@" && \

echo "" && echo "Build complete!"
