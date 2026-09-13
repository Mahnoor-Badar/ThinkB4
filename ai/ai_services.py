import json
import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")

if not api_key:
    raise ValueError("OPENROUTER_API_KEY is not set.")


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)


def generate_ai_response(prompt: str) -> str:
    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return response.choices[0].message.content


def generate_scenario(scenario_type="phishing"):
    prompt = f"""
You are the AI scenario generator for ThinkB4, a cybersecurity awareness
simulation app.

Generate one realistic but fictional {scenario_type} awareness scenario.

The scenario must help a user recognize suspicious online behavior.

Return ONLY valid JSON with this structure:

{{
    "title": "Short scenario title",
    "intro": "Short introduction to the situation",
    "sender_name": "Fictional sender name",
    "sender_handle": "Fictional handle or email",
    "subject": "Message subject",
    "body": "The fictional suspicious message",
    "risk_indicators": [
        "Suspicious clue 1",
        "Suspicious clue 2",
        "Suspicious clue 3"
    ],
    "actions": [
        {{
            "id": "inspect",
            "label": "Inspect the message"
        }},
        {{
            "id": "click",
            "label": "Click the link"
        }},
        {{
            "id": "ignore",
            "label": "Ignore the message"
        }},
        {{
            "id": "report",
            "label": "Report the message"
        }}
    ]
}}

Rules:
- Keep everything fictional.
- Do not request real passwords, credentials, payment information, or
  personal information.
- Do not create real or realistic phishing URLs.
- If a link is needed, use [SIMULATED LINK] or
  https://example.com/simulated-link.
- Make the scenario suitable for cybersecurity awareness training.
"""

    raw_response = generate_ai_response(prompt)

    raw_response = raw_response.strip()

    if raw_response.startswith("```"):
        raw_response = raw_response.replace("```json", "", 1)
        raw_response = raw_response.replace("```", "", 1)
        raw_response = raw_response.strip()

    return json.loads(raw_response)