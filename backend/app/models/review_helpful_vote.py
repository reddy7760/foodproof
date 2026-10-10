from app.extensions import db


class ReviewHelpfulVote(db.Model):
    __tablename__ = "review_helpful_votes"
    __table_args__ = (
        db.UniqueConstraint("review_id", "voter_user_id", name="uq_review_helpful_vote"),
    )

    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey("reviews.id"), nullable=False, index=True)
    voter_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    review = db.relationship("Review", back_populates="helpful_votes")
