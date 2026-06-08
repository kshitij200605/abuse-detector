"""
WebSocket streaming endpoint + multi-source stream orchestrator (Level 2)
Sources: Simulator, Reddit (PRAW), Discord (discord.py)
"""
import asyncio
import json
import logging
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.simulator import stream_events, generate_event
from app.services.ai_pipeline import run_pipeline_async
from app.services.forensics_engine import preserve_evidence
from app.core.database import get_db

logger = logging.getLogger("sentinel.stream")

router = APIRouter()

# Track active WebSocket connections
active_connections: Set[WebSocket] = set()


async def broadcast(message: dict):
    """Send a message to all connected WebSocket clients."""
    disconnected = set()
    for ws in active_connections:
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.add(ws)
    active_connections.difference_update(disconnected)


# Background task handles
_stream_task = None
_reddit_task = None
_discord_task = None


async def _handle_event(raw_event: dict):
    """
    Common handler called by all stream sources.
    Runs the full AI pipeline on the raw event and broadcasts the result.
    """
    result = await run_pipeline_async(
        message=raw_event["message"],
        platform=raw_event["platform"],
        username=raw_event["username"],
        extra_metadata={k: v for k, v in raw_event.items()
                        if k not in ("message", "platform", "username", "_hint")},
    )

    # Persist to MongoDB if available and content is flagged
    db = get_db()
    if db is not None and result["severity"] != "NONE":
        try:
            await db.incidents.insert_one({**result, "_id_str": result["evidence_hash"][:16]})
            evidence = preserve_evidence(result)
            await db.evidence.insert_one(evidence)
            await _update_offender(db, result)
        except Exception as e:
            logger.debug(f"DB write skipped: {e}")

    await broadcast(result)


async def _run_simulator_stream():
    """Simulator: always-on demo stream."""
    await stream_events(_handle_event, interval_range=(2.0, 4.0))


async def _run_reddit_stream():
    """Reddit: start only if credentials are configured."""
    try:
        from app.services.reddit_stream import stream_reddit_comments
        await stream_reddit_comments(_handle_event)
    except Exception as e:
        logger.info(f"Reddit stream not started: {e}")


async def _run_discord_stream():
    """Discord: start only if bot token is configured."""
    try:
        from app.services.discord_bot import stream_discord_messages
        await stream_discord_messages(_handle_event)
    except Exception as e:
        logger.info(f"Discord stream not started: {e}")


async def _update_offender(db, result: dict):
    username = result["username"]
    existing = await db.offenders.find_one({"username": username})
    if existing:
        await db.offenders.update_one(
            {"username": username},
            {
                "$inc": {"total_incidents": 1, "repeat_offense_count": 1},
                "$push": {
                    "toxicity_history": result["toxicity_score"],
                    "moderation_history": result["moderation_action"],
                },
                "$set": {
                    "last_seen": result["timestamp"],
                    "risk_score": min(
                        1.0,
                        existing.get("risk_score", 0) + result["toxicity_score"] * 0.1
                    ),
                },
            },
        )
    else:
        await db.offenders.insert_one({
            "username":           username,
            "platform":           result["platform"],
            "total_incidents":    1,
            "toxicity_history":   [result["toxicity_score"]],
            "repeat_offense_count": 1,
            "risk_score":         result["toxicity_score"] * 0.3,
            "moderation_history": [result["moderation_action"]],
            "escalation_history": [],
            "abuse_categories":   result["abuse_categories"],
            "last_seen":          result["timestamp"],
            "status":             "active",
        })


@router.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.discard(websocket)


async def start_stream():
    """Launch all stream sources as background asyncio tasks."""
    global _stream_task, _reddit_task, _discord_task

    _stream_task = asyncio.create_task(_run_simulator_stream())
    logger.info("✅ Simulator stream started.")

    _reddit_task = asyncio.create_task(_run_reddit_stream())
    _discord_task = asyncio.create_task(_run_discord_stream())
