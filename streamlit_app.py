import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import streamlit as st
import streamlit.components.v1 as components

# ---------------------------------------------------------------------------
# 페이지 설정
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Risk_KOSPI", layout="wide")


st.markdown(
    """
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header[data-testid="stHeader"] {visibility: hidden; display: none;}
    .block-container {padding: 0;}
    .stApp {background-color: #030712;}
    iframe {border: none;}
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# 자동 리프레시 (5분 = 300,000ms)
# Streamlit 페이지를 주기적으로 rerun하여 서버 측에서 데이터 갱신
# ---------------------------------------------------------------------------
try:
    from streamlit_autorefresh import st_autorefresh
    st_autorefresh(interval=5 * 60 * 1000, limit=0, key="data_autorefresh")
except ImportError:
    # streamlit-autorefresh 미설치 시 meta refresh 태그 사용
    st.markdown(
        '<meta http-equiv="refresh" content="300">',
        unsafe_allow_html=True,
    )

# ---------------------------------------------------------------------------
# 경로 설정
# ---------------------------------------------------------------------------
project_root = Path(__file__).parent
static_html = project_root / "streamlit_static" / "index.html"
dist_html = project_root / "dist" / "index.html"
latest_json = project_root / "public" / "latest-trading-data.json"

KST = timezone(timedelta(hours=9))


# ---------------------------------------------------------------------------
# 유틸리티
# ---------------------------------------------------------------------------
def parse_ymd(value: Optional[str]):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def now_kst():
    """한국 시간 현재"""
    return datetime.now(KST)


def is_data_stale(payload: dict) -> bool:
    """데이터가 오래되었는지 판단"""
    meta = payload.get("meta", {}) if isinstance(payload, dict) else {}
    latest = parse_ymd(meta.get("latestTradingDate"))
    if latest is None:
        return True

    today_kst = now_kst().date()
    # 주말은 거래일이 아니므로 금요일 데이터가 최신이면 OK
    if today_kst.weekday() >= 5:
        # 주말: 금요일(weekday=4) 이후 데이터면 OK
        days_since_friday = today_kst.weekday() - 4
        friday = today_kst - timedelta(days=days_since_friday)
        return latest < friday

    # 평일: 장 마감 전(15:30 이전)에는 어제 데이터도 OK
    now = now_kst()
    if now.hour < 16:
        yesterday = today_kst - timedelta(days=1)
        # 월요일 아침이면 금요일 데이터 OK
        if today_kst.weekday() == 0:
            return latest < (today_kst - timedelta(days=3))
        return latest < yesterday
    return latest < today_kst


# ---------------------------------------------------------------------------
# 데이터 갱신 (캐시 사용으로 과도한 스크래핑 방지)
# ---------------------------------------------------------------------------
@st.cache_data(ttl=300, show_spinner=False)
def load_and_refresh_data() -> dict:
    """
    데이터를 로드하고 필요하면 Naver에서 갱신.
    5분 TTL 캐시로 중복 스크래핑 방지.
    """
    payload = {}
    if latest_json.exists():
        try:
            payload = json.loads(latest_json.read_text(encoding="utf-8"))
        except Exception:
            payload = {}

    if is_data_stale(payload):
        script_path = project_root / "scripts" / "update_latest_data.py"
        if script_path.exists():
            env = os.environ.copy()
            env["UPDATE_LATEST_MODE"] = "startup"
            try:
                result = subprocess.run(
                    [sys.executable, str(script_path)],
                    check=False,
                    cwd=str(project_root),
                    env=env,
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                if result.returncode != 0:
                    print(f"[WARN] update_latest_data.py failed: {result.stderr[:500]}")
                else:
                    print(f"[INFO] Data updated: {result.stdout[:200]}")
            except subprocess.TimeoutExpired:
                print("[WARN] update_latest_data.py timed out (120s)")
            except Exception as e:
                print(f"[WARN] update_latest_data.py error: {e}")

            # 갱신 후 다시 로드
            if latest_json.exists():
                try:
                    payload = json.loads(latest_json.read_text(encoding="utf-8"))
                except Exception:
                    pass

    return payload


# ---------------------------------------------------------------------------
# 메인 렌더링
# ---------------------------------------------------------------------------
# 데이터 로드 (캐시됨, 5분마다 갱신)
data_payload = load_and_refresh_data()

# HTML 프론트엔드 로드
if static_html.exists():
    html_file = static_html
elif dist_html.exists():
    html_file = dist_html
else:
    st.error("Missing frontend bundle. Commit streamlit_static/index.html or dist/index.html")
    st.stop()

try:
    html = html_file.read_text(encoding="utf-8")
except Exception as exc:
    st.error(f"Failed to read frontend bundle: {exc}")
    st.stop()

# 백엔드 데이터 주입
inject_backend_data = os.getenv("INJECT_BACKEND_DATA", "true").lower() in {"1", "true", "yes"}
if inject_backend_data and data_payload and data_payload.get("data"):
    try:
        injection_script = f"<script>window.BACKEND_DATA = {json.dumps(data_payload, ensure_ascii=False)};</script>"
        html = html.replace("<head>", f"<head>{injection_script}", 1)
    except Exception as exc:
        st.warning(f"Backend data injection skipped: {exc}")

components.html(html, height=2200, scrolling=True)
