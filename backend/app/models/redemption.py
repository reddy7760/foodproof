import enum
from datetime import datetime, timezone

from app.extensions import db


class RedemptionStatus(enum.Enum):
    pending = "pending"
    fulfilled = "fulfilled"
    cancelled = "cancelled"


class Redemption(db.Model):
    __tablename__ = "redemptions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    reward_id = db.Column(db.Integer, db.ForeignKey("rewards.id"), nullable=False, index=True)
    points_spent = db.Column(db.Integer, nullable=False)
    redeemed_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    status = db.Column(db.Enum(RedemptionStatus), default=RedemptionStatus.pending, nullable=False)

    user = db.relationship("User")
    reward = db.relationship("Reward", back_populates="redemptions")
