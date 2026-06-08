import hashlib
import json
from datetime import datetime, timezone


def generate_evidence_hash(data: dict) -> str:
    """Generate SHA-256 hash of evidence data for chain-of-custody."""
    # Sort keys for deterministic serialization
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode()).hexdigest()


def verify_evidence_hash(data: dict, expected_hash: str) -> bool:
    """Verify evidence integrity by re-computing hash."""
    return generate_evidence_hash(data) == expected_hash


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
