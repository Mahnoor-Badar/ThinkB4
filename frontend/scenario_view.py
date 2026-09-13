
"""
frontend/scenario_view.py

Shows the AI-generated scenario, the suspicious message, the decision buttons,
and the resulting consequence.

AI is responsible for generating scenario content.
Action evaluation is deterministic so the LLM does not control scoring.
"""

import streamlit as st
from ai.ai_services import generate_scenario


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
    ai_scenario = generate_scenario("gaming scam")

    scenario = {
        "id": "ai_generated",
        "title": ai_scenario["title"],
        "intro": ai_scenario["intro"],
        "message": {
            "sender_name": ai_scenario["sender_name"],
            "sender_handle": ai_scenario["sender_handle"],
            "subject": ai_scenario["subject"],
            "body": ai_scenario["body"],
        },
        "actions": ai_scenario["actions"],
        "risk_indicators": ai_scenario["risk_indicators"],
    }

    step = st.session_state.get("scenario_step", "intro")

    if step == "intro":
        _render_intro(scenario)

    elif step == "message":
        _render_message(scenario)

    elif step == "consequence":
        _render_consequence(scenario)


def _render_intro(scenario):
    st.markdown(
        f'<div class="hero-title" style="font-size:26px;">'
        f'{scenario["title"]}</div>',
        unsafe_allow_html=True,
    )

    with st.container(border=True):
        st.write(scenario["intro"])
        st.markdown("**What would you do?**")

    st.markdown(
        '<div class="cta-pulse">',
        unsafe_allow_html=True,
    )

    if st.button("Start scenario", use_container_width=True):
        st.session_state.scenario_step = "message"
        st.rerun()

    st.markdown(
        "</div>",
        unsafe_allow_html=True,
    )


def _render_message(scenario):
    msg = scenario["message"]

    with st.container(border=True):
        st.markdown(
            f"**{msg['sender_name']}**  \n"
            f"<span style='color:var(--text-muted); font-size:13px;'>"
            f"{msg['sender_handle']}</span>",
            unsafe_allow_html=True,
        )

        st.markdown(f"### {msg['subject']}")
        st.write(msg["body"])

    st.markdown("**Choose what to do:**")

    for action in scenario["actions"]:
        if st.button(
            action["label"],
            key=f"action_{action['id']}",
            use_container_width=True,
        ):
            result = evaluate_action(
                action["id"],
                scenario["risk_indicators"],
            )

            st.session_state.last_action_id = action["id"]
            st.session_state.last_result = result
            st.session_state.scenario_step = "consequence"

            st.rerun()


def evaluate_action(action_id, risk_indicators):
    """
    Deterministic evaluation of the user's decision.

    The AI generates the scenario and risk indicators, but it does not decide
    the user's score or classification.
    """

    if action_id == "click":
        return {
            "classification": "dangerous",
            "consequence_text": (
                "You chose to click the suspicious link. "
                "This is a risky action because the message contains "
                "warning signs that should be checked first."
            ),
        }

    if action_id == "inspect":
        return {
            "classification": "safe",
            "consequence_text": (
                "Good choice. Inspecting the message before interacting "
                "with it gives you a chance to identify suspicious clues."
            ),
        }

    if action_id == "report":
        return {
            "classification": "safe",
            "consequence_text": (
                "Good choice. Reporting a suspicious message helps prevent "
                "further interaction with a potential scam."
            ),
        }

    if action_id == "ignore":
        return {
            "classification": "neutral",
            "consequence_text": (
                "You avoided interacting with the suspicious message, "
                "which is safer than clicking it. However, reporting or "
                "inspecting the message would provide a stronger response."
            ),
        }

    return {
        "classification": "neutral",
        "consequence_text": (
            "Your action avoided an immediate dangerous interaction, "
            "but the message should still be treated cautiously."
        ),
    }


def _render_consequence(scenario):
    result = st.session_state.last_result

    with st.container(border=True):
        st.write(result["consequence_text"])

        risk_class = RISK_CLASS.get(
            result["classification"],
            "risk-warning",
        )

        risk_label = RISK_LABEL.get(
            result["classification"],
            "⚠️ Suspicious",
        )

        st.markdown(
            f'<span class="{risk_class}">{risk_label}</span>',
            unsafe_allow_html=True,
        )

        if scenario.get("risk_indicators"):
            st.markdown("### 🔎 Risk indicators")

            for indicator in scenario["risk_indicators"]:
                st.write(f"• {indicator}")

    if st.button(
        "See your result",
        use_container_width=True,
    ):
        st.session_state.screen = "result"
        st.session_state.result_stage = "result"
        st.rerun()

