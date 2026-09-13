"""
ThinkB4 game theme for Streamlit.

Usage:
    import streamlit as st
    from theme import apply_theme

    st.set_page_config(page_title="ThinkB4", layout="centered")
    apply_theme()

Then use the helper classes below anywhere with st.markdown(..., unsafe_allow_html=True):
    - "hero-title"      big glowing page title
    - "tagline"         subtitle under the hero title
    - "game-card"       rounded card with border glow, fades in on load
    - "stat-pill"       small rounded stat chip (score, level, etc.)
    - "risk-safe"       green pill for safe choices
    - "risk-warning"    amber pill for suspicious choices
    - "risk-danger"     red pill for dangerous choices
    - "cta-button"      wraps a st.button to add the pulsing glow (see demo_app.py)
"""

import streamlit as st

THEME_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=Inter:wght@400;500;600&display=swap');

:root {
    --bg-deep: #0F1330;
    --bg-panel: #1B2049;
    --bg-panel-light: #262C5C;
    --accent-primary: #7C6CF0;
    --accent-primary-dark: #5A4BD1;
    --accent-safe: #2DD4A7;
    --accent-warning: #FFB33D;
    --accent-danger: #FF6B5B;
    --text-light: #F4F3FB;
    --text-muted: #A9ACD6;
}

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
    color: var(--text-light);
}

.stApp {
    background: var(--bg-deep);
}

h1, h2, h3, .hero-title {
    font-family: 'Baloo 2', sans-serif;
    font-weight: 700;
}

/* ---------- Hero title ---------- */
.hero-title {
    font-size: 40px;
    text-align: center;
    color: var(--text-light);
    text-shadow: 0 0 18px rgba(124, 108, 240, 0.55);
    margin-bottom: 4px;
}

.tagline {
    font-family: 'Inter', sans-serif;
    text-align: center;
    color: var(--text-muted);
    font-size: 16px;
    margin-bottom: 28px;
}

/* ---------- Cards ---------- */
.game-card {
    background: var(--bg-panel);
    border: 1px solid var(--bg-panel-light);
    border-radius: 16px;
    padding: 22px 24px;
    margin-bottom: 18px;
    box-shadow: 0 0 0 rgba(124, 108, 240, 0);
    animation: fadeInUp 0.5s ease-out;
}

.game-card.glow {
    border-color: var(--accent-primary);
    box-shadow: 0 0 24px rgba(124, 108, 240, 0.25);
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* Streamlit's real bordered container (st.container(border=True)) --
   use this instead of manual <div> open/close, which never actually
   wraps content added in separate Streamlit calls. */
div[data-testid="stVerticalBlockBorderWrapper"] {
    background: var(--bg-panel) !important;
    border: 1px solid var(--bg-panel-light) !important;
    border-radius: 16px !important;
    padding: 4px 10px !important;
    animation: fadeInUp 0.5s ease-out;
}

/* ---------- Stat pills ---------- */
.stat-pill {
    display: inline-block;
    background: var(--bg-panel-light);
    color: var(--text-light);
    border-radius: 999px;
    padding: 6px 16px;
    font-size: 14px;
    font-weight: 500;
    margin-right: 8px;
}

/* ---------- Risk labels (color + text, never color alone) ---------- */
.risk-safe, .risk-warning, .risk-danger {
    display: inline-block;
    border-radius: 999px;
    padding: 6px 16px;
    font-size: 14px;
    font-weight: 600;
}
.risk-safe    { background: rgba(45, 212, 167, 0.15); color: var(--accent-safe); }
.risk-warning { background: rgba(255, 179, 61, 0.15); color: var(--accent-warning); }
.risk-danger  { background: rgba(255, 107, 91, 0.15); color: var(--accent-danger); }

/* ---------- Buttons ---------- */
.stButton > button {
    font-family: 'Baloo 2', sans-serif;
    font-weight: 700;
    font-size: 16px;
    color: var(--text-light);
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark));
    border: none;
    border-radius: 12px;
    padding: 10px 26px;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.stButton > button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(124, 108, 240, 0.35);
}

/* Primary call-to-action gets the pulse; add class via markdown wrapper (see demo_app.py) */
div[data-testid="stVerticalBlock"] .cta-pulse .stButton > button {
    animation: pulse 2.2s infinite;
}
@keyframes pulse {
    0%   { box-shadow: 0 0 0 0 rgba(124, 108, 240, 0.5); }
    70%  { box-shadow: 0 0 0 14px rgba(124, 108, 240, 0); }
    100% { box-shadow: 0 0 0 0 rgba(124, 108, 240, 0); }
}

/* ---------- Progress bar (XP / score) ---------- */
.stProgress > div > div > div {
    background: linear-gradient(90deg, var(--accent-safe), var(--accent-primary));
    border-radius: 999px;
}
.stProgress > div > div {
    background: var(--bg-panel-light);
    border-radius: 999px;
}

/* ---------- Level-up banner ---------- */
.level-up-banner {
    background: linear-gradient(135deg, var(--accent-warning), var(--accent-primary));
    color: #1B2049;
    font-family: 'Baloo 2', sans-serif;
    font-weight: 700;
    text-align: center;
    padding: 14px;
    border-radius: 14px;
    margin-bottom: 18px;
    animation: bannerIn 0.6s ease-out;
}
@keyframes bannerIn {
    from { opacity: 0; transform: scale(0.9); }
    to   { opacity: 1; transform: scale(1); }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
    .game-card, .level-up-banner, .stButton > button, .cta-pulse .stButton > button {
        animation: none !important;
        transition: none !important;
    }
}
</style>
"""


def apply_theme():
    """Inject the ThinkB4 game theme into the current Streamlit page."""
    st.markdown(THEME_CSS, unsafe_allow_html=True)
