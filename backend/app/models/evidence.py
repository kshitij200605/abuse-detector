from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class EvidenceRecord(BaseModel):
    platform: str
    username: str
    timestamp: str
    original_message: str
    translated_message: Optional[str] = None
    toxicity_score: float
    abuse_category: str
    ai_explanation: str
    moderation_action: str
    legal_risk_level: str
    evidence_hash: str
    tamper_verified: bool = True
    forensic_notes: str = ""
    incident_id: Optional[str] = None
