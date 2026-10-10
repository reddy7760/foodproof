import enum
from datetime import datetime, timezone

from app.extensions import db


class ReviewStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Review(db.Model):
    __tablename__ = "reviews"
    __table_args__ = (
        db.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating_range"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey("restaurants.id"), nullable=False, index=True)
    dish_id = db.Column(db.Integer, db.ForeignKey("dishes.id"), nullable=True, index=True)
    rating = db.Column(db.SmallInteger, nullable=False)
    review_text = db.Column(db.Text)
    price_paid = db.Column(db.Numeric(10, 2))
    status = db.Column(db.Enum(ReviewStatus), default=ReviewStatus.pending, nullable=False, index=True)
    is_verified_visit = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = db.relationship("User", back_populates="reviews")
    restaurant = db.relationship("Restaurant", back_populates="reviews")
    dish = db.relationship("Dish", back_populates="reviews")
    photos = db.relationship("ReviewPhoto", back_populates="review", lazy="selectin")
    helpful_votes = db.relationship("ReviewHelpfulVote", back_populates="review", lazy="selectin")
    points_entries = db.relationship("PointsLedger", back_populates="review", lazy="selectin")
