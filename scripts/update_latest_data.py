#!/usr/bin/env python3
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

import requests
from bs4 import BeautifulSoup

DETAIL_TREND_URL = "https://finance.naver.com/sise/investorDealTrendDay.nhn"
KOSPI_INDEX_URL = "https://finance.naver.com/sise/sise_index_day.nhn"
HISTORICAL_START_DATE = "1997-01-01"
BOOTSTRAP_MAX_PAGES = 1200
RECENT_REFRESH_PAGES = 20

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://finance.naver.com/sise/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# 네트워크 설정
REQUEST_TIMEOUT = 30  # 타임아웃을 30초로 증가
MAX_RETRIES = 3  # 재시도 횟수


def parse_number(value: Optional[str]) -> int:
    if value is None:
        return 0
    normalized = str(value).replace(",", "").replace("+", "").strip()
    if normalized == "":
        return 0
    try:
        return int(float(normalized))
    except ValueError:
        return 0


def parse_float(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    normalized = str(value).replace(",", "").replace("+", "").strip()
    if normalized == "":
        return None
    try:
        return float(normalized)
    except ValueError:
        return None


def format_kst_now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def normalize_detail_date(text: str) -> Optional[str]:
    # finance.naver.com date format can be either "26.02.27" or "2026.02.27"
    stripped = text.strip()
    m4 = re.match(r"^(\d{4})\.(\d{2})\.(\d{2})$", stripped)
    if m4:
        yyyy, mm, dd = m4.groups()
        return f"{yyyy}-{mm}-{dd}"

    m2 = re.match(r"^(\d{2})\.(\d{2})\.(\d{2})$", stripped)
    if not m2:
        return None
    yy, mm, dd = m2.groups()
    yy_num = int(yy)
    year = 1900 + yy_num if yy_num >= 90 else 2000 + yy_num
    return f"{year:04d}-{mm}-{dd}"


def parse_detail_rows(html: str) -> List[Dict[str, int]]:
    soup = BeautifulSoup(html, "html.parser")
    parsed: List[Dict[str, int]] = []

    for tr in soup.select("table.type_1 tr"):
        cols = [td.get_text(strip=True) for td in tr.select("td")]
        if len(cols) < 11 or "." not in cols[0]:
            continue

        date = normalize_detail_date(cols[0])
        if not date:
            continue

        parsed.append(
            {
                "date": date,
                "individual": parse_number(cols[1]),
                "foreign": parse_number(cols[2]),
                "institution": parse_number(cols[3]),
                "financialInvestment": parse_number(cols[4]),
                "insurance": parse_number(cols[5]),
                "investmentTrust": parse_number(cols[6]),
                "bank": parse_number(cols[7]),
                "otherFinancial": parse_number(cols[8]),
                "pension": parse_number(cols[9]),
                "otherCorporation": parse_number(cols[10]),
            }
        )

    return parsed


def fetch_detail_trend_map(max_pages: int, min_date: str) -> Dict[str, Dict[str, int]]:
    detail_map: Dict[str, Dict[str, int]] = {}

    for page in range(1, max_pages + 1):
        params = {"bizdate": "215600", "sosok": "", "page": page}
        
        # 재시도 로직
        for attempt in range(MAX_RETRIES):
            try:
                response = requests.get(DETAIL_TREND_URL, headers=HEADERS, params=params, timeout=REQUEST_TIMEOUT)
                response.raise_for_status()
                break
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                if attempt < MAX_RETRIES - 1:
                    print(f"  ⚠️ 재시도 {attempt + 1}/{MAX_RETRIES} (페이지 {page})")
                    continue
                else:
                    print(f"  ❌ 최대 재시도 횟수 초과 (페이지 {page}): {e}")
                    return detail_map

        rows = parse_detail_rows(response.text)
        if not rows:
            break

        for row in rows:
            date = row["date"]
            if date < min_date:
                continue
            detail_map[date] = row

        oldest_on_page = rows[-1]["date"]
        if oldest_on_page < min_date:
            break

    return detail_map


def parse_kospi_rows(html: str) -> List[Tuple[str, float]]:
    soup = BeautifulSoup(html, "html.parser")
    parsed: List[Tuple[str, float]] = []

    for tr in soup.select("table.type_1 tr"):
        cols = [td.get_text(strip=True) for td in tr.select("td")]
        if len(cols) < 2 or "." not in cols[0]:
            continue

        date = normalize_detail_date(cols[0])
        close = parse_float(cols[1])
        if not date or close is None:
            continue
        parsed.append((date, round(close, 2)))

    return parsed


def fetch_kospi_close_map(max_pages: int, min_date: str) -> Dict[str, float]:
    close_map: Dict[str, float] = {}

    for page in range(1, max_pages + 1):
        params = {"code": "KOSPI", "page": page}
        
        # 재시도 로직
        for attempt in range(MAX_RETRIES):
            try:
                response = requests.get(KOSPI_INDEX_URL, headers=HEADERS, params=params, timeout=REQUEST_TIMEOUT)
                response.raise_for_status()
                break
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                if attempt < MAX_RETRIES - 1:
                    print(f"  ⚠️ 재시도 {attempt + 1}/{MAX_RETRIES} (KOSPI 페이지 {page})")
                    continue
                else:
                    print(f"  ❌ KOSPI 최대 재시도 횟수 초과 (페이지 {page}): {e}")
                    return close_map

        rows = parse_kospi_rows(response.text)
        if not rows:
            break

        for date, close in rows:
            if date < min_date:
                continue
            close_map[date] = close

        oldest_on_page = rows[-1][0]
        if oldest_on_page < min_date:
            break

    return close_map


def load_existing_data(path: Path) -> Tuple[Dict[str, Dict[str, Any]], Optional[str], bool, Optional[str]]:
    if not path.exists():
        return {}, None, True, None

    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("data", [])
    if not isinstance(rows, list):
        return {}, None, True, None

    row_map: Dict[str, Dict[str, Any]] = {}
    missing_kospi = False
    earliest_kospi_existing: Optional[str] = None
    for row in rows:
        date = row.get("date")
        if not isinstance(date, str):
            continue
        kospi_close_raw = row.get("kospiClose")
        kospi_close = parse_float(str(kospi_close_raw)) if kospi_close_raw is not None else None
        if kospi_close is None:
            missing_kospi = True
        else:
            if earliest_kospi_existing is None or date < earliest_kospi_existing:
                earliest_kospi_existing = date
        row_map[date] = {
            "date": date,
            "individual": int(row.get("individual", 0)),
            "foreign": int(row.get("foreign", 0)),
            "institution": int(row.get("institution", 0)),
            "financialInvestment": int(row.get("financialInvestment", 0)),
            "insurance": int(row.get("insurance", 0)),
            "investmentTrust": int(row.get("investmentTrust", 0)),
            "bank": int(row.get("bank", 0)),
            "otherFinancial": int(row.get("otherFinancial", 0)),
            "pension": int(row.get("pension", 0)),
            "otherCorporation": int(row.get("otherCorporation", 0)),
            "kospiClose": round(kospi_close, 2) if kospi_close is not None else None,
        }

    if not row_map:
        return {}, None, True, None

    earliest = min(row_map.keys())
    return row_map, earliest, missing_kospi, earliest_kospi_existing


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    out_path = project_root / "public" / "latest-trading-data.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    existing_map, earliest_existing, missing_kospi, earliest_kospi_existing = load_existing_data(out_path)

    needs_backfill = not bool(existing_map)
    if earliest_existing and needs_backfill:
        earliest_dt = datetime.strptime(earliest_existing, "%Y-%m-%d").date()
        target_dt = datetime.strptime(HISTORICAL_START_DATE, "%Y-%m-%d").date()
        # If earliest row is within one week from the target start, treat it as covered.
        needs_backfill = (earliest_dt - target_dt).days > 7
    max_pages = BOOTSTRAP_MAX_PAGES if needs_backfill else RECENT_REFRESH_PAGES
    # Do not force a full KOSPI backfill just because the first legacy rows predate
    # Naver's available index close history. That made every scheduled refresh crawl
    # hundreds of old pages and prevented recent chart data from being updated.
    needs_kospi_backfill = (
        needs_backfill
        or earliest_kospi_existing is None
    )
    max_pages_kospi = BOOTSTRAP_MAX_PAGES if needs_kospi_backfill else RECENT_REFRESH_PAGES

    fetched_map = fetch_detail_trend_map(max_pages=max_pages, min_date=HISTORICAL_START_DATE)
    kospi_map = fetch_kospi_close_map(max_pages=max_pages_kospi, min_date=HISTORICAL_START_DATE)
    all_dates = sorted(set(existing_map.keys()) | set(fetched_map.keys()) | set(kospi_map.keys()))
    merged_map = {}
    for date in all_dates:
        if date < HISTORICAL_START_DATE:
            continue
        
        row = existing_map.get(date, {}).copy()
        row.update(fetched_map.get(date, {}))
        
        # Ensure all fields exist
        row.setdefault("date", date)
        for field in ["individual", "foreign", "institution", "financialInvestment", 
                      "insurance", "investmentTrust", "bank", "otherFinancial", 
                      "pension", "otherCorporation"]:
            row.setdefault(field, 0)
        
        row["kospiClose"] = kospi_map.get(date, row.get("kospiClose"))
        merged_map[date] = row

    if not merged_map:
        raise RuntimeError("No investor detail data returned")

    rows = [merged_map[date] for date in sorted(merged_map.keys())]
    earliest_kospi_date = min(kospi_map.keys()) if kospi_map else None
    for row in rows:
        date = row["date"]
        existing_close = row.get("kospiClose")
        if earliest_kospi_date and date < earliest_kospi_date and date not in kospi_map:
            row["kospiClose"] = None
        else:
            row["kospiClose"] = kospi_map.get(date, existing_close)

    # Fill occasional missing values by nearest known close to keep the line continuous.
    last_known: Optional[float] = None
    for row in rows:
        close = row.get("kospiClose")
        if isinstance(close, (int, float)):
            last_known = float(close)
        elif last_known is not None:
            row["kospiClose"] = round(last_known, 2)

    earliest_date = rows[0]["date"]
    latest_date = rows[-1]["date"]

    payload = {
        "meta": {
            "source": "Naver Finance investor detail + KOSPI close (historical + 24-hour refresh)",
            "updatedAtKst": format_kst_now(),
            "earliestTradingDate": earliest_date,
            "latestTradingDate": latest_date,
            "refreshIntervalHours": 24,
            "historicalStartDate": HISTORICAL_START_DATE,
        },
        "data": rows,
    }

    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Updated {out_path}")
    print(
        f"Rows: {len(rows)}, range: {earliest_date} ~ {latest_date}, "
        f"mode: {'bootstrap' if needs_backfill else 'incremental'}"
    )


if __name__ == "__main__":
    main()
