#!/usr/bin/env python3
"""Bootstrap price-drop data from vinpriser.se (one-time)"""
import json, os, re

OUT = os.path.expanduser("~/smakfynd/data/prissankt_bootstrap.json")

async def scrape():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        print("Loading vinpriser.se...")
        await page.goto("https://vinpriser.se/", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)

        # Click "Visa fler" until all loaded
        clicks = 0
        while True:
            try:
                btn = page.locator("button:has-text('Visa fler'), a:has-text('Visa fler')").first
                if await btn.is_visible(timeout=2000):
                    await btn.click()
                    clicks += 1
                    print(f"  Visa fler #{clicks}...")
                    await page.wait_for_timeout(1500)
                else:
                    break
            except:
                break
        print(f"Clicked {clicks} times. Extracting from page HTML...")

        # Get full page HTML and parse with regex
        html = await page.content()
        
        # Debug: save HTML for inspection
        debug_path = os.path.expanduser("~/smakfynd/data/vinpriser_debug.html")
        with open(debug_path, "w") as f:
            f.write(html)
        print(f"Saved debug HTML to {debug_path}")
        
        await browser.close()

        # Find all links like /prissankt/7904501-...
        links = re.findall(r'/prissankt/(\d+)-[^"\']+', html)
        unique_nrs = list(set(links))
        print(f"Found {len(unique_nrs)} unique article numbers")

        # Try multiple regex strategies to find prices
        wines = []
        
        # Strategy 1: Find blocks with href containing article nr, then two prices
        blocks = re.findall(
            r'href="[^"]*?/prissankt/(\d+)-[^"]*".*?(\d+):-.*?(\d+):-',
            html, re.DOTALL
        )
        print(f"Strategy 1 (href+prices): {len(blocks)} blocks")

        # Strategy 2: Look for the card structure more broadly
        cards = re.findall(
            r'/prissankt/(\d+)-.*?(\d+)\s*:-.*?(\d+)\s*:-',
            html, re.DOTALL
        )
        print(f"Strategy 2 (broad): {len(cards)} cards")
        
        # Strategy 3: find all prices on the page
        all_prices = re.findall(r'(\d+)\s*:-', html)
        print(f"Total price-like patterns on page: {len(all_prices)}")
        
        # Use whichever strategy found more
        best = blocks if len(blocks) >= len(cards) else cards
        
        for nr, price1, price2 in best:
            current = min(int(price1), int(price2))
            old = max(int(price1), int(price2))
            if old > current:
                drop = round((1 - current/old) * 100)
                wines.append({
                    "nr": nr,
                    "price_now": current,
                    "price_old": old,
                    "drop_pct": drop
                })

        # Deduplicate
        seen = {}
        for w in wines:
            if w["nr"] not in seen:
                seen[w["nr"]] = w
        return list(seen.values())

if __name__ == "__main__":
    import asyncio
    wines = asyncio.run(scrape())
    with open(OUT, "w") as f:
        json.dump(wines, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(wines)} wines to {OUT}")
    if wines:
        print(f"Example: {wines[0]}")
    else:
        print("\nNo wines found. Check ~/smakfynd/data/vinpriser_debug.html")
        print("Open it in browser and search for ':-' to see price format.")
