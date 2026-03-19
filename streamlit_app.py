import json
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
