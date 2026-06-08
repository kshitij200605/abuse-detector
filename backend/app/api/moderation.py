from fastapi import APIRouter
from app.services.ai_pipeline import run_pipeline
from app.models.incident import AnalyzeRequest
from app.core.database import get_db

router = APIRouter(prefix="/api")


@router.post("/analyze")
async def analyze_message(req: AnalyzeRequest):
    result = run_pipeline(req.message, req.platform, req.username)
    db = get_db()
    if db is not None and result["severity"] != "NONE":
        await db.incidents.insert_one({**result})
    return result


@router.get("/incidents")
async def get_incidents(limit: int = 50, severity: str = None):
    db = get_db()
    if db is None:
        return []
    query = {}
    if severity:
        query["severity"] = severity.upper()
    cursor = db.incidents.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit)
    return await cursor.to_list(length=limit)


@router.get("/health")
async def health():
    return {"status": "ok", "service": "SentinelAI Backend"}
