from app.extensions import db


class Reward(db.Model):
    __tablename__ = "rewards"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    points_cost = db.Column(db.Integer, nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey("restaurants.id"), nullable=True, index=True)
    stock = db.Column(db.Integer, default=0, nullable=False)

    restaurant = db.relationship("Restaurant")
    redemptions = db.relationship("Redemption", back_populates="reward", lazy="selectin")
