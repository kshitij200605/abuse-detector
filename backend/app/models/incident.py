from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class IncidentCreate(BaseModel):
    platform: str
    username: str
    message: str
    original_language: str = "en"
    translated_message: Optional[str] = None
    toxicity_score: float = 0.0
    severity: str = "LOW"
    abuse_category: str = "NONE"
    ai_explanation: str = ""
    moderation_action: str = "NONE"
    confidence: float = 0.0
    legal_risk_level: str = "LOW"
    legal_categories: List[str] = []
    timestamp: str = ""
    evidence_hash: Optional[str] = None


class Incident(IncidentCreate):
    id: Optional[str] = None


class AnalyzeRequest(BaseModel):
    message: str
    platform: str = "manual"
    username: str = "anonymous"
