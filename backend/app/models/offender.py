from pydantic import BaseModel
from typing import List, Optional


class OffenderProfile(BaseModel):
    username: str
    platform: str
    total_incidents: int = 0
    toxicity_history: List[float] = []
    repeat_offense_count: int = 0
    risk_score: float = 0.0
    moderation_history: List[str] = []
    escalation_history: List[str] = []
    abuse_categories: List[str] = []
    last_seen: Optional[str] = None
    status: str = "active"  # active, banned, muted, warned
