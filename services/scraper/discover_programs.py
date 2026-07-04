"""
Discover TUM study programs and write ID → title mapping to a text file.

Two modes:
  --portfolio  (default, fast) Use the TUMonline portfolio page to get known IDs,
               then fetch each title. ~350 programs, takes ~1-2 minutes.

  --range      Brute-force scan a range of IDs. Slower but finds everything.

Usage:
    python discover_programs.py
    python discover_programs.py --range --start 4990 --end 5500
    python discover_programs.py --output my_programs.txt
"""

import argparse
import html
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BASE_URL = "https://campus.tum.de/tumonline/wbstpcs.showSpoTree"
PORTFOLIO_URL = "https://campus.tum.de/tumonline/wbStpPortfolio.wbStpList"


def fetch_title(stp_id: int) -> str | None:
    url = f"{BASE_URL}?pStpStpNr={stp_id}"
    req = Request(url, headers={"Accept-Language": "de"})
    try:
        with urlopen(req, timeout=15) as resp:
            chunk = resp.read(20000).decode("utf-8", errors="replace")
            match = re.search(r'<span class="s">([^<]+)</span>', chunk)
            if match:
                title = html.unescape(match.group(1)).strip()
                return title if title else None
            return None
    except (HTTPError, URLError):
        return None


def get_portfolio_ids() -> list[int]:
    """Get all program IDs from the TUMonline portfolio listing page."""
    req = Request(PORTFOLIO_URL, headers={"Accept-Language": "de"})
    try:
        with urlopen(req, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        ids = sorted(set(int(m) for m in re.findall(r"pStpStpNr=(\d+)", html)))
        return ids
    except (HTTPError, URLError) as e:
        print(f"Failed to fetch portfolio: {e}", file=sys.stderr)
        return []


def main():
    parser = argparse.ArgumentParser(description="Discover TUM study programs")
    parser.add_argument("--range", action="store_true", help="Brute-force scan a range instead of using portfolio")
    parser.add_argument("--start", type=int, default=400, help="Start of ID range (with --range)")
    parser.add_argument("--end", type=int, default=5500, help="End of ID range (with --range)")
    parser.add_argument("--output", default="tum_programs.txt", help="Output file")
    parser.add_argument("--delay", type=float, default=0.15, help="Delay between requests (seconds)")
    args = parser.parse_args()

    if args.range:
        ids = list(range(args.start, args.end + 1))
        print(f"Brute-force scanning IDs {args.start} to {args.end} ({len(ids)} IDs)...", file=sys.stderr)
    else:
        print("Fetching program IDs from TUMonline portfolio page...", file=sys.stderr)
        ids = get_portfolio_ids()
        if not ids:
            print("No IDs found. Try --range mode.", file=sys.stderr)
            sys.exit(1)
        print(f"Found {len(ids)} program IDs in portfolio. Fetching titles...", file=sys.stderr)

    found = []
    for i, stp_id in enumerate(ids):
        if i > 0 and i % 50 == 0:
            print(f"  Progress: {i}/{len(ids)} scanned, {len(found)} programs found...", file=sys.stderr)

        title = fetch_title(stp_id)
        if title:
            found.append((stp_id, title))

        time.sleep(args.delay)

    # Write results sorted alphabetically by title
    with open(args.output, "w") as f:
        f.write("TUM Study Programs\n")
        f.write(f"Source: {'range ' + str(args.start) + '-' + str(args.end) if args.range else 'portfolio page'}\n")
        f.write(f"Found: {len(found)} programs\n")
        f.write("Date: scan output — use Ctrl+F to find programs of interest\n")
        f.write("=" * 120 + "\n\n")
        f.write(f"{'ID':>6}  Title\n")
        f.write("-" * 120 + "\n")
        for stp_id, title in sorted(found, key=lambda x: x[1].lower()):
            f.write(f"{stp_id:>6}  {title}\n")

        f.write("\n\n")
        f.write("=" * 120 + "\n")
        f.write("Same data sorted by ID:\n")
        f.write("-" * 120 + "\n")
        for stp_id, title in sorted(found, key=lambda x: x[0]):
            f.write(f"{stp_id:>6}  {title}\n")

    print(f"\nDone! {len(found)} programs written to {args.output}", file=sys.stderr)
    print(f"Open {args.output} and Ctrl+F for 'Informatik', 'Games', 'Biotechnol', etc.", file=sys.stderr)


if __name__ == "__main__":
    main()
