from datetime import datetime, timezone

from app.extensions import db


class PointsLedger(db.Model):
    """Append-only ledger of points events. Never update or delete rows here,
    and never store a mutable balance column — a user's balance is always the
    sum of their ledger entries, computed at read time. This avoids race
    conditions when multiple point-crediting events land concurrently.
    """

    __tablename__ = "points_ledger"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    review_id = db.Column(db.Integer, db.ForeignKey("reviews.id"), nullable=True, index=True)
    points = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = db.relationship("User", back_populates="points_entries")
    review = db.relationship("Review", back_populates="points_entries")
