#!/usr/bin/env python3
"""
Fetch Google Search Console data for smakfynd.se via API.
Outputs data/gsc_history.json — merges new daily data with existing history.

Usage:
  python3 scripts/fetch_gsc.py            # latest 28 days
  python3 scripts/fetch_gsc.py --backfill # full 16 months (GSC API max)

Requires:
  pip install google-auth google-api-python-client

Credentials: set GSC_CREDENTIALS_JSON env var to the path of a service account
JSON file, or place it at data/gsc_credentials.json (gitignored).

The service account must be added as a user in Google Search Console for
sc-domain:smakfynd.se (Settings > Users and permissions > Add user, Full access).
"""

import json, os, sys
from datetime import date, timedelta
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

DATA_DIR = Path(__file__).parent.parent / "data"
SITE_URL = "sc-domain:smakfynd.se"
DAYS_DEFAULT = 28
DAYS_BACKFILL = 480  # ~16 months, GSC API maximum


def get_credentials():
    cred_path = os.environ.get("GSC_CREDENTIALS_JSON", DATA_DIR / "gsc_credentials.json")
    cred_path = Path(cred_path)
    if not cred_path.exists():
        raise FileNotFoundError(
            f"No credentials at {cred_path}. Set GSC_CREDENTIALS_JSON or place file at data/gsc_credentials.json"
        )
    return service_account.Credentials.from_service_account_file(
        str(cred_path), scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
    )


def fetch_dimension(service, start, end, dimensions, row_limit=100):
    """Fetch GSC data for given dimensions."""
    resp = service.searchanalytics().query(
        siteUrl=SITE_URL,
        body={
            "startDate": start,
            "endDate": end,
            "dimensions": dimensions,
            "rowLimit": row_limit,
        },
    ).execute()
    return resp.get("rows", [])


def format_ctr(ctr):
    return f"{ctr * 100:.2g}%"


def main():
    backfill = "--backfill" in sys.argv
    days = DAYS_BACKFILL if backfill else DAYS_DEFAULT

    creds = get_credentials()
    service = build("searchconsole", "v1", credentials=creds)

    # GSC data has ~3 day reporting lag
    end_date = date.today() - timedelta(days=3)
    start_date = end_date - timedelta(days=days - 1)
    start, end = start_date.isoformat(), end_date.isoformat()

    print(f"Fetching GSC data: {start} to {end} ({'backfill' if backfill else 'incremental'})")

    # Load existing data to merge daily history
    out = DATA_DIR / "gsc_history.json"
    existing = {}
    if out.exists():
        try:
            existing = json.load(open(out))
        except (json.JSONDecodeError, IOError):
            existing = {}

    existing_daily = {d["date"]: d for d in existing.get("daily", [])}

    # Daily performance
    daily_rows = fetch_dimension(service, start, end, ["date"], row_limit=days)
    for r in daily_rows:
        d = r["keys"][0]
        existing_daily[d] = {
            "date": d,
            "clicks": r["clicks"],
            "impressions": r["impressions"],
            "ctr": format_ctr(r["ctr"]),
            "position": round(r["position"], 1),
        }

    # Rebuild sorted daily list
    daily = sorted(existing_daily.values(), key=lambda x: x["date"])

    # Compute totals over the fetched period (not all time)
    fetched_daily = [d for d in daily if start <= d["date"] <= end]
    total_clicks = sum(d["clicks"] for d in fetched_daily)
    total_impressions = sum(d["impressions"] for d in fetched_daily)
    positions = [d["position"] for d in fetched_daily if d["position"]]
    avg_pos = round(sum(positions) / len(positions), 1) if positions else 0

    # Queries (latest window only — these are aggregates, not mergeable)
    query_rows = fetch_dimension(service, start, end, ["query"], row_limit=100)
    queries = []
    for r in sorted(query_rows, key=lambda x: -x["clicks"]):
        queries.append({
            "query": r["keys"][0],
            "clicks": r["clicks"],
            "impressions": r["impressions"],
            "ctr": format_ctr(r["ctr"]),
            "position": round(r["position"], 2),
        })

    # Pages
    page_rows = fetch_dimension(service, start, end, ["page"], row_limit=50)
    pages = []
    for r in sorted(page_rows, key=lambda x: -x["clicks"]):
        url = r["keys"][0]
        pages.append({
            "page": url,
            "clicks": r["clicks"],
            "impressions": r["impressions"],
            "ctr": format_ctr(r["ctr"]),
            "position": round(r["position"], 1),
        })

    # Devices
    device_rows = fetch_dimension(service, start, end, ["device"], row_limit=10)
    devices = {}
    for r in device_rows:
        name = r["keys"][0].capitalize()
        devices[name] = {
            "clicks": r["clicks"],
            "impressions": r["impressions"],
        }

    result = {
        "exported": date.today().isoformat(),
        "period": f"{start} \u2013 {end}",
        "totals": {
            "clicks": total_clicks,
            "impressions": total_impressions,
            "avg_position": avg_pos,
        },
        "daily": daily,
        "queries": queries,
        "pages": pages,
        "devices": devices,
    }

    with open(out, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"GSC: {total_clicks} clicks, {total_impressions} impressions, pos {avg_pos}")
    print(f"  {len(queries)} queries, {len(pages)} pages, {len(devices)} devices")
    print(f"  Daily history: {len(daily)} days ({daily[0]['date']} → {daily[-1]['date']})" if daily else "  No daily data")
    print(f"  Saved: {out}")


if __name__ == "__main__":
    main()
