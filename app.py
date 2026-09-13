"""
Main entry point. Run with: streamlit run app.py

This file only handles navigation (which screen to show). All actual screen
content lives in frontend/home.py, frontend/scenario_view.py, and
frontend/result_view.py, matching the team's frontend/backend/ai structure.
"""

import streamlit as st
from theme import apply_theme
from frontend.home import render_welcome, render_login, render_dashboard
from frontend.scenario_view import render_scenario
from frontend.result_view import render_result

st.set_page_config(page_title="ThinkB4", layout="centered")
apply_theme()

if "screen" not in st.session_state:
    st.session_state.screen = "welcome"

screen = st.session_state.screen

if screen == "welcome":
    render_welcome()
elif screen == "login":
    render_login()
elif screen == "dashboard":
    render_dashboard()
elif screen == "scenario":
    render_scenario()
elif screen == "result":
    render_result()
