"""
frontend/home.py
Welcome, login, and dashboard screens. No AI or backend logic lives here --
this file only calls mock_backend (to be swapped for the real backend later).
"""

import streamlit as st
from mock_backend import verify_class_code, get_student_dashboard


def render_welcome():
    st.markdown('<div class="hero-title">ThinkB4</div>', unsafe_allow_html=True)
    st.markdown('<div class="tagline">Think. Check. Then Click.</div>', unsafe_allow_html=True)

    with st.container(border=True):
        st.write("Can you spot a scam before it gets you?")

    st.markdown('<div class="cta-pulse">', unsafe_allow_html=True)
    if st.button("Start learning", use_container_width=True):
        st.session_state.screen = "login"
        st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)


def render_login():
    st.markdown('<div class="hero-title" style="font-size:28px;">Join your class</div>', unsafe_allow_html=True)

    with st.container(border=True):
        class_code = st.text_input("Class code", placeholder="e.g. MATH7A")

        students = verify_class_code(class_code) if class_code else None

        if class_code and not students:
            st.error("We couldn't find that class code. Check with your teacher.")

        if students:
            name = st.selectbox("Pick your name", students)
            if st.button("Continue", use_container_width=True):
                st.session_state.student_name = name
                st.session_state.screen = "dashboard"
                st.rerun()


def render_dashboard():
    name = st.session_state.get("student_name", "Student")
    data = get_student_dashboard(name)

    st.markdown(f'<div class="hero-title" style="font-size:28px;">Hi, {data["name"]} 👋</div>', unsafe_allow_html=True)
    st.markdown('<div class="tagline">Ready to test your scam-spotting skills?</div>', unsafe_allow_html=True)

    with st.container(border=True):
        st.markdown(
            f'<span class="stat-pill">Safety score: {data["score"]}/100</span>'
            f'<span class="stat-pill">Level: {data["level"]}</span>'
            f'<span class="stat-pill">Completed: {data["simulations_completed"]}</span>',
            unsafe_allow_html=True,
        )
        st.progress(data["progress"] / 100)

    st.markdown('<div class="cta-pulse">', unsafe_allow_html=True)
    if st.button("Start simulation", use_container_width=True):
        st.session_state.screen = "scenario"
        st.session_state.scenario_step = "intro"
        st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)
