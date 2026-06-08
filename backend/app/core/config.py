from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB:  str = "sentinelai"

    # ── App ───────────────────────────────────────────────────────
    APP_ENV:    str = "development"
    SECRET_KEY: str = "sentinelai-secret-key-2024"
    REPORTS_DIR: str = "./reports"

    # ── Level 2: HuggingFace ──────────────────────────────────────
    # Free tier — get key at: https://huggingface.co/settings/tokens
    HF_API_KEY: Optional[str] = None

    # ── Level 2: Google Perspective API ──────────────────────────
    # Free tier — get key at: https://perspectiveapi.com/
    PERSPECTIVE_API_KEY: Optional[str] = None

    # ── Level 2: LibreTranslate ────────────────────────────────────
    # Self-host: docker run -ti --rm -p 5000:5000 libretranslate/libretranslate
    LIBRETRANSLATE_URL:     str = "http://localhost:5000"
    LIBRETRANSLATE_API_KEY: Optional[str] = None

    # ── Level 2: Reddit (PRAW) ────────────────────────────────────
    # Register free app at: https://www.reddit.com/prefs/apps
    REDDIT_CLIENT_ID:     Optional[str] = None
    REDDIT_CLIENT_SECRET: Optional[str] = None
    REDDIT_USER_AGENT:    str = "SentinelAI/2.0"
    REDDIT_SUBREDDITS:    Optional[List[str]] = None

    # ── Level 2: Discord Bot ──────────────────────────────────────
    # Create free bot at: https://discord.com/developers/applications
    DISCORD_BOT_TOKEN:  Optional[str] = None
    DISCORD_GUILD_IDS:  Optional[List[str]] = None

    class Config:
        env_file = ".env"

settings = Settings()
