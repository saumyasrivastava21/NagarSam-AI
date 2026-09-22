from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

RULES_VERSION = "priority-v1"

class PriorityFactor(BaseModel):
    name: str
    description: str
    weight: float
    score_contribution: float

class PriorityCalculationResult(BaseModel):
    priority_score: float
    priority_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    factors: List[PriorityFactor]
    rules_version: str = RULES_VERSION
    calculated_at: str

class PriorityEngine:
    """Deterministic, transparent civic priority scoring engine."""

    SEVERITY_WEIGHTS = {
        "LOW": 20.0,
        "MEDIUM": 45.0,
        "HIGH": 70.0,
        "CRITICAL": 90.0,
    }

    DEFECT_CLASS_WEIGHTS = {
        "pothole": 15.0,
        "manhole": 20.0,
        "waterlogging": 12.0,
        "crack": 5.0,
        "debris": 8.0,
        "road_defect": 10.0,
    }

    HIGH_RISK_LANDMARK_KEYWORDS = [
        "school", "hospital", "metro", "junction", "crossing", "highway", "bus stop", "market", "station"
    ]

    def calculate_priority(
        self,
        severity: str = "MEDIUM",
        defect_class: str = "pothole",
        landmark: Optional[str] = None,
        address: Optional[str] = None,
        duplicate_count: int = 0,
        incident_age_days: float = 0.0,
    ) -> PriorityCalculationResult:
        factors: List[PriorityFactor] = []
        base_score = 0.0

        # 1. Base Severity Weight
        sev_upper = (severity or "MEDIUM").upper()
        sev_contrib = self.SEVERITY_WEIGHTS.get(sev_upper, 45.0)
        factors.append(PriorityFactor(
            name="SEVERITY_BASE",
            description=f"Initial severity rating ({sev_upper})",
            weight=1.0,
            score_contribution=sev_contrib
        ))
        base_score += sev_contrib

        # 2. Defect Class Structural Hazard
        def_lower = (defect_class or "pothole").lower().replace(" ", "_")
        class_contrib = self.DEFECT_CLASS_WEIGHTS.get(def_lower, 8.0)
        factors.append(PriorityFactor(
            name="DEFECT_CLASS_HAZARD",
            description=f"Defect type risk profile ({defect_class})",
            weight=0.5,
            score_contribution=class_contrib
        ))
        base_score += class_contrib

        # 3. Sensitive Infrastructure & Landmark Proximity
        combined_text = f"{landmark or ''} {address or ''}".lower()
        matched_keywords = [kw for kw in self.HIGH_RISK_LANDMARK_KEYWORDS if kw in combined_text]
        if matched_keywords:
            landmark_contrib = 10.0
            factors.append(PriorityFactor(
                name="SENSITIVE_ZONE_PROXIMITY",
                description=f"Proximity to high-density public infrastructure: {', '.join(matched_keywords)}",
                weight=1.0,
                score_contribution=landmark_contrib
            ))
            base_score += landmark_contrib

        # 4. Citizen Complaint Density (Duplicate Reports)
        if duplicate_count > 0:
            dup_contrib = min(20.0, duplicate_count * 5.0)
            factors.append(PriorityFactor(
                name="CITIZEN_IMPACT_DENSITY",
                description=f"{duplicate_count} corroborating citizen reports in vicinity (+5/report)",
                weight=1.0,
                score_contribution=dup_contrib
            ))
            base_score += dup_contrib

        # 5. SLA Decay / Unaddressed Age
        if incident_age_days > 1.0:
            age_contrib = min(15.0, round((incident_age_days - 1.0) * 2.0, 1))
            factors.append(PriorityFactor(
                name="SLA_AGING_DECAY",
                description=f"Unresolved for {round(incident_age_days, 1)} days (+2/day after day 1)",
                weight=1.0,
                score_contribution=age_contrib
            ))
            base_score += age_contrib

        final_score = min(100.0, max(0.0, round(base_score, 1)))

        if final_score >= 80.0:
            level = "CRITICAL"
        elif final_score >= 60.0:
            level = "HIGH"
        elif final_score >= 40.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        return PriorityCalculationResult(
            priority_score=final_score,
            priority_level=level,
            factors=factors,
            rules_version=RULES_VERSION,
            calculated_at=datetime.utcnow().isoformat()
        )

priority_engine = PriorityEngine()
