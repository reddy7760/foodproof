import enum

from app.extensions import db


class ModerationStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ReviewPhoto(db.Model):
    __tablename__ = "review_photos"

    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey("reviews.id"), nullable=False, index=True)
    photo_url = db.Column(db.String(500), nullable=False)
    perceptual_hash = db.Column(db.String(32), nullable=True, index=True)
    moderation_status = db.Column(db.Enum(ModerationStatus), default=ModerationStatus.pending, nullable=False)
    is_duplicate = db.Column(db.Boolean, default=False, nullable=False)

    review = db.relationship("Review", back_populates="photos")
