from app.extensions import db
from app.models import PointsLedger, Review

REVIEW_APPROVED_POINTS = 10
PHOTO_BONUS_POINTS = 2

REASON_REVIEW_APPROVED = "review_approved"
REASON_PHOTO_BONUS = "photo_bonus"
REASON_REWARD_REDEMPTION = "reward_redemption"


def credit_points(user_id: int, points: int, reason: str, review_id: int | None = None) -> PointsLedger:
    entry = PointsLedger(user_id=user_id, review_id=review_id, points=points, reason=reason)
    db.session.add(entry)
    return entry


def get_points_balance(user_id: int) -> int:
    total = db.session.query(db.func.sum(PointsLedger.points)).filter_by(user_id=user_id).scalar()
    return total or 0


def credit_for_approved_review(review: Review) -> None:
    """Called exactly once, when a review transitions into approved status.
    Two separate ledger rows (rather than one summed row) so a user's points
    history reads as a clear audit trail of what they were credited for.
    """
    credit_points(review.user_id, REVIEW_APPROVED_POINTS, REASON_REVIEW_APPROVED, review_id=review.id)
    if review.photos:
        credit_points(review.user_id, PHOTO_BONUS_POINTS, REASON_PHOTO_BONUS, review_id=review.id)
