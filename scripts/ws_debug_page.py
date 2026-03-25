#!/usr/bin/env python3
"""Dump the raw text of a WS critics page for debugging the parser."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import time

CHROME_PROFILE = str(Path.home() / ".ws-chrome-profile")
URL = "https://www.wine-searcher.com/critics-9-wine+spectator?sort=pa"

with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(
        user_data_dir=CHROME_PROFILE, headless=False,
        args=['--disable-blink-features=AutomationControlled'],
    )
    page = browser.pages[0] if browser.pages else browser.new_page()
    page.goto(URL)
    time.sleep(8)
    text = page.inner_text('body')
    Path('/tmp/ws_critics_page.txt').write_text(text)
    print("Saved to /tmp/ws_critics_page.txt")
    print(f"Length: {len(text)} chars")
    print("=" * 60)
    print(text[:3000])
    browser.close()
