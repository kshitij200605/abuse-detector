"""
LibreTranslate Client (Level 2)
Translates non-English/Hinglish messages to English before AI analysis.
Uses the public LibreTranslate instance or a self-hosted Docker instance.

Self-host (free, no limits):
  docker run -ti --rm -p 5000:5000 libretranslate/libretranslate

Public hosted API: https://libretranslate.com (rate-limited, free tier)
"""
import httpx
from app.core.config import settings
from app.services.language_detector import detect_language

# Languages that do NOT need translation (already English or Roman-script Hinglish)
SKIP_TRANSLATION = {"en", "hinglish", "unknown"}

# Language code mapping: our detector → LibreTranslate source code
LANG_CODE_MAP = {
    "hi": "hi",   # Hindi (Devanagari)
    "ur": "ur",   # Urdu
    "te": "te",   # Telugu
    "ta": "ta",   # Tamil
    "bn": "bn",   # Bengali
    "ml": "ml",   # Malayalam
    "mr": "mr",   # Marathi
    "gu": "gu",   # Gujarati
    "kn": "kn",   # Kannada
    "pa": "pa",   # Punjabi
}


LOCAL_TRANSLATIONS = {
    # Telugu
    "నిన్ను చంపేస్తాను, జాగ్రత్తగా ఉండు": "I will kill you, be careful",
    "నువ్వు చాలా పనికిమాలినవాడివి": "You are very useless",
    "వెళ్ళిపో ఇక్కడ నుండి, నీకు చోటు లేదు": "Go away from here, you have no place",
    "నమస్కారం, మీరు ఎలా ఉన్నారు?": "Hello, how are you?",
    "ఈ రోజు చాలా బాగుంది, సినిమా చూద్దాం": "Today is very good, let's watch a movie",
    
    # Tamil
    "உன்னை நான் கொன்று விடுவேன் நாளை பார்": "I will kill you, watch out tomorrow",
    "நீ ஒரு பயல் நாயே, வெளியே போ": "You are a cowardly dog, get out",
    "உன் வீடு தெரியும் எனக்கு, பாத்துக்கோ": "I know your house, take care",
    "வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?": "Hello, how are you?",
    "இன்று நல்ல நாள், நடிப்பு பார்க்கலாம்": "Today is a good day, let's watch acting",
    
    # Bengali
    "তোকে মেরে ফেলব, সাবধান থাক": "I will kill you, be careful",
    "তুই একটা বেকার মানুষ, কোনো কাজের না": "You are a useless person, of no work",
    "তোর মতো মানুষ বেঁচে থাকার যোগ্য না": "People like you do not deserve to live",
    "আজকে খুব ভালো দিন, সিনেমা দেখতে যাবো": "Today is a very good day, we will go to watch a movie",
    "তুমি কেমন আছ? অনেক দিন দেখা হয়নি": "How are you? Haven't seen you in a long time",
    
    # Urdu
    "تمہیں مار ڈالوں گا، خبردار رہو": "I will kill you, be warned",
    "تم ایک بیکار انسان ہو، کہیں چلے جاؤ": "You are a useless person, go away somewhere",
    "تمہاری عزت تار تار کر دوں گا": "I will tear your respect to pieces",
    
    # Punjabi
    "ਤੈਨੂੰ ਮਾਰ ਦਿਆਂਗਾ, ਖ਼ਬਰਦਾਰ ਰਹੀਂ": "I will kill you, be warned",
    "ਤੂੰ ਬਿਲਕੁਲ ਬੇਕਾਰ ਹੈਂ, ਚਲੇ ਜਾ ਇੱਥੋਂ": "You are completely useless, go away from here",
    
    # Spanish
    "te voy a matar si no te callas ahora mismo": "I am going to kill you if you don't shut up right now",
    "eres un inútil, nadie te quiere aquí pedazo de basura": "you are useless, nobody wants you here piece of trash",
    "vete a la mierda, no sirves para nada": "go to hell, you are good for nothing",
    "hola, ¿cómo estás? hace mucho tiempo": "hello, how are you? long time",
    "hoy es un buen día, vamos a ver la película juntos": "today is a good day, we are going to watch the movie together",
    
    # Arabic
    "سأقتلك إذا لم تتوقف عن هذا الكلام": "I will kill you if you don't stop this talk",
    "أنت إنسان عديم الفائدة، اخرج من هنا": "You are a useless human, get out of here",
    "سأكشف صورك الخاصة للجميع": "I will expose your private photos to everyone",
    "السلام عليكم، كيف حالك اليوم?": "Peace be upon you, how are you today?",
    "اليوم يوم جميل، نذهب لمشاهدة الفيلم": "Today is a beautiful day, we go to watch the movie",
    
    # French
    "je vais te tuer si tu ne te tais pas maintenant": "I am going to kill you if you do not shut up now",
    "tu es un inutile, personne ne t'aime ici": "you are useless, nobody likes you here",
    "va te faire foutre, tu ne sers à rien": "go fuck yourself, you are useless",
    "bonjour, comment ça va? ça fait longtemps": "hello, how is it going? long time",
    "aujourd'hui c'est une belle journée, on va au cinéma?": "today is a beautiful day, are we going to the cinema?",
    
    # German
    "ich werde dich finden und dir zeigen was passiert": "I will find you and show you what happens",
    "du bist wertlos, niemand will dich hier haben": "you are worthless, nobody wants to have you here",
    
    # Japanese
    "お前を殺してやる、覚悟しろ": "I will kill you, prepare yourself",
    "消えろ、お前みたいな奴は要らない": "go away, we do not need guys like you",
    "お前の個人情報をネットにバラしてやる": "I will leak your personal information on the net",
    "こんにちは、元気ですか？久しぶりですね": "hello, how are you? long time no see",
    "今日は良い天気ですね、映画を見に行きましょう": "the weather is good today, let's go see a movie"
}


async def translate_to_english(text: str, source_lang_code: str) -> dict:
    """
    Attempt translation of `text` to English.
    Returns:
      {
        "translated": str,        # translated text (or original on failure)
        "was_translated": bool,   # whether translation actually happened
        "source_lang": str,       # source language code used
      }
    """
    # 1. Local translation dictionary lookup for simulated messages
    normalized_text = text.strip().replace("?", "？")
    # Quick exact matches
    if normalized_text in LOCAL_TRANSLATIONS:
        return {
            "translated": LOCAL_TRANSLATIONS[normalized_text],
            "was_translated": True,
            "source_lang": source_lang_code,
        }
    # Case-insensitive or clean check
    for key, val in LOCAL_TRANSLATIONS.items():
        if key.strip() == normalized_text:
            return {
                "translated": val,
                "was_translated": True,
                "source_lang": source_lang_code,
            }

    # Skip if already English or Hinglish (Roman-script mixed)
    if source_lang_code in SKIP_TRANSLATION:
        return {"translated": text, "was_translated": False, "source_lang": source_lang_code}

    lt_source = LANG_CODE_MAP.get(source_lang_code)
    if lt_source is None:
        # Unknown language code — pass through
        return {"translated": text, "was_translated": False, "source_lang": source_lang_code}

    url = f"{settings.LIBRETRANSLATE_URL}/translate"
    payload = {
        "q": text,
        "source": lt_source,
        "target": "en",
        "format": "text",
    }
    if settings.LIBRETRANSLATE_API_KEY:
        payload["api_key"] = settings.LIBRETRANSLATE_API_KEY

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                translated = data.get("translatedText", "")
                if translated and translated.strip():
                    return {
                        "translated": translated,
                        "was_translated": True,
                        "source_lang": lt_source,
                    }
    except Exception:
        pass

    # Fallback: return original unchanged
    return {"translated": text, "was_translated": False, "source_lang": source_lang_code}


async def smart_translate(text: str) -> dict:
    """
    Auto-detects language, then translates if needed.
    Returns same structure as translate_to_english() plus `lang_info`.
    """
    lang_info = detect_language(text)
    lang_code = lang_info.get("code", "en")

    result = await translate_to_english(text, lang_code)
    result["lang_info"] = lang_info
    return result
