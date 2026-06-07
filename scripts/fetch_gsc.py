#!/usr/bin/env python3
"""
Fetch Google Search Console data for smakfynd.se via API.
Outputs data/gsc_history.json in the same format as the manual export.

Requires:
  pip install google-auth google-api-python-client

Credentials: set GSC_CREDENTIALS_JSON env var to the path of a service account
JSON file, or place it at data/gsc_credentials.json (gitignored).

The service account must be added as a user in Google Search Console for
sc-domain:smakfynd.se (Settings > Users and permissions > Add user, Full access).
"""

import json, os
from datetime import date, timedelta
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

DATA_DIR = Path(__file__).parent.parent / "data"
SITE_URL = "sc-domain:smakfynd.se"
DAYS = 28  # GSC has ~3 day lag, we fetch the latest 28 complete days


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
    creds = get_credentials()
    service = build("searchconsole", "v1", credentials=creds)

    # GSC data has ~3 day reporting lag
    end_date = date.today() - timedelta(days=3)
    start_date = end_date - timedelta(days=DAYS - 1)
    start, end = start_date.isoformat(), end_date.isoformat()

    print(f"Fetching GSC data: {start} to {end}")

    # Daily performance
    daily_rows = fetch_dimension(service, start, end, ["date"], row_limit=DAYS)
    daily = []
    total_clicks = 0
    total_impressions = 0
    positions = []
    for r in sorted(daily_rows, key=lambda x: x["keys"][0]):
        clicks = r["clicks"]
        impr = r["impressions"]
        total_clicks += clicks
        total_impressions += impr
        positions.append(r["position"])
        daily.append({
            "date": r["keys"][0],
            "clicks": clicks,
            "impressions": impr,
            "ctr": format_ctr(r["ctr"]),
            "position": round(r["position"], 1),
        })

    # Queries
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
        # Strip domain, keep path
        url = r["keys"][0]
        path = url.replace("https://smakfynd.se", "").replace("http://smakfynd.se", "")
        if not path:
            path = "/"
        pages.append({
            "page": path,
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

    avg_pos = round(sum(positions) / len(positions), 1) if positions else 0

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

    out = DATA_DIR / "gsc_history.json"
    with open(out, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"GSC: {total_clicks} clicks, {total_impressions} impressions, pos {avg_pos}")
    print(f"  {len(queries)} queries, {len(pages)} pages, {len(devices)} devices")
    print(f"  Saved: {out}")


if __name__ == "__main__":
    main()
