"""
Reddit Live Stream Integration (Level 2)
Uses PRAW (Python Reddit API Wrapper) to stream comments
from specified subreddits in real time.

Setup:
  1. Go to https://www.reddit.com/prefs/apps → Create App (script type)
  2. Add credentials to .env:
       REDDIT_CLIENT_ID=...
       REDDIT_CLIENT_SECRET=...
       REDDIT_USER_AGENT=SentinelAI/2.0

Free tier: 60 requests/minute. No payment required.
"""
import asyncio
import logging
from app.core.config import settings

logger = logging.getLogger("sentinel.reddit")

# Subreddits to monitor (can be overridden via settings)
DEFAULT_SUBREDDITS = [
    "india",
    "AskIndia",
    "teenagers",
    "relationship_advice",
    "AmItheAsshole",
]

_reddit_client = None


def _get_reddit():
    """Lazy-init PRAW Reddit client."""
    global _reddit_client
    if _reddit_client is not None:
        return _reddit_client

    try:
        import praw  # noqa: F401 — imported only when available
        if not settings.REDDIT_CLIENT_ID or not settings.REDDIT_CLIENT_SECRET:
            logger.warning("Reddit credentials not set — Reddit stream disabled.")
            return None

        _reddit_client = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent=settings.REDDIT_USER_AGENT,
            check_for_async=False,
        )
        logger.info("✅ Reddit (PRAW) client initialized.")
        return _reddit_client
    except ImportError:
        logger.warning("praw not installed — Reddit stream disabled. Run: pip install praw")
        return None
    except Exception as e:
        logger.warning(f"Reddit client init failed: {e}")
        return None


async def stream_reddit_comments(callback, subreddits: list[str] = None):
    """
    Stream comments from configured subreddits.
    Calls `callback(event_dict)` for each comment.
    Runs in a thread pool to avoid blocking the async event loop.

    Each event dict has keys: message, username, platform, subreddit, post_title, comment_url
    """
    reddit = _get_reddit()
    if reddit is None:
        logger.info("Reddit stream not available — skipping.")
        return

    targets = subreddits or settings.REDDIT_SUBREDDITS or DEFAULT_SUBREDDITS
    subreddit_str = "+".join(targets)

    loop = asyncio.get_event_loop()

    def _blocking_stream():
        try:
            subreddit = reddit.subreddit(subreddit_str)
            for comment in subreddit.stream.comments(skip_existing=True, pause_after=0):
                if comment is None:
                    continue
                event = {
                    "message":     comment.body,
                    "username":    str(comment.author) if comment.author else "deleted",
                    "platform":    "Reddit",
                    "subreddit":   str(comment.subreddit),
                    "post_title":  comment.link_title[:100] if hasattr(comment, "link_title") else "",
                    "comment_url": f"https://reddit.com{comment.permalink}",
                }
                # Schedule the async callback on the event loop from the thread
                future = asyncio.run_coroutine_threadsafe(callback(event), loop)
                try:
                    future.result(timeout=10)
                except Exception as cb_err:
                    logger.warning(f"Reddit callback error: {cb_err}")
        except Exception as e:
            logger.error(f"Reddit stream error: {e}")

    # Run the blocking PRAW stream in a thread executor
    try:
        await loop.run_in_executor(None, _blocking_stream)
    except Exception as e:
        logger.error(f"Reddit executor error: {e}")
