"""
Forensics Engine
Handles evidence preservation, chain-of-custody, and report generation.
"""
import os
from datetime import datetime, timezone
from app.core.security import generate_evidence_hash, verify_evidence_hash


def preserve_evidence(incident: dict) -> dict:
    """
    Prepares a forensic evidence record from an incident.
    Adds chain-of-custody hash and forensic metadata.
    """
    # Core evidence fields for hashing
    hashable = {
        "platform": incident.get("platform"),
        "username": incident.get("username"),
        "timestamp": incident.get("timestamp"),
        "original_message": incident.get("message"),
        "toxicity_score": incident.get("toxicity_score"),
        "severity": incident.get("severity"),
    }

    evidence_hash = generate_evidence_hash(hashable)

    return {
        "platform": incident.get("platform"),
        "username": incident.get("username"),
        "timestamp": incident.get("timestamp"),
        "original_message": incident.get("message"),
        "translated_message": incident.get("translated_message"),
        "toxicity_score": incident.get("toxicity_score"),
        "abuse_category": incident.get("abuse_category"),
        "ai_explanation": incident.get("ai_explanation"),
        "moderation_action": incident.get("moderation_action"),
        "legal_risk_level": incident.get("legal_risk_level"),
        "evidence_hash": evidence_hash,
        "tamper_verified": True,
        "forensic_notes": f"Evidence preserved automatically by SentinelAI at {datetime.now(timezone.utc).isoformat()}",
        "chain_of_custody": [
            {
                "action": "EVIDENCE_CREATED",
                "actor": "SentinelAI System",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "hash": evidence_hash,
            }
        ],
    }


def verify_evidence(evidence_record: dict) -> bool:
    """Verify that an evidence record hasn't been tampered with."""
    stored_hash = evidence_record.get("evidence_hash")
    hashable = {
        "platform": evidence_record.get("platform"),
        "username": evidence_record.get("username"),
        "timestamp": evidence_record.get("timestamp"),
        "original_message": evidence_record.get("original_message"),
        "toxicity_score": evidence_record.get("toxicity_score"),
        "severity": evidence_record.get("severity"),
    }
    return verify_evidence_hash(hashable, stored_hash)
