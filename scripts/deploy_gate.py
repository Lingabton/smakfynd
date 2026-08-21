#!/usr/bin/env python3
"""
Deploy Gate — S1-0
Enforces deploy discipline for Smakfynd.

Rules:
  1. One change type per deploy (copy, data, template, tracking)
  2. VISIBLE changes (rendered HTML that crawlers see) max 10 pages per deploy,
     controlled by an explicit page allowlist.
  3. INVISIBLE changes (pipeline internals, data plumbing, logging) have no limit.

Usage:
  # Before build: snapshot current state
  python3 scripts/deploy_gate.py snapshot

  # After build: generate diff report + enforce limits
  python3 scripts/deploy_gate.py check [--allowlist page1,page2,...]

  # Tag a deploy
  python3 scripts/deploy_gate.py tag [message]

  # Rollback to previous deploy tag
  python3 scripts/deploy_gate.py rollback
"""

import json, os, sys, re, subprocess, hashlib
from pathlib import Path
from datetime import datetime
from html.parser import HTMLParser

BASE = Path(__file__).parent.parent
DOCS = BASE / "docs"
SNAPSHOT_DIR = BASE / "data" / "deploy"
SNAPSHOT_FILE = SNAPSHOT_DIR / "pre_build_snapshot.json"
DEPLOY_LOG = BASE / "data" / "deploy" / "deploy_log.txt"
MAX_VISIBLE_PAGES = 10


class PageExtractor(HTMLParser):
    """Extract title, meta description, canonical, H1, word count, and list item count from HTML."""
    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta_desc = ""
        self.canonical = ""
        self.h1 = ""
        self._in_title = False
        self._in_h1 = False
        self._text_parts = []
        self._in_body = False
        self._wine_count = 0
        self._in_ol = False
        self._li_count = 0

    def handle_starttag(self, tag, attrs):
        attrs_d = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "meta" and attrs_d.get("name", "").lower() == "description":
            self.meta_desc = attrs_d.get("content", "")
        elif tag == "link" and attrs_d.get("rel", "").lower() == "canonical":
            self.canonical = attrs_d.get("href", "")
        elif tag == "h1":
            self._in_h1 = True
        elif tag == "body":
            self._in_body = True
        elif tag == "ol" and attrs_d.get("id") == "wine-list":
            self._in_ol = True
        elif tag == "li" and self._in_ol:
            self._li_count += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "h1":
            self._in_h1 = False
        elif tag == "ol" and self._in_ol:
            self._in_ol = False
        elif tag == "body":
            self._in_body = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif self._in_h1:
            self.h1 += data
        if self._in_body:
            self._text_parts.append(data)

    @property
    def word_count(self):
        text = " ".join(self._text_parts)
        return len(re.findall(r'\b\w+\b', text))

    @property
    def list_item_count(self):
        return self._li_count


def extract_page_info(html_path):
    """Extract key SEO signals from an HTML file."""
    try:
        html = html_path.read_text(encoding="utf-8")
    except Exception:
        return None
    parser = PageExtractor()
    parser.feed(html)

    # Count wine entries: look for systembolaget.se/produkt links
    wine_count = len(re.findall(r'systembolaget\.se/produkt/vin/\d+', html))

    return {
        "title": parser.title.strip(),
        "meta": parser.meta_desc.strip(),
        "canonical": parser.canonical.strip(),
        "h1": parser.h1.strip(),
        "word_count": parser.word_count,
        "wine_count": wine_count,
        "list_item_count": parser.list_item_count,
        "hash": hashlib.md5(html.encode()).hexdigest(),
    }


def get_all_pages():
    """Scan docs/ for all HTML pages."""
    pages = {}
    # Main index
    main_index = DOCS / "index.html"
    if main_index.exists():
        info = extract_page_info(main_index)
        if info:
            pages["/"] = info

    # Landing pages
    for d in sorted(DOCS.iterdir()):
        if d.is_dir():
            idx = d / "index.html"
            if idx.exists():
                info = extract_page_info(idx)
                if info:
                    pages[f"/{d.name}/"] = info
    return pages


def snapshot():
    """Take a snapshot of current docs/ state before building."""
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    pages = get_all_pages()
    data = {
        "timestamp": datetime.now().isoformat(),
        "pages": pages,
    }
    SNAPSHOT_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"Snapshot: {len(pages)} pages captured → {SNAPSHOT_FILE}")


def check(allowlist=None):
    """Compare current docs/ against snapshot. Enforce deploy rules."""
    if not SNAPSHOT_FILE.exists():
        print("ERROR: No pre-build snapshot found. Run `deploy_gate.py snapshot` before building.")
        sys.exit(1)

    old = json.loads(SNAPSHOT_FILE.read_text())
    old_pages = old["pages"]
    new_pages = get_all_pages()

    # Find changes
    changed = []
    added = []
    removed = []

    for path, new_info in new_pages.items():
        if path not in old_pages:
            added.append(path)
        elif new_info["hash"] != old_pages[path]["hash"]:
            changed.append(path)

    for path in old_pages:
        if path not in new_pages:
            removed.append(path)

    # Classify: INVISIBLE files don't affect rendered HTML seen by crawlers
    invisible_paths = {"/"}  # Main SPA index changes are data loads, not content
    invisible_files = {"wines.json", "sitemap.xml", "robots.txt", "sw.js", "manifest.json"}

    def is_visible_change(path, old_info, new_info):
        """A change is VISIBLE if any crawler-facing signal changed."""
        if path in invisible_paths:
            return False
        for key in ("title", "meta", "canonical", "h1", "word_count", "wine_count", "list_item_count"):
            if old_info.get(key) != new_info.get(key):
                return True
        return False

    visible_changes = []
    invisible_changes = []

    for path in changed:
        old_info = old_pages.get(path, {})
        new_info = new_pages.get(path, {})
        if is_visible_change(path, old_info, new_info):
            visible_changes.append(path)
        else:
            invisible_changes.append(path)

    # All new pages are VISIBLE
    visible_changes.extend(added)

    # Generate diff report
    report_lines = []
    report_lines.append(f"Deploy Diff Report — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    report_lines.append(f"Snapshot from: {old['timestamp']}")
    report_lines.append(f"")
    report_lines.append(f"Summary:")
    report_lines.append(f"  Total pages: {len(new_pages)} (was {len(old_pages)})")
    report_lines.append(f"  VISIBLE changes: {len(visible_changes)}")
    report_lines.append(f"  INVISIBLE changes: {len(invisible_changes)}")
    report_lines.append(f"  Added: {len(added)}")
    report_lines.append(f"  Removed: {len(removed)}")
    report_lines.append(f"")

    if visible_changes:
        report_lines.append("VISIBLE changes (crawler-facing):")
        for path in sorted(visible_changes):
            old_info = old_pages.get(path, {})
            new_info = new_pages.get(path, {})
            report_lines.append(f"  {path}")
            if path in added:
                report_lines.append(f"    [NEW PAGE]")
            for key in ("title", "meta", "canonical", "h1", "word_count", "wine_count", "list_item_count"):
                ov = old_info.get(key, "—")
                nv = new_info.get(key, "—")
                if ov != nv:
                    report_lines.append(f"    {key}: {ov!r} → {nv!r}")
        report_lines.append("")

    if invisible_changes:
        report_lines.append(f"INVISIBLE changes: {', '.join(sorted(invisible_changes))}")
        report_lines.append("")

    if removed:
        report_lines.append(f"REMOVED pages: {', '.join(sorted(removed))}")
        report_lines.append("")

    report = "\n".join(report_lines)
    report_file = SNAPSHOT_DIR / "diff_report.txt"
    report_file.write_text(report)
    print(report)
    print(f"\nReport saved: {report_file}")

    # Enforce allowlist for VISIBLE changes
    if visible_changes:
        if allowlist is None:
            print(f"\nERROR: {len(visible_changes)} VISIBLE changes detected but no --allowlist provided.")
            print(f"VISIBLE changes require an explicit allowlist. Use:")
            print(f"  python3 scripts/deploy_gate.py check --allowlist {','.join(sorted(visible_changes)[:3])}")
            sys.exit(1)

        allowed = set(a.strip() for a in allowlist)
        # Normalize: ensure leading/trailing slashes
        allowed_normalized = set()
        for a in allowed:
            if not a.startswith("/"):
                a = "/" + a
            if not a.endswith("/"):
                a = a + "/"
            allowed_normalized.add(a)

        unauthorized = [p for p in visible_changes if p not in allowed_normalized]
        if unauthorized:
            print(f"\nERROR: {len(unauthorized)} VISIBLE changes not in allowlist:")
            for p in sorted(unauthorized):
                print(f"  {p}")
            sys.exit(1)

        if len(visible_changes) > MAX_VISIBLE_PAGES:
            print(f"\nERROR: {len(visible_changes)} VISIBLE changes exceed limit of {MAX_VISIBLE_PAGES}.")
            print(f"Deploy max {MAX_VISIBLE_PAGES} VISIBLE pages at a time.")
            sys.exit(1)

        print(f"\nAllowlist check: {len(visible_changes)} VISIBLE changes, all authorized.")

    if not visible_changes and not invisible_changes and not added and not removed:
        print("\nNo changes detected.")

    print("Deploy gate: PASS")
    return 0


def tag(message=None):
    """Tag the current commit as a deploy."""
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    tag_name = f"deploy-{ts}"
    msg = message or f"Deploy {ts}"

    result = subprocess.run(
        ["git", "tag", "-a", tag_name, "-m", msg],
        cwd=str(BASE), capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"ERROR: git tag failed: {result.stderr}")
        sys.exit(1)

    # Append to deploy log
    DEPLOY_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(DEPLOY_LOG, "a") as f:
        commit = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=str(BASE), capture_output=True, text=True
        ).stdout.strip()
        f.write(f"{ts} | {tag_name} | {commit} | {msg}\n")

    print(f"Tagged: {tag_name} ({msg})")
    print(f"Deploy log: {DEPLOY_LOG}")


def rollback():
    """Show the previous deploy tag and provide the rollback command."""
    result = subprocess.run(
        ["git", "tag", "-l", "deploy-*", "--sort=-creatordate"],
        cwd=str(BASE), capture_output=True, text=True
    )
    tags = result.stdout.strip().split("\n")
    tags = [t for t in tags if t]

    if len(tags) < 2:
        print("ERROR: Need at least 2 deploy tags to rollback. Current tags:", tags)
        sys.exit(1)

    current = tags[0]
    previous = tags[1]
    print(f"Current deploy:  {current}")
    print(f"Previous deploy: {previous}")
    print(f"")
    print(f"To rollback, run:")
    print(f"  git checkout {previous} -- docs/")
    print(f"  git commit -m 'rollback: revert to {previous}'")
    print(f"  git push")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "snapshot":
        snapshot()
    elif cmd == "check":
        allowlist = None
        for i, arg in enumerate(sys.argv[2:], 2):
            if arg == "--allowlist" and i + 1 < len(sys.argv):
                allowlist = sys.argv[i + 1].split(",")
            elif arg.startswith("--allowlist="):
                allowlist = arg.split("=", 1)[1].split(",")
        check(allowlist)
    elif cmd == "tag":
        msg = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else None
        tag(msg)
    elif cmd == "rollback":
        rollback()
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
