import json
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

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

project_root = Path(__file__).parent
static_html = project_root / "streamlit_static" / "index.html"
dist_html = project_root / "dist" / "index.html"
latest_json = project_root / "public" / "latest-trading-data.json"
update_script = project_root / "scripts" / "update_latest_data.py"
stale_after = timedelta(hours=6)
enable_startup_refresh = os.getenv("ENABLE_STARTUP_REFRESH", "false").lower() in {"1", "true", "yes"}
startup_refresh_timeout_sec = int(os.getenv("STARTUP_REFRESH_TIMEOUT_SEC", "20"))


def is_stale(path: Path, threshold: timedelta) -> bool:
    if not path.exists():
        return True
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        updated_at = payload.get("meta", {}).get("updatedAtKst") if isinstance(payload, dict) else None
        if isinstance(updated_at, str) and updated_at:
            updated_dt = datetime.strptime(updated_at, "%Y-%m-%d %H:%M:%S")
            return datetime.now() - updated_dt > threshold
    except Exception:
        pass

    modified = datetime.fromtimestamp(path.stat().st_mtime)
    return datetime.now() - modified > threshold


def refresh_data_if_needed() -> None:
    if not enable_startup_refresh:
        return
    if not is_stale(latest_json, stale_after):
        return
    if not update_script.exists():
        return
    try:
        child_env = os.environ.copy()
        child_env["UPDATE_LATEST_MODE"] = "startup"
        subprocess.run(
            [sys.executable, str(update_script)],
            cwd=str(project_root),
            env=child_env,
            check=True,
            capture_output=True,
            text=True,
            timeout=startup_refresh_timeout_sec,
        )
    except Exception as exc:
        st.warning(f"Auto data refresh skipped on startup: {exc}")


refresh_data_if_needed()

if not static_html.exists() and dist_html.exists():
    static_html.parent.mkdir(parents=True, exist_ok=True)
    static_html.write_text(dist_html.read_text(encoding="utf-8"), encoding="utf-8")

if static_html.exists():
    html_file = static_html
elif dist_html.exists():
    html_file = dist_html
else:
    st.error("Missing frontend bundle. Commit streamlit_static/index.html or dist/index.html")
    st.stop()

html = html_file.read_text(encoding="utf-8")

if latest_json.exists():
    payload = json.loads(latest_json.read_text(encoding="utf-8"))
    injection_script = f"<script>window.BACKEND_DATA = {json.dumps(payload, ensure_ascii=False)};</script>"
    html = html.replace("<head>", f"<head>{injection_script}", 1)

components.html(html, height=2200, scrolling=True)
