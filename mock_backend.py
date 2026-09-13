"""
TEMPORARY stand-in for the real backend (backend/game_service.py etc).

This file exists so the frontend can be built and tested before the backend
teammate's code is ready. It fakes the same kind of answers the real backend
will eventually return. When the real backend/game_service.py exists, the
frontend files should import from it instead of this file -- nothing else
about frontend/home.py, scenario_view.py, or result_view.py needs to change,
as long as the real backend returns data shaped the same way.
"""

# ---------- fake class roster (stands in for a real login system) ----------
STUDENTS_BY_CLASS = {
    "MATH7A": ["Ayesha", "Bilal", "Sara", "Hamza"],
    "SCI9B": ["Zara", "Ali", "Noor"],
}


def verify_class_code(code: str):
    """Returns a list of student names for a class code, or None if invalid."""
    return STUDENTS_BY_CLASS.get(code.strip().upper())


# ---------- fake dashboard data ----------
def get_student_dashboard(student_name: str):
    return {
        "name": student_name,
        "score": 82,
        "level": "Scam Spotter",
        "progress": 70,
        "simulations_completed": 6,
    }


# ---------- fake scenario content (first MVP scenario) ----------
SCENARIOS = {
    "gaming_reward": {
        "id": "gaming_reward",
        "title": "The Surprise Gaming Reward",
        "intro": "You are playing your favorite online game. Suddenly, you get a message saying you've won bonus coins.",
        "message": {
            "sender_name": "GameRewards Team",
            "sender_handle": "rewards@game-bonus-center.com",
            "subject": "🎮 You've won 5,000 bonus coins!",
            "body": "Congratulations! Claim your reward before midnight or it expires.",
            "button_label": "Claim now",
        },
        "actions": [
            {"id": "click", "label": "Claim now", "classification": "dangerous", "score": -20},
            {"id": "check_sender", "label": "Check the sender", "classification": "safe", "score": 15},
            {"id": "ignore", "label": "Ignore it", "classification": "neutral", "score": 5},
            {"id": "report", "label": "Report the message", "classification": "safe", "score": 15},
        ],
        "consequences": {
            "click": "You clicked the link. A website opens asking for your name, student ID, and password to 'verify' your reward.",
            "check_sender": "You look closely at the sender's address. It doesn't match any real game company you know.",
            "ignore": "You closed the message without acting on it. Nothing happens, but you didn't tell anyone about it either.",
            "report": "You reported the message. It gets flagged so other players are warned too.",
        },
        "explanations": {
            "click": {
                "risk_level": "dangerous",
                "why": "The message promised a reward you weren't expecting and pushed you to act fast, before you could think it through.",
                "warning_signs": ["Unexpected reward", "Urgent deadline", "Asks for personal info", "Unfamiliar sender"],
            },
            "check_sender": {
                "risk_level": "safe",
                "why": "Checking the sender first is exactly the right move. It let you spot that this wasn't a real company before you did anything risky.",
                "warning_signs": ["Unfamiliar sender", "Unexpected reward"],
            },
            "ignore": {
                "risk_level": "safe",
                "why": "Ignoring it kept you safe, but reporting it would have also helped protect other players.",
                "warning_signs": ["Unexpected reward", "Urgent deadline"],
            },
            "report": {
                "risk_level": "safe",
                "why": "Reporting suspicious messages helps everyone, not just you.",
                "warning_signs": ["Unexpected reward", "Urgent deadline"],
            },
        },
        "whatif": {
            "click": {"safer_action": "check_sender", "outcome": "If you'd checked the sender first, you would have noticed the address didn't match a real company, and avoided the fake site entirely."},
            "ignore": {"safer_action": "report", "outcome": "If you'd also reported it, other students playing the same game could have been warned too."},
        },
    }
}


def get_scenario(scenario_id: str):
    return SCENARIOS[scenario_id]


def submit_action(scenario_id: str, action_id: str):
    scenario = SCENARIOS[scenario_id]
    action = next(a for a in scenario["actions"] if a["id"] == action_id)
    return {
        "action_id": action_id,
        "classification": action["classification"],
        "score": action["score"],
        "consequence_text": scenario["consequences"][action_id],
    }


def get_result_summary(scenario_id: str, action_id: str):
    scenario = SCENARIOS[scenario_id]
    action = next(a for a in scenario["actions"] if a["id"] == action_id)
    return {
        "score": max(action["score"] + 60, 0),
        "decisions_made": 1,
        "safe_decisions": 1 if action["classification"] == "safe" else 0,
        "risky_decisions": 1 if action["classification"] in ("dangerous", "neutral") else 0,
        "outcome_positive": action["classification"] == "safe",
    }


def get_feedback(scenario_id: str, action_id: str):
    return SCENARIOS[scenario_id]["explanations"][action_id]


def get_whatif(scenario_id: str, action_id: str):
    scenario = SCENARIOS[scenario_id]
    whatif = scenario["whatif"].get(action_id)
    if not whatif:
        return None
    safer_action = whatif["safer_action"]
    safer_label = next(a["label"] for a in scenario["actions"] if a["id"] == safer_action)
    return {"safer_action_label": safer_label, "outcome": whatif["outcome"]}
