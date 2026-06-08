"""
Perspective API Client (Level 2)
Google's free Perspective API for toxicity detection.
Requires a free API key from: https://perspectiveapi.com/

Falls back gracefully if key is not set or quota exceeded.
"""
import httpx
from app.core.config import settings

PERSPECTIVE_URL = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze"

# Which Perspective attributes to request
REQUESTED_ATTRIBUTES = [
    "TOXICITY",
    "SEVERE_TOXICITY",
    "IDENTITY_ATTACK",
    "INSULT",
    "PROFANITY",
    "THREAT",
    "SEXUALLY_EXPLICIT",
]

# Map Perspective attribute → our internal abuse category
ATTR_TO_CATEGORY = {
    "TOXICITY":          "CYBERBULLYING",
    "SEVERE_TOXICITY":   "THREAT",
    "IDENTITY_ATTACK":   "HATE_SPEECH",
    "INSULT":            "EMOTIONAL_ABUSE",
    "PROFANITY":         "CYBERBULLYING",
    "THREAT":            "THREAT",
    "SEXUALLY_EXPLICIT": "SEXUAL_HARASSMENT",
}

# Score thresholds for triggering a category
THRESHOLD = 0.60


async def analyze_with_perspective(text: str) -> dict | None:
    """
    POST to Google Perspective API.
    Returns a normalized toxicity dict, or None if unavailable.
    """
    if not settings.PERSPECTIVE_API_KEY:
        return None

    payload = {
        "comment": {"text": text},
        "languages": ["en"],
        "requestedAttributes": {attr: {} for attr in REQUESTED_ATTRIBUTES},
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                PERSPECTIVE_URL,
                params={"key": settings.PERSPECTIVE_API_KEY},
                json=payload,
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
    except Exception:
        return None

    attribute_scores = data.get("attributeScores", {})
    if not attribute_scores:
        return None

    # Extract scores
    scores: dict[str, float] = {}
    for attr, info in attribute_scores.items():
        scores[attr] = info["summaryScore"]["value"]

    # Primary toxicity score = TOXICITY attribute
    primary_score = scores.get("TOXICITY", 0.0)

    # Collect triggered categories
    triggered_cats: dict[str, float] = {}
    for attr, score in scores.items():
        if score >= THRESHOLD and attr in ATTR_TO_CATEGORY:
            cat = ATTR_TO_CATEGORY[attr]
            triggered_cats[cat] = max(triggered_cats.get(cat, 0.0), score)

    if not triggered_cats:
        return {
            "toxicity_score": round(primary_score, 3),
            "abuse_categories": ["CLEAN"],
            "confidence": 0.93,
            "explanation": "No harmful content detected by Google Perspective API.",
            "source": "perspective_api",
        }

    categories = list(triggered_cats.keys())
    top_score = max(triggered_cats.values())
    cat_str = " + ".join(c.replace("_", " ").title() for c in categories)

    return {
        "toxicity_score": round(top_score, 3),
        "abuse_categories": categories,
        "confidence": round(min(0.99, 0.80 + top_score * 0.18), 3),
        "explanation": (
            f"Google Perspective API detected {cat_str} "
            f"with {round(top_score * 100, 1)}% confidence."
        ),
        "source": "perspective_api",
    }
