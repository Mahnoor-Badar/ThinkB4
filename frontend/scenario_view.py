"""
frontend/scenario_view.py
Shows the scenario intro, the fake scam message, the decision buttons, and
the resulting consequence. No AI or backend logic lives here -- this file
only calls mock_backend (to be swapped for the real backend later).
"""

import streamlit as st
from mock_backend import get_scenario, submit_action

RISK_CLASS = {
    "safe": "risk-safe",
    "neutral": "risk-warning",
    "dangerous": "risk-danger",
}
RISK_LABEL = {
    "safe": "🛡️ Safe choice",
    "neutral": "⚠️ Missed opportunity",
    "dangerous": "🚨 Dangerous",
}


def render_scenario():
    scenario = get_scenario("gaming_reward")
    step = st.session_state.get("scenario_step", "intro")

    if step == "intro":
        _render_intro(scenario)
    elif step == "message":
        _render_message(scenario)
    elif step == "consequence":
        _render_consequence(scenario)


def _render_intro(scenario):
    st.markdown(f'<div class="hero-title" style="font-size:26px;">{scenario["title"]}</div>', unsafe_allow_html=True)

    with st.container(border=True):
        st.write(scenario["intro"])
        st.markdown("**What would you do?**")

    st.markdown('<div class="cta-pulse">', unsafe_allow_html=True)
    if st.button("Start scenario", use_container_width=True):
        st.session_state.scenario_step = "message"
        st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)


def _render_message(scenario):
    msg = scenario["message"]
    with st.container(border=True):
        st.markdown(
            f"**{msg['sender_name']}**  \n"
            f"<span style='color:var(--text-muted); font-size:13px;'>{msg['sender_handle']}</span>",
            unsafe_allow_html=True,
        )
        st.markdown(f"### {msg['subject']}")
        st.write(msg["body"])

    st.markdown("**Choose what to do:**")
    for action in scenario["actions"]:
        if st.button(action["label"], key=f"action_{action['id']}", use_container_width=True):
            result = submit_action(scenario["id"], action["id"])
            st.session_state.last_action_id = action["id"]
            st.session_state.last_result = result
            st.session_state.scenario_step = "consequence"
            st.rerun()


def _render_consequence(scenario):
    result = st.session_state.last_result
    with st.container(border=True):
        st.write(result["consequence_text"])
        risk_class = RISK_CLASS.get(result["classification"], "risk-warning")
        risk_label = RISK_LABEL.get(result["classification"], "⚠️ Suspicious")
        st.markdown(f'<span class="{risk_class}">{risk_label}</span>', unsafe_allow_html=True)

    if st.button("See your result", use_container_width=True):
        st.session_state.screen = "result"
        st.session_state.result_stage = "result"
        st.rerun()
