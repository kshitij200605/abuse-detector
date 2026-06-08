from fastapi import APIRouter
from app.core.database import get_db

router = APIRouter(prefix="/api")


@router.get("/offenders")
async def get_offenders(limit: int = 50):
    db = get_db()
    if db is None:
        return []
    cursor = db.offenders.find({}, {"_id": 0}).sort("risk_score", -1).limit(limit)
    return await cursor.to_list(length=limit)


@router.get("/offenders/{username}")
async def get_offender_profile(username: str):
    db = get_db()
    if db is None:
        return {}
    doc = await db.offenders.find_one({"username": username}, {"_id": 0})
    return doc or {}
