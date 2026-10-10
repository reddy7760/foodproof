from typing import Optional

import strawberry
from flask import current_app
from graphql import GraphQLError

from app.auth.context import require_admin, require_user
from app.graphql.types import (
    CloudinarySignature,
    Dish,
    PointsLedgerEntry,
    Redemption,
    Restaurant,
    Review,
    Reward,
    User,
)
from app.integrations.cloudinary_client import build_upload_signature
from app.models import Dish as DishModel
from app.models import PointsLedger as PointsLedgerModel
from app.models import Redemption as RedemptionModel
from app.models import Restaurant as RestaurantModel
from app.models import Review as ReviewModel
from app.models import Reward as RewardModel
from app.models.review import ReviewStatus
from app.points import get_points_balance


@strawberry.type
class Query:
    @strawberry.field
    def me(self, info: strawberry.types.Info) -> Optional[User]:
        user = info.context.get("current_user")
        return User.from_model(user) if user else None

    @strawberry.field
    def cloudinary_upload_signature(self, info: strawberry.types.Info) -> CloudinarySignature:
        require_user(info)
        if not current_app.config["CLOUDINARY_CLOUD_NAME"]:
            raise GraphQLError("Cloudinary is not configured on this server")
        return CloudinarySignature(**build_upload_signature(current_app.config["CLOUDINARY_UPLOAD_FOLDER"]))

    @strawberry.field
    def restaurants(
        self, info: strawberry.types.Info, city: Optional[str] = None, search: Optional[str] = None
    ) -> list[Restaurant]:
        current_user = info.context.get("current_user")
        current_user_id = current_user.id if current_user else None

        query = RestaurantModel.query
        if city:
            query = query.filter(RestaurantModel.city.ilike(f"%{city}%"))
        if search:
            query = query.filter(RestaurantModel.name.ilike(f"%{search}%"))
        query = query.order_by(RestaurantModel.avg_rating.desc())
        return [Restaurant.from_model(r, current_user_id) for r in query.all()]

    @strawberry.field
    def restaurant(self, info: strawberry.types.Info, id: int) -> Optional[Restaurant]:
        current_user = info.context.get("current_user")
        current_user_id = current_user.id if current_user else None

        model = RestaurantModel.query.get(id)
        return Restaurant.from_model(model, current_user_id) if model else None

    @strawberry.field
    def dish(self, id: int) -> Optional[Dish]:
        model = DishModel.query.get(id)
        return Dish.from_model(model) if model else None

    @strawberry.field
    def my_points_balance(self, info: strawberry.types.Info) -> int:
        user = require_user(info)
        return get_points_balance(user.id)

    @strawberry.field
    def my_points_history(self, info: strawberry.types.Info) -> list[PointsLedgerEntry]:
        user = require_user(info)
        entries = (
            PointsLedgerModel.query.filter_by(user_id=user.id).order_by(PointsLedgerModel.created_at.desc()).all()
        )
        return [PointsLedgerEntry.from_model(e) for e in entries]

    @strawberry.field
    def pending_reviews(self, info: strawberry.types.Info) -> list[Review]:
        admin = require_admin(info)
        reviews = ReviewModel.query.filter_by(status=ReviewStatus.pending).order_by(ReviewModel.created_at).all()
        return [Review.from_model(r, current_user_id=admin.id) for r in reviews]

    @strawberry.field
    def rewards(self) -> list[Reward]:
        items = RewardModel.query.order_by(RewardModel.points_cost).all()
        return [Reward.from_model(r) for r in items]

    @strawberry.field
    def my_redemptions(self, info: strawberry.types.Info) -> list[Redemption]:
        user = require_user(info)
        items = RedemptionModel.query.filter_by(user_id=user.id).order_by(RedemptionModel.redeemed_at.desc()).all()
        return [Redemption.from_model(r) for r in items]
