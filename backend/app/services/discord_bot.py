"""
Discord Bot Integration (Level 2)
Monitors Discord server channels in real time using discord.py.

Setup:
  1. Go to https://discord.com/developers/applications → New Application
  2. Bot section → Add Bot → Copy Token
  3. OAuth2 → URL Generator → bot + Read Messages + Read Message History
  4. Invite the bot to your server
  5. Set in .env:
       DISCORD_BOT_TOKEN=...
       DISCORD_GUILD_IDS=123456789,987654321  (comma-separated)

Free tier: No limits on message reads for standard bots.
"""
import asyncio
import logging
from app.core.config import settings

logger = logging.getLogger("sentinel.discord")

_discord_bot = None
_discord_callback = None


def _make_bot(callback):
    """
    Create and configure a discord.py Client with message handlers.
    Returns the Client or None if discord.py is not installed.
    """
    try:
        import discord  # noqa: F401
    except ImportError:
        logger.warning("discord.py not installed — Discord stream disabled. Run: pip install discord.py")
        return None

    import discord

    intents = discord.Intents.default()
    intents.message_content = True

    client = discord.Client(intents=intents)

    @client.event
    async def on_ready():
        guild_count = len(client.guilds)
        logger.info(f"✅ Discord bot connected — monitoring {guild_count} server(s).")

    @client.event
    async def on_message(message):
        # Ignore bot messages
        if message.author.bot:
            return

        # Filter to configured guilds if provided
        allowed_guilds = settings.DISCORD_GUILD_IDS
        if allowed_guilds and str(message.guild.id) not in allowed_guilds:
            return

        event = {
            "message":      message.content,
            "username":     str(message.author),
            "platform":     "Discord",
            "server":       str(message.guild.name) if message.guild else "DM",
            "channel":      f"#{message.channel.name}" if hasattr(message.channel, "name") else "DM",
            "message_id":   str(message.id),
            "message_url":  message.jump_url,
        }

        try:
            await callback(event)
        except Exception as e:
            logger.warning(f"Discord callback error: {e}")

    return client


async def stream_discord_messages(callback):
    """
    Start the Discord bot and stream messages to `callback`.
    This is a long-running coroutine — run as an asyncio task.
    """
    if not settings.DISCORD_BOT_TOKEN:
        logger.info("DISCORD_BOT_TOKEN not set — Discord stream disabled.")
        return

    client = _make_bot(callback)
    if client is None:
        return

    try:
        await client.start(settings.DISCORD_BOT_TOKEN)
    except Exception as e:
        logger.error(f"Discord bot error: {e}")
