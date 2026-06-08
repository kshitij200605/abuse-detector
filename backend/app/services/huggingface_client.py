"""
HuggingFace Inference API Client (Level 2)
Calls toxic-bert / multilingual toxicity model via HuggingFace free Inference API.
Falls back gracefully to the rule-based engine if the API is unavailable.
"""
import httpx
import asyncio
from app.core.config import settings

# Primary model: specialized multi-label toxicity detection
HF_MODEL_TOXICITY = "unitary/toxic-bert"
# Secondary fallback: multilingual sentiment for Hinglish/Hindi
HF_MODEL_MULTILINGUAL = "cardiffnlp/twitter-xlm-roberta-base-sentiment"

HF_API_BASE = "https://router.huggingface.co/hf-inference/models"

# Label maps from toxic-bert output
LABEL_CATEGORY_MAP = {
    "toxic":              "CYBERBULLYING",
    "severe_toxic":       "THREAT",
    "obscene":            "SEXUAL_HARASSMENT",
    "threat":             "THREAT",
    "insult":             "EMOTIONAL_ABUSE",
    "identity_hate":      "HATE_SPEECH",
}

# Score thresholds above which we consider a label "triggered"
LABEL_THRESHOLD = 0.35


async def _call_hf_api(model: str, text: str, timeout: float = 8.0) -> list | None:
    """
    POST to HuggingFace Inference API and return raw output.
    Returns None on failure (timeout, 503 loading, no key, etc.)
    """
    headers = {}
    if settings.HF_API_KEY:
        headers["Authorization"] = f"Bearer {settings.HF_API_KEY}"

    url = f"{HF_API_BASE}/{model}"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, json={"inputs": text}, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            # 503 = model still loading — don't log as error, just fall back
    except (httpx.TimeoutException, httpx.ConnectError, Exception):
        pass
    return None


def _parse_toxic_bert(output: list) -> dict:
    """
    Parse toxic-bert output.
    HF returns: [[{"label": "toxic", "score": 0.87}, ...]]
    """
    if not output or not isinstance(output, list):
        return None

    # Unwrap nested list
    labels = output[0] if isinstance(output[0], list) else output

    triggered = []
    max_score = 0.0
    for item in labels:
        label = item.get("label", "").lower()
        score = float(item.get("score", 0.0))
        if score > max_score:
            max_score = score
        if score >= LABEL_THRESHOLD and label in LABEL_CATEGORY_MAP:
            triggered.append((LABEL_CATEGORY_MAP[label], score))

    if not triggered:
        return {
            "toxicity_score": round(max_score, 3),
            "abuse_categories": ["CLEAN"],
            "confidence": 0.92,
            "explanation": "No harmful content detected by HuggingFace toxic-bert model.",
            "source": "huggingface:toxic-bert",
        }

    # Deduplicate categories, pick highest score per category
    cat_scores: dict[str, float] = {}
    for cat, sc in triggered:
        cat_scores[cat] = max(cat_scores.get(cat, 0.0), sc)

    categories = list(cat_scores.keys())
    top_score = max(cat_scores.values())

    cat_str = " + ".join(c.replace("_", " ").title() for c in categories)
    return {
        "toxicity_score": round(top_score, 3),
        "abuse_categories": categories,
        "confidence": round(min(0.97, 0.75 + top_score * 0.22), 3),
        "explanation": (
            f"HuggingFace toxic-bert detected {cat_str} "
            f"with {round(top_score * 100, 1)}% confidence. "
            f"Content violates safety guidelines."
        ),
        "source": "huggingface:toxic-bert",
    }


async def analyze_with_huggingface(text: str) -> dict | None:
    """
    Try toxic-bert. Returns a toxicity dict or None if unavailable.
    """
    output = await _call_hf_api(HF_MODEL_TOXICITY, text)
    if output is None:
        return None
    return _parse_toxic_bert(output)
