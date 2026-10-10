from datetime import datetime, timezone

from app.extensions import db


class Restaurant(db.Model):
    __tablename__ = "restaurants"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    city = db.Column(db.String(120), nullable=False, index=True)
    address = db.Column(db.String(300))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    price_range = db.Column(db.SmallInteger)  # 1-4, like $ .. $$$$
    avg_rating = db.Column(db.Float, default=0.0, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    dishes = db.relationship("Dish", back_populates="restaurant", lazy="selectin")
    reviews = db.relationship("Review", back_populates="restaurant", lazy="selectin")
