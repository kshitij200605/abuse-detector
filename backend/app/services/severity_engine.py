"""
Severity Engine
Maps toxicity score + abuse categories to severity level and moderation action.
"""
from typing import List

SEVERITY_THRESHOLDS = {
    "CRITICAL": 0.85,
    "HIGH": 0.70,
    "MEDIUM": 0.45,
    "LOW": 0.20,
}

CRITICAL_CATEGORIES = {
    "SUICIDAL_ENCOURAGEMENT",
    "THREAT",
    "SEXUAL_HARASSMENT",
    "COERCION",
}

HIGH_CATEGORIES = {
    "HATE_SPEECH",
    "STALKING",
}

MEDIUM_CATEGORIES = {
    "CYBERBULLYING",
    "EMOTIONAL_ABUSE",
}

# Moderation actions per severity
ACTIONS = {
    "CRITICAL": "PERMANENT_BAN + FORENSIC_PRESERVATION + CYBER_LAW_ESCALATION",
    "HIGH": "AUTO_DELETE + ACCOUNT_STRIKE + MODERATION_ESCALATION",
    "MEDIUM": "HIDE_CONTENT + TEMPORARY_MUTE + WARNING_STRIKE",
    "LOW": "SOFT_WARNING + AI_NOTICE",
    "NONE": "NONE",
}

# Cyber law risk mapping (India)
LAW_MAPPING = {
    "THREAT": {
        "level": "HIGH",
        "categories": ["IPC Section 506 (Criminal Intimidation)", "IT Act Section 66F"],
    },
    "SEXUAL_HARASSMENT": {
        "level": "CRITICAL",
        "categories": [
            "IPC Section 354A (Sexual Harassment)",
            "IT Act Section 67 (Obscene Content)",
            "POCSO Act (if minor involved)",
        ],
    },
    "HATE_SPEECH": {
        "level": "HIGH",
        "categories": [
            "IPC Section 153A (Promoting Enmity)",
            "IPC Section 295A (Religious Hatred)",
        ],
    },
    "STALKING": {
        "level": "HIGH",
        "categories": [
            "IPC Section 354D (Stalking)",
            "IT Act Section 66C",
        ],
    },
    "COERCION": {
        "level": "CRITICAL",
        "categories": [
            "IPC Section 383 (Extortion)",
            "IT Act Section 66E",
        ],
    },
    "SUICIDAL_ENCOURAGEMENT": {
        "level": "CRITICAL",
        "categories": [
            "IPC Section 306 (Abetment of Suicide)",
            "IT Act Section 66F",
        ],
    },
    "CYBERBULLYING": {
        "level": "MEDIUM",
        "categories": [
            "IT Act Section 66A (Offensive Messages)",
            "IPC Section 509 (Outraging Modesty)",
        ],
    },
    "EMOTIONAL_ABUSE": {
        "level": "LOW",
        "categories": ["IT Act Section 66A"],
    },
}


def calculate_severity(toxicity_score: float, abuse_categories: List[str], repeat_offender: bool = False) -> dict:
    """
    Returns: { severity, moderation_action, legal_risk_level, legal_categories }
    """
    if "CLEAN" in abuse_categories:
        return {
            "severity": "NONE",
            "moderation_action": "NONE",
            "legal_risk_level": "NONE",
            "legal_categories": [],
        }

    # Boost score for repeat offenders
    effective_score = min(1.0, toxicity_score * 1.15) if repeat_offender else toxicity_score

    # Check for critical categories regardless of score
    has_critical = bool(CRITICAL_CATEGORIES & set(abuse_categories))
    has_high = bool(HIGH_CATEGORIES & set(abuse_categories))

    if effective_score >= SEVERITY_THRESHOLDS["CRITICAL"] or has_critical:
        severity = "CRITICAL"
    elif effective_score >= SEVERITY_THRESHOLDS["HIGH"] or has_high:
        severity = "HIGH"
    elif effective_score >= SEVERITY_THRESHOLDS["MEDIUM"]:
        severity = "MEDIUM"
    elif effective_score >= SEVERITY_THRESHOLDS["LOW"]:
        severity = "LOW"
    else:
        severity = "LOW"

    # Aggregate legal risk
    legal_cats = []
    max_legal_level = "LOW"
    level_order = {"NONE": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}

    for cat in abuse_categories:
        if cat in LAW_MAPPING:
            info = LAW_MAPPING[cat]
            legal_cats.extend(info["categories"])
            if level_order.get(info["level"], 0) > level_order.get(max_legal_level, 0):
                max_legal_level = info["level"]

    return {
        "severity": severity,
        "moderation_action": ACTIONS[severity],
        "legal_risk_level": max_legal_level,
        "legal_categories": list(set(legal_cats)),
    }
