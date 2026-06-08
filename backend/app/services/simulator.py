"""
Real-time message simulator.
Generates realistic multilingual social media messages for the demo stream.
Includes messages in 12+ languages: English, Hindi, Hinglish, Tamil, Telugu,
Bengali, Urdu, Punjabi, Spanish, Arabic, Japanese, French, German, and more.
"""
import random
import asyncio
from datetime import datetime, timezone

PLATFORMS = ["Instagram", "WhatsApp", "Reddit", "Discord"]

INSTAGRAM_USERNAMES = [
    "priya.sharma_official", "aesthetic_rahul", "wanderlust_sneha", "travel_blogger_aditya",
    "fitness_sam23", "foodie_ananya", "sunset_seeker", "insta_king_delhi", "guitar_guy_arjun",
    "mumbai_diaries", "sharma.siddharth", "toxic_insta_troll", "cyber_bull_ig", "harasser_ig_99",
    "sports_central_in", "tech_trends_global", "bookish_bliss", "new_to_insta", "gamer_chick_99",
    "punjabi_munda_ig", "telugu_ammayi", "tamil_payyan", "kolkata_foodie", "dubai_vlog",
    "tokyo_lights", "paris_chic_99", "madrid_explorer", "bonjour_le_monde", "berlin_vibes"
]

REDDIT_USERNAMES = [
    "u/throwaway_12984", "u/PM_ME_YOUR_MEMES", "u/gandalf_the_grey_7", "u/reddit_lurker_99",
    "u/toxic_redditor_66", "u/political_rant_dude", "u/science_guy_2026", "u/amitheasshole_fan",
    "u/cricket_lover_ind", "u/relationship_guru", "u/twox_supporter", "u/college_struggler",
    "u/bollywood_masala", "u/unpopular_poster", "u/meme_lord_reddit", "u/helpful_mod_99",
    "u/innocent_redditor", "u/bad_actor_reddit", "u/cyberbully_subreddit", "u/repeat_offender_r",
    "u/gaming_geek_red", "u/books_and_coffee", "u/delhi_metro_user", "u/punjabi_dhol_u",
    "u/bonjour_reddit", "u/espanol_amigo", "u/anime_otaku_reddit", "u/arabic_reddit_user"
]

DISCORD_USERNAMES = [
    "ShadowBlade#1234", "GamerPro#1337", "AnimeWaifu#9999", "rageQuit#0001", "ModShield#4242",
    "spicy_ramen#8888", "wumpus_friend#4567", "discord_helper#9876", "silent_assassin#1111",
    "cyber_punk#2077", "toxic_gamer#9999", "troll_king#6666", "chill_vibes#7777", "music_bot_fan#3333",
    "study_buddy#4444", "cricket_fanatic#5555", "bad_actor_discord#9090", "harasser_guild#1212",
    "newbie_gamer#8080", "pro_coder#0000", "delhi_boy_dc#7890", "punjabi_beats#1122",
    "espanol_gamer#2233", "otaku_chan#5566", "arabic_gamer#4455", "bonjour_discord#9911"
]

WHATSAPP_USERNAMES = [
    "Amit Sharma", "Neha Gupta", "Priya (College)", "Rohan (Intern)", "Karan Malhotra",
    "Aisha Khan", "Dr. Amit Patel", "Uncle Ramesh", "Class Monitor Riya", "Sales Lead Vivek",
    "Sunita Sharma", "Amit Mehra", "Vikram Malhotra", "Aman Gupta", "Neha Sen", "toxic_chat_user",
    "troll_member", "repeat_offender_wa", "harasser_bot_wa", "anonymous_sender", "Sanjay Kumar",
    "Pooja Verma", "Anil Deshmukh", "Simran Kaur", "Srinivas Rao", "Karthik Raja", "Abdur Rahman",
    "Juan Carlos", "Marie Dubois", "Yuki Tanaka"
]


# Subreddits for Reddit platform events
SUBREDDITS = [
    "india", "teenagers", "relationship_advice", "amitheasshole",
    "worldnews", "gaming", "bollywood", "cricket", "AskReddit",
    "unpopularopinion", "TwoXChromosomes", "college", "memes",
]

# Discord servers and channels
DISCORD_SERVERS = [
    "Indian Gamers Hub", "Study Together", "Bollywood Fans", "Tech India",
    "Cricket Nation", "Anime Central", "College Network", "Gaming Squad",
]

DISCORD_CHANNELS = [
    "general", "memes", "off-topic", "help", "gaming", "music",
    "study-room", "announcements", "rant", "politics",
]

# Message bank — mixed severity and many languages
MESSAGES = [
    # ── CRITICAL (English) ──────────────────────────────────────
    ("go kill yourself you worthless piece of trash", "HIGH"),
    ("I know where you live, I'll find you tonight", "HIGH"),
    ("you deserve to die you disgusting human being", "HIGH"),
    ("kys nobody will miss you absolute loser", "HIGH"),
    ("I'll expose your private photos if you don't comply", "HIGH"),
    ("I will track you down and make you pay for this", "HIGH"),

    # ── CRITICAL (Hindi) ────────────────────────────────────────
    ("marr ja teri zindagi ka koi matlab nahi hai", "HIGH"),
    ("tu 6000 mein aayegi idhar, randi", "HIGH"),
    ("tujhe maar dunga agar tune mujhe ignore kiya", "HIGH"),
    ("teri beizzati karunga puri duniya ke saamne", "HIGH"),

    # ── HIGH (Hinglish) ─────────────────────────────────────────
    ("teri aukaat kya hai tu kuch nahi kar sakti life mein", "MED"),
    ("bhai teri maa ki aankh, tu kya samjhta hai apne aap ko", "MED"),
    ("pagal hai kya tu bilkul, mujhe mat bol kuch bhi", "MED"),

    # ── HIGH (Tamil) ────────────────────────────────────────────
    ("உன்னை நான் கொன்று விடுவேன் நாளை பார்", "HIGH"),
    ("நீ ஒரு பயல் நாயே, வெளியே போ", "MED"),
    ("உன் வீடு தெரியும் எனக்கு, பாத்துக்கோ", "HIGH"),

    # ── HIGH (Telugu) ───────────────────────────────────────────
    ("నిన్ను చంపేస్తాను, జాగ్రత్తగా ఉండు", "HIGH"),
    ("నువ్వు చాలా పనికిమాలినవాడివి", "MED"),
    ("వెళ్ళిపో ఇక్కడ నుండి, నీకు చోటు లేదు", "MED"),

    # ── HIGH (Bengali) ──────────────────────────────────────────
    ("তোকে মেরে ফেলব, সাবধান থাক", "HIGH"),
    ("তুই একটা বেকার মানুষ, কোনো কাজের না", "MED"),
    ("তোর মতো মানুষ বেঁচে থাকার যোগ্য না", "HIGH"),

    # ── HIGH (Urdu) ─────────────────────────────────────────────
    ("تمہیں مار ڈالوں گا، خبردار رہو", "HIGH"),
    ("تم ایک بیکار انسان ہو، کہیں چلے جاؤ", "MED"),
    ("تمہاری عزت تار تار کر دوں گا", "MED"),

    # ── HIGH (Punjabi) ──────────────────────────────────────────
    ("ਤੈਨੂੰ ਮਾਰ ਦਿਆਂਗਾ, ਖ਼ਬਰਦਾਰ ਰਹੀਂ", "HIGH"),
    ("ਤੂੰ ਬਿਲਕੁਲ ਬੇਕਾਰ ਹੈਂ, ਚਲੇ ਜਾ ਇੱਥੋਂ", "MED"),

    # ── HIGH (Spanish) ──────────────────────────────────────────
    ("te voy a matar si no te callas ahora mismo", "HIGH"),
    ("eres un inútil, nadie te quiere aquí pedazo de basura", "MED"),
    ("vete a la mierda, no sirves para nada", "MED"),

    # ── HIGH (Arabic) ───────────────────────────────────────────
    ("سأقتلك إذا لم تتوقف عن هذا الكلام", "HIGH"),
    ("أنت إنسان عديم الفائدة، اخرج من هنا", "MED"),
    ("سأكشف صورك الخاصة للجميع", "HIGH"),

    # ── HIGH (French) ───────────────────────────────────────────
    ("je vais te tuer si tu ne te tais pas maintenant", "HIGH"),
    ("tu es un inutile, personne ne t'aime ici", "MED"),
    ("va te faire foutre, tu ne sers à rien", "MED"),

    # ── HIGH (German) ───────────────────────────────────────────
    ("ich werde dich finden und dir zeigen was passiert", "HIGH"),
    ("du bist wertlos, niemand will dich hier haben", "MED"),

    # ── HIGH (Japanese) ─────────────────────────────────────────
    ("お前を殺してやる、覚悟しろ", "HIGH"),
    ("消えろ、お前みたいな奴は要らない", "MED"),
    ("お前の個人情報をネットにバラしてやる", "HIGH"),

    # ── MEDIUM (English) ────────────────────────────────────────
    ("you're such a loser, stop trying, you'll never succeed", "LOW"),
    ("nobody wants you here, just leave this community", "LOW"),
    ("you're pathetic and completely worthless honestly", "LOW"),
    ("go back to your country, you don't belong here", "MED"),
    ("all muslims should be banned from this platform", "MED"),
    ("I'll make you regret this, mark my words", "MED"),

    # ── MEDIUM (Hindi) ──────────────────────────────────────────
    ("tujhe kuch nahi hoga tu idiot hai aur rahega", "LOW"),
    ("tu bahut bekaar hai, apni zindagi sudhar le", "LOW"),

    # ── CLEAN (English) ─────────────────────────────────────────
    ("hey can you help me with this assignment?", "CLEAN"),
    ("great match today! that last goal was absolutely insane", "CLEAN"),
    ("what time is the meeting tomorrow? I might be a bit late", "CLEAN"),
    ("just finished reading that book you recommended, loved it!", "CLEAN"),
    ("happy birthday! hope you have an absolutely amazing day 🎉", "CLEAN"),
    ("bro that's hilarious, please send me the clip!", "CLEAN"),
    ("studying for finals, wish me luck! it's so stressful", "CLEAN"),
    ("anyone else watching the IPL match tonight? Go CSK!", "CLEAN"),
    ("new coffee shop opened near my place, pretty good vibes ngl", "CLEAN"),
    ("finally submitted my project, feeling so relieved right now", "CLEAN"),

    # ── CLEAN (Hindi/Hinglish) ──────────────────────────────────
    ("lol bhai tu pagal hai 😂 love you yaar", "CLEAN"),
    ("marr ja 😂😂 itna funny tha woh scene", "CLEAN"),
    ("yaar aaj bohot accha din tha, kuch naya seekha", "CLEAN"),
    ("bhai kal match dekhne chalein? mera plan hai", "CLEAN"),
    ("sach mein bata, woh movie kaisi thi? suni thi bahut acchi", "CLEAN"),

    # ── CLEAN (Tamil) ───────────────────────────────────────────
    ("வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?", "CLEAN"),
    ("இன்று நல்ல நாள், நடிப்பு பார்க்கலாம்", "CLEAN"),

    # ── CLEAN (Telugu) ──────────────────────────────────────────
    ("నమస్కారం, మీరు ఎలా ఉన్నారు?", "CLEAN"),
    ("ఈ రోజు చాలా బాగుంది, సినిమా చూద్దాం", "CLEAN"),

    # ── CLEAN (Bengali) ─────────────────────────────────────────
    ("আজকে খুব ভালো দিন, সিনেমা দেখতে যাবো", "CLEAN"),
    ("তুমি কেমন আছ? অনেক দিন দেখা হয়নি", "CLEAN"),

    # ── CLEAN (Spanish) ─────────────────────────────────────────
    ("hola, ¿cómo estás? hace mucho tiempo", "CLEAN"),
    ("hoy es un buen día, vamos a ver la película juntos", "CLEAN"),

    # ── CLEAN (Arabic) ──────────────────────────────────────────
    ("السلام عليكم، كيف حالك اليوم؟", "CLEAN"),
    ("اليوم يوم جميل، نذهب لمشاهدة الفيلم", "CLEAN"),

    # ── CLEAN (Japanese) ────────────────────────────────────────
    ("こんにちは、元気ですか？久しぶりですね", "CLEAN"),
    ("今日は良い天気ですね、映画を見に行きましょう", "CLEAN"),

    # ── CLEAN (French) ──────────────────────────────────────────
    ("bonjour, comment ça va? ça fait longtemps", "CLEAN"),
    ("aujourd'hui c'est une belle journée, on va au cinéma?", "CLEAN"),
]


def generate_event() -> dict:
    """Generate one simulated moderation event."""
    message, hint = random.choice(MESSAGES)
    platform = random.choice(PLATFORMS)

    if platform == "Instagram":
        username = random.choice(INSTAGRAM_USERNAMES)
    elif platform == "Reddit":
        username = random.choice(REDDIT_USERNAMES)
    elif platform == "Discord":
        username = random.choice(DISCORD_USERNAMES)
    elif platform == "WhatsApp":
        username = random.choice(WHATSAPP_USERNAMES)
    else:
        username = "anonymous"

    event = {
        "message": message,
        "username": username,
        "platform": platform,
        "_hint": hint,
    }

    # Add platform-specific metadata
    if platform == "Reddit":
        event["subreddit"] = random.choice(SUBREDDITS)
        event["post_title"] = random.choice([
            "What's the most toxic thing you've seen online?",
            "Daily discussion thread — share your thoughts",
            "Hot take: social media is ruining society",
            "Rant: why do people act like this?",
            "Anyone else dealing with harassment online?",
            "This community needs better moderation",
            "Weekly discussion — anything goes",
            "Is this normal behavior or am I overreacting?",
        ])
    elif platform == "Discord":
        event["server"] = random.choice(DISCORD_SERVERS)
        event["channel"] = random.choice(DISCORD_CHANNELS)

    return event


async def stream_events(callback, interval_range=(2.0, 5.0)):
    """
    Continuously generate events and pass them to callback.
    callback is an async function accepting the event dict.
    """
    while True:
        event = generate_event()
        await callback(event)
        await asyncio.sleep(random.uniform(*interval_range))
