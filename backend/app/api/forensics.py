from fastapi import APIRouter
from app.core.database import get_db

router = APIRouter(prefix="/api")


@router.get("/evidence")
async def get_evidence(limit: int = 50):
    db = get_db()
    if db is None:
        return []
    cursor = db.evidence.find({}, {"_id": 0, "chain_of_custody": 0}).sort("timestamp", -1).limit(limit)
    return await cursor.to_list(length=limit)


@router.get("/evidence/{evidence_hash}")
async def get_evidence_by_hash(evidence_hash: str):
    db = get_db()
    if db is None:
        return {}
    doc = await db.evidence.find_one({"evidence_hash": evidence_hash}, {"_id": 0})
    return doc or {}
