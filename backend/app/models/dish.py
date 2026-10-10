from datetime import datetime, timezone

from app.extensions import db


class Dish(db.Model):
    __tablename__ = "dishes"

    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey("restaurants.id"), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(80))
    avg_rating = db.Column(db.Float, default=0.0, nullable=False)
    avg_price = db.Column(db.Numeric(10, 2))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    restaurant = db.relationship("Restaurant", back_populates="dishes")
    reviews = db.relationship("Review", back_populates="dish", lazy="selectin")
