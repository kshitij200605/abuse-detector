"""
Rule-based Toxicity Engine (Level 1)
Detects harassment, threats, hate speech, sexual abuse, etc.
using patterns, weights, and multilingual keyword banks.

Level 2 will plug in HuggingFace toxic-bert + Perspective API here.
"""
import re
from dataclasses import dataclass
from typing import List, Tuple

# ── Abuse Category Definitions ──────────────────────────────────────────────

PATTERNS = {
    "THREAT": {
        "weight": 0.85,
        "patterns": [
            r"\bkill\s+(you|yourself|ur|urself)\b",
            r"\bI'?ll\s+(find|hurt|kill|destroy|end)\s+you\b",
            r"\bmarr\s*ja\b",
            r"\bgo\s+die\b",
            r"\byou\s+deserve\s+to\s+die\b",
            r"\bI\s+know\s+where\s+you\s+live\b",
            r"\bI'?ll\s+make\s+you\s+pay\b",
            r"\bmaar\s*dunga\b",
            r"\btujhe\s+(dekh|maar)\b",
            r"నిన్ను\s*చంపేస్తాను",
            r"கொன்று\s*விடுவேன்",
            r"তোকে\s*মেরে\s*ফেলব",
            r"تمہیں\s*مار\s*ڈالوں\s*گا",
            r"ਤੈਨੂੰ\s*ਮਾਰ\s*ਦਿਆਂਗਾ",
            r"te\s*voy\s*a\s*matar",
            r"سأقتلك",
            r"je\s*vais\s*te\s*tuer",
            r"ich\s*werde\s*dich\s*finden",
            r"お前を殺してやる",
        ],
    },
    "SEXUAL_HARASSMENT": {
        "weight": 0.9,
        "patterns": [
            r"\b(slut|wh[o0]re|b[i1]tch|c[u0]nt)\b",
            r"\bsend\s+(nudes?|pics?)\b",
            r"\b6000\s*mai\s*aayegi\b",
            r"\btu\s+\d+\s*mai\s*(aayegi|aajaa)\b",
            r"\b(fuck|sex|xxx)\s+you\b",
            r"\b(sexual|rape|molest)\b",
        ],
    },
    "CYBERBULLYING": {
        "weight": 0.75,
        "patterns": [
            r"\b(loser|idiot|moron|stupid|dumb|ugly|fat|useless)\b",
            r"\b(nobody\s+likes\s+you|you'?re\s+worthless)\b",
            r"\bteri\s+aukaat\s+(kya\s+hai|nahi)\b",
            r"\bkuch\s+nahi\s+ho\s*ga\s+tera\b",
            r"\b(go\s+back|get\s+out)\b",
        ],
    },
    "HATE_SPEECH": {
        "weight": 0.88,
        "patterns": [
            r"\b(n[i1]gg[ae]r|k[i1]ke|sp[i1]c|ch[i1]nk)\b",
            r"\b(all\s+(muslims?|hindus?|christians?)\s+are)\b",
            r"\b(die\s+(you\s+)?(muslim|hindu|christian|jew))\b",
            r"\b(terrorist|jihadi|infidel)\b",
        ],
    },
    "STALKING": {
        "weight": 0.80,
        "patterns": [
            r"\bI'?m\s+watching\s+you\b",
            r"\bI\s+know\s+where\s+you\b",
            r"\bI'?ve\s+been\s+following\b",
            r"\byour\s+(address|location|school|workplace)\b",
        ],
    },
    "COERCION": {
        "weight": 0.82,
        "patterns": [
            r"\b(or\s+else|otherwise)\s+(I'?ll|you'?ll)\b",
            r"\b(do\s+it|comply)\s+or\b",
            r"\bblackmail\b",
            r"\bexpos[e\s]+you\b",
        ],
    },
    "SUICIDAL_ENCOURAGEMENT": {
        "weight": 0.95,
        "patterns": [
            r"\b(go\s+kill\s+yourself|kys)\b",
            r"\b(jump\s+off|hang\s+yourself|slit\s+your)\b",
            r"\bthe\s+world\s+is\s+better\s+without\s+you\b",
            r"\bnobody\s+would\s+miss\s+you\b",
        ],
    },
    "EMOTIONAL_ABUSE": {
        "weight": 0.65,
        "patterns": [
            r"\b(you'?re\s+(nothing|worthless|pathetic|a\s+joke))\b",
            r"\b(you\s+should\s+be\s+ashamed)\b",
            r"\b(nobody\s+loves\s+you)\b",
        ],
    },
}

# ── Friendly context reducers ──────────────────────────────────────────────

FRIENDLY_REDUCERS = [
    r"😂|😅|🤣|😜|😛",      # laugh emojis
    r"\b(jk|just kidding|lol|lmao|haha|hehe)\b",
    r"\b(bro|bhai|dost|yaar)\b",
]


def _compile_patterns():
    compiled = {}
    for cat, info in PATTERNS.items():
        compiled[cat] = {
            "weight": info["weight"],
            "regexes": [re.compile(p, re.IGNORECASE) for p in info["patterns"]],
        }
    return compiled


_COMPILED = _compile_patterns()
_FRIENDLY_RE = [re.compile(p, re.IGNORECASE) for p in FRIENDLY_REDUCERS]


def analyze_toxicity(text: str, translated_text: str = None) -> dict:
    """
    Returns:
      toxicity_score: 0.0–1.0
      abuse_categories: list of detected categories
      confidence: 0.0–1.0
      explanation: human-readable string
    """
    analyze_text = translated_text or text
    analyze_text_lower = analyze_text.lower()

    matches: List[Tuple[str, float]] = []

    for cat, info in _COMPILED.items():
        for regex in info["regexes"]:
            if regex.search(analyze_text_lower):
                matches.append((cat, info["weight"]))
                break  # one match per category is enough

    if not matches:
        return {
            "toxicity_score": 0.0,
            "abuse_categories": ["CLEAN"],
            "confidence": 0.95,
            "explanation": "No harmful content detected. Message appears clean.",
        }

    # Detect friendly context — reduce score
    friendly_signals = sum(1 for r in _FRIENDLY_RE if r.search(analyze_text))
    reducer = 0.15 * friendly_signals

    categories = list({cat for cat, _ in matches})
    raw_score = max(weight for _, weight in matches)
    final_score = max(0.0, min(1.0, raw_score - reducer))

    explanation = _build_explanation(categories, final_score, analyze_text, friendly_signals > 0)

    return {
        "toxicity_score": round(final_score, 3),
        "abuse_categories": categories,
        "confidence": round(min(0.97, 0.75 + final_score * 0.22), 3),
        "explanation": explanation,
    }


def _build_explanation(categories: List[str], score: float, text: str, friendly: bool) -> str:
    cat_str = " + ".join(c.replace("_", " ").title() for c in categories)
    context = " (Friendly context detected — score reduced.)" if friendly else ""
    return (
        f"Detected {cat_str} with {round(score * 100, 1)}% toxicity.{context} "
        f"Content violates community harassment and safety guidelines."
    )
