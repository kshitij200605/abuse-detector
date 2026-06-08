"""
Main AI Pipeline — Level 2
Full moderation pipeline with real AI model integration.

Detection chain (in priority order):
  1. HuggingFace toxic-bert (Inference API)    ← primary
  2. Google Perspective API                     ← secondary (if key set)
  3. Rule-based engine (toxicity_engine.py)     ← always-available fallback

Translation chain:
  1. LibreTranslate (self-hosted or public)     ← primary
  2. Pass-through (original text)               ← fallback
"""
import asyncio
from datetime import datetime, timezone
from app.services.language_detector import detect_language
from app.services.toxicity_engine import analyze_toxicity         # rule-based fallback
from app.services.severity_engine import calculate_severity
from app.core.security import generate_evidence_hash

# Level 2 services — imported lazily so startup doesn't crash if not configured
try:
    from app.services.huggingface_client import analyze_with_huggingface
except Exception:
    analyze_with_huggingface = None

try:
    from app.services.perspective_client import analyze_with_perspective
except Exception:
    analyze_with_perspective = None

try:
    from app.services.translator import smart_translate
except Exception:
    smart_translate = None


async def _run_toxicity_chain(text: str, translated_text: str) -> dict:
    """
    Try AI models in priority order. Always returns a valid toxicity dict.
    """
    # 1. Try HuggingFace toxic-bert
    if analyze_with_huggingface:
        try:
            result = await analyze_with_huggingface(translated_text or text)
            if result is not None:
                return result
        except Exception:
            pass

    # 2. Try Perspective API
    if analyze_with_perspective:
        try:
            result = await analyze_with_perspective(translated_text or text)
            if result is not None:
                return result
        except Exception:
            pass

    # 3. Rule-based fallback (always works, no network needed)
    return analyze_toxicity(text, translated_text)


async def run_pipeline_async(
    message: str,
    platform: str,
    username: str,
    repeat_offender: bool = False,
    extra_metadata: dict = None,
) -> dict:
    """
    Full async moderation pipeline (Level 2).
    Use this from async contexts (WebSocket handlers, API endpoints).
    """
    timestamp = datetime.now(timezone.utc).isoformat()

    # Step 1: Language Detection
    lang_info = detect_language(message)

    # Step 2: Translation (real LibreTranslate call in Level 2)
    translated_message = message
    was_translated = False
    if smart_translate:
        try:
            trans_result = await smart_translate(message)
            translated_message = trans_result.get("translated", message)
            was_translated = trans_result.get("was_translated", False)
        except Exception:
            pass

    # Step 3: AI Toxicity Analysis (real model chain)
    toxicity = await _run_toxicity_chain(message, translated_message)

    # Step 4: Severity + Legal Risk
    severity_info = calculate_severity(
        toxicity["toxicity_score"],
        toxicity["abuse_categories"],
        repeat_offender=repeat_offender,
    )

    # Step 5: Build evidence payload & hash
    evidence_payload = {
        "platform":          platform,
        "username":          username,
        "timestamp":         timestamp,
        "original_message":  message,
        "translated_message": translated_message,
        "toxicity_score":    toxicity["toxicity_score"],
        "abuse_categories":  toxicity["abuse_categories"],
        "severity":          severity_info["severity"],
        "moderation_action": severity_info["moderation_action"],
    }
    evidence_hash = generate_evidence_hash(evidence_payload)

    result = {
        # Core identity
        "platform":           platform,
        "username":           username,
        "message":            message,
        # Language
        "original_language":  lang_info["name"],
        "language_code":      lang_info["code"],
        "translated_message": translated_message,
        "was_translated":     was_translated,
        # Toxicity
        "toxicity_score":     toxicity["toxicity_score"],
        "abuse_category":     " + ".join(toxicity["abuse_categories"]),
        "abuse_categories":   toxicity["abuse_categories"],
        "confidence":         toxicity["confidence"],
        "ai_explanation":     toxicity["explanation"],
        "detection_source":   toxicity.get("source", "rule_based"),
        # Severity & legal
        "severity":           severity_info["severity"],
        "moderation_action":  severity_info["moderation_action"],
        "legal_risk_level":   severity_info["legal_risk_level"],
        "legal_categories":   severity_info["legal_categories"],
        # Forensics
        "timestamp":          timestamp,
        "evidence_hash":      evidence_hash,
    }

    # Attach platform-specific metadata (subreddit, channel, etc.)
    if extra_metadata:
        result.update(extra_metadata)

    return result


def run_pipeline(
    message: str,
    platform: str,
    username: str,
    repeat_offender: bool = False,
    extra_metadata: dict = None,
) -> dict:
    """
    Synchronous wrapper for backward compatibility and non-async callers.
    Tries to run in the current event loop; if no loop, creates one.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're inside an async context — create a concurrent task
            # This should only be called from sync code; async callers should
            # use run_pipeline_async() directly.
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(
                    asyncio.run,
                    run_pipeline_async(message, platform, username, repeat_offender, extra_metadata),
                )
                return future.result(timeout=15)
        else:
            return loop.run_until_complete(
                run_pipeline_async(message, platform, username, repeat_offender, extra_metadata)
            )
    except Exception:
        # Ultimate fallback: pure synchronous rule-based pipeline
        from datetime import datetime, timezone
        from app.services.language_detector import detect_language
        from app.services.toxicity_engine import analyze_toxicity
        from app.services.severity_engine import calculate_severity
        from app.core.security import generate_evidence_hash

        timestamp = datetime.now(timezone.utc).isoformat()
        lang_info = detect_language(message)
        toxicity = analyze_toxicity(message, message)
        severity_info = calculate_severity(toxicity["toxicity_score"], toxicity["abuse_categories"], repeat_offender)
        evidence_hash = generate_evidence_hash({"platform": platform, "username": username,
                                                "timestamp": timestamp, "original_message": message})
        return {
            "platform": platform, "username": username, "message": message,
            "original_language": lang_info["name"], "language_code": lang_info["code"],
            "translated_message": message, "was_translated": False,
            "toxicity_score": toxicity["toxicity_score"],
            "abuse_category": " + ".join(toxicity["abuse_categories"]),
            "abuse_categories": toxicity["abuse_categories"],
            "confidence": toxicity["confidence"],
            "ai_explanation": toxicity["explanation"],
            "detection_source": "rule_based_fallback",
            "severity": severity_info["severity"],
            "moderation_action": severity_info["moderation_action"],
            "legal_risk_level": severity_info["legal_risk_level"],
            "legal_categories": severity_info["legal_categories"],
            "timestamp": timestamp, "evidence_hash": evidence_hash,
        }
