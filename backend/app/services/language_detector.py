"""
Language Detection Service
Uses langdetect to identify the language of a given text.
Supports: en, hi, ur, te, ta, bn, and mixed (Hinglish), plus many more.
"""
from langdetect import detect, detect_langs, LangDetectException

LANGUAGE_NAMES = {
    # South Asian
    "en":    "English",
    "hi":    "Hindi",
    "ur":    "Urdu",
    "te":    "Telugu",
    "ta":    "Tamil",
    "bn":    "Bengali",
    "pa":    "Punjabi",
    "mr":    "Marathi",
    "gu":    "Gujarati",
    "ml":    "Malayalam",
    "kn":    "Kannada",
    "or":    "Odia",
    "si":    "Sinhala",
    "ne":    "Nepali",
    # East Asian
    "zh-cn": "Chinese (Simplified)",
    "zh-tw": "Chinese (Traditional)",
    "ja":    "Japanese",
    "ko":    "Korean",
    # European
    "es":    "Spanish",
    "fr":    "French",
    "de":    "German",
    "pt":    "Portuguese",
    "it":    "Italian",
    "ru":    "Russian",
    "pl":    "Polish",
    "nl":    "Dutch",
    "sv":    "Swedish",
    "tr":    "Turkish",
    # Middle East / Africa
    "ar":    "Arabic",
    "fa":    "Persian/Farsi",
    "he":    "Hebrew",
    "id":    "Indonesian",
    "ms":    "Malay",
    "sw":    "Swahili",
    "tl":    "Filipino/Tagalog",
    "vi":    "Vietnamese",
    "th":    "Thai",
}

HINGLISH_MARKERS = [
    "kya", "hai", "nahi", "teri", "meri", "aukaat", "marr", "bhai",
    "yaar", "bol", "kar", "raha", "hoga", "aayegi", "idhar", "kyun",
    "tujhe", "mujhe", "uska", "woh", "aaj", "kal", "bohot", "bilkul",
    "sach", "jhooth", "dosto", "pagal", "bekaar", "bura", "accha",
    "pehle", "baad", "abhi", "thoda", "bahut", "kuch", "sab",
]


def detect_language(text: str) -> dict:
    """
    Returns: { code, name, is_hinglish, confidence }
    """
    text_lower = text.lower()

    # Check for Hinglish (Hindi words written in Latin script)
    hinglish_count = sum(1 for marker in HINGLISH_MARKERS if marker in text_lower)
    is_hinglish = hinglish_count >= 2

    try:
        langs = detect_langs(text)
        primary = langs[0]
        code = primary.lang
        confidence = round(primary.prob, 2)
    except LangDetectException:
        code = "en"
        confidence = 0.5

    if is_hinglish:
        return {
            "code": "hinglish",
            "name": "Hinglish",
            "is_hinglish": True,
            "confidence": max(confidence, 0.7),
        }

    return {
        "code": code,
        "name": LANGUAGE_NAMES.get(code, code.upper()),
        "is_hinglish": False,
        "confidence": confidence,
    }
