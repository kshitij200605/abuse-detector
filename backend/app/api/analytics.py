from fastapi import APIRouter
from app.core.database import get_db

router = APIRouter(prefix="/api")


@router.get("/analytics")
async def get_analytics():
    db = get_db()
    if db is None:
        return _mock_analytics()

    total = await db.incidents.count_documents({})
    critical = await db.incidents.count_documents({"severity": "CRITICAL"})
    high = await db.incidents.count_documents({"severity": "HIGH"})
    medium = await db.incidents.count_documents({"severity": "MEDIUM"})
    low = await db.incidents.count_documents({"severity": "LOW"})
    total_offenders = await db.offenders.count_documents({})
    total_evidence = await db.evidence.count_documents({})

    # Platform breakdown
    platforms = {}
    async for doc in db.incidents.aggregate([
        {"$group": {"_id": "$platform", "count": {"$sum": 1}}}
    ]):
        platforms[doc["_id"]] = doc["count"]

    # Language breakdown
    languages = {}
    async for doc in db.incidents.aggregate([
        {"$group": {"_id": "$original_language", "count": {"$sum": 1}}}
    ]):
        languages[doc["_id"]] = doc["count"]

    return {
        "total_incidents": total,
        "by_severity": {"CRITICAL": critical, "HIGH": high, "MEDIUM": medium, "LOW": low},
        "total_offenders": total_offenders,
        "total_evidence": total_evidence,
        "by_platform": platforms,
        "by_language": languages,
    }


def _mock_analytics():
    return {
        "total_incidents": 0,
        "by_severity": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
        "total_offenders": 0,
        "total_evidence": 0,
        "by_platform": {},
        "by_language": {},
    }
