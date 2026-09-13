"""
frontend/result_view.py
Shows the result/score screen, the detailed feedback, and the what-if
alternative path. No AI or backend logic lives here -- this file only calls
mock_backend (to be swapped for the real backend, including Eman's AI
explanations via ai_service.py, later).
"""

import streamlit as st
from mock_backend import get_result_summary, get_feedback, get_whatif


def render_result():
    stage = st.session_state.get("result_stage", "result")
    scenario_id = "gaming_reward"
    action_id = st.session_state.get("last_action_id")

    if stage == "result":
        _render_result_screen(scenario_id, action_id)
    elif stage == "feedback":
        _render_feedback_screen(scenario_id, action_id)
    elif stage == "whatif":
        _render_whatif_screen(scenario_id, action_id)


def _render_result_screen(scenario_id, action_id):
    summary = get_result_summary(scenario_id, action_id)

    st.markdown('<div class="hero-title" style="font-size:28px;">Simulation complete</div>', unsafe_allow_html=True)

    with st.container(border=True):
        st.markdown(f'<span class="stat-pill">Score: {summary["score"]}/100</span>', unsafe_allow_html=True)
        st.write("")
        if summary["outcome_positive"]:
            st.markdown('<span class="risk-safe">🛡️ You successfully avoided the scam!</span>', unsafe_allow_html=True)
        else:
            st.markdown('<span class="risk-danger">⚠️ You missed some warning signs.</span>', unsafe_allow_html=True)

    col1, col2 = st.columns(2)
    with col1:
        if st.button("Play again", use_container_width=True):
            st.session_state.screen = "scenario"
            st.session_state.scenario_step = "intro"
            st.rerun()
        if st.button("See what happened", use_container_width=True):
            st.session_state.result_stage = "feedback"
            st.rerun()
    with col2:
        if st.button("Back to dashboard", use_container_width=True):
            st.session_state.screen = "dashboard"
            st.rerun()


def _render_feedback_screen(scenario_id, action_id):
    feedback = get_feedback(scenario_id, action_id)

    st.markdown('<div class="hero-title" style="font-size:26px;">What happened</div>', unsafe_allow_html=True)

    with st.container(border=True):
        st.markdown("**Why?**")
        st.write(feedback["why"])
        st.markdown("**Warning signs:**")
        for sign in feedback["warning_signs"]:
            st.markdown(f"🔴 {sign}")

    with st.container(border=True):
        st.markdown("💡 **ThinkB4 tip**")
        st.write("Stop → check → verify → then act.")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("What if I'd chosen differently?", use_container_width=True):
            st.session_state.result_stage = "whatif"
            st.rerun()
    with col2:
        if st.button("Back to dashboard", use_container_width=True):
            st.session_state.screen = "dashboard"
            st.rerun()


def _render_whatif_screen(scenario_id, action_id):
    whatif = get_whatif(scenario_id, action_id)

    st.markdown('<div class="hero-title" style="font-size:26px;">What if?</div>', unsafe_allow_html=True)

    with st.container(border=True):
        if whatif:
            st.markdown(f"**What if you had chosen: {whatif['safer_action_label']}?**")
            st.write(whatif["outcome"])
            st.markdown('<span class="risk-safe">🛡️ Scam avoided!</span>', unsafe_allow_html=True)
        else:
            st.write("You already made the safest choice available in this scenario!")

    if st.button("Back to dashboard", use_container_width=True):
        st.session_state.screen = "dashboard"
        st.rerun()
