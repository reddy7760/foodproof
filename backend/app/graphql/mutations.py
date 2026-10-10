from typing import Optional

import strawberry
from flask import current_app
from graphql import GraphQLError
from sqlalchemy.exc import IntegrityError

from app.auth.context import require_admin, require_user
from app.auth.security import create_access_token, hash_password, verify_password
from app.extensions import db
from app.graphql.types import AuthPayload, Redemption, Review, ReviewPhoto, User
from app.models import Dish as DishModel
from app.models import Redemption as RedemptionModel
from app.models import Restaurant as RestaurantModel
from app.models import Review as ReviewModel
from app.models import ReviewHelpfulVote as ReviewHelpfulVoteModel
from app.models import ReviewPhoto as ReviewPhotoModel
from app.models import Reward as RewardModel
from app.models import User as UserModel
from app.models.review import ReviewStatus
from app.moderation import auto_approve_if_clean, is_own_cloudinary_url, moderate_photo
from app.points import REASON_REWARD_REDEMPTION, credit_for_approved_review, credit_points, get_points_balance


def _set_auth_cookie(info: strawberry.types.Info, user_id: int) -> None:
    token = create_access_token(user_id)
    response = info.context["response"]
    response.set_cookie(
        current_app.config["AUTH_COOKIE_NAME"],
        token,
        httponly=True,
        samesite="Lax",
        secure=current_app.config["AUTH_COOKIE_SECURE"],
        max_age=current_app.config["JWT_EXPIRES_SECONDS"],
        path="/",
    )


def _require_own_photo_url(photo_url: str) -> None:
    if not is_own_cloudinary_url(photo_url):
        raise GraphQLError("Photos must be uploaded through FoodProof's Cloudinary upload")


def _add_moderated_photo(review: ReviewModel, photo_url: str) -> ReviewPhotoModel:
    photo = ReviewPhotoModel(review=review, photo_url=photo_url)
    db.session.add(photo)
    db.session.flush()
    moderate_photo(photo)
    return photo


@strawberry.type
class Mutation:
    @strawberry.mutation
    def signup(
        self, info: strawberry.types.Info, name: str, email: str, password: str, phone: Optional[str] = None
    ) -> AuthPayload:
        if len(password) < 8:
            raise GraphQLError("Password must be at least 8 characters")

        user = UserModel(name=name, email=email.lower().strip(), password_hash=hash_password(password), phone=phone)
        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise GraphQLError("Email is already registered")

        _set_auth_cookie(info, user.id)
        return AuthPayload(user=User.from_model(user))

    @strawberry.mutation
    def login(self, info: strawberry.types.Info, email: str, password: str) -> AuthPayload:
        user = UserModel.query.filter_by(email=email.lower().strip()).first()
        if not user or not verify_password(password, user.password_hash):
            raise GraphQLError("Invalid email or password")

        _set_auth_cookie(info, user.id)
        return AuthPayload(user=User.from_model(user))

    @strawberry.mutation
    def logout(self, info: strawberry.types.Info) -> bool:
        response = info.context["response"]
        response.delete_cookie(current_app.config["AUTH_COOKIE_NAME"], path="/")
        return True

    @strawberry.mutation
    def create_review(
        self,
        info: strawberry.types.Info,
        restaurant_id: int,
        rating: int,
        dish_id: Optional[int] = None,
        review_text: Optional[str] = None,
        price_paid: Optional[float] = None,
        photo_url: Optional[str] = None,
    ) -> Review:
        user = require_user(info)

        if not 1 <= rating <= 5:
            raise GraphQLError("Rating must be between 1 and 5")

        restaurant = RestaurantModel.query.get(restaurant_id)
        if not restaurant:
            raise GraphQLError("Restaurant not found")

        if dish_id is not None:
            dish = DishModel.query.get(dish_id)
            if not dish or dish.restaurant_id != restaurant_id:
                raise GraphQLError("Dish not found for this restaurant")

        if photo_url is not None:
            _require_own_photo_url(photo_url)

        review = ReviewModel(
            user_id=user.id,
            restaurant_id=restaurant_id,
            dish_id=dish_id,
            rating=rating,
            review_text=review_text,
            price_paid=price_paid,
        )
        db.session.add(review)
        db.session.flush()
        if photo_url is not None:
            _add_moderated_photo(review, photo_url)
        auto_approve_if_clean(review)
        db.session.commit()
        return Review.from_model(review, current_user_id=user.id)

    @strawberry.mutation
    def attach_review_photo(self, info: strawberry.types.Info, review_id: int, photo_url: str) -> ReviewPhoto:
        user = require_user(info)

        review = ReviewModel.query.get(review_id)
        if not review:
            raise GraphQLError("Review not found")
        if review.user_id != user.id:
            raise GraphQLError("You can only attach photos to your own reviews")
        if review.status != ReviewStatus.pending:
            raise GraphQLError("Photos can only be added while a review is pending")

        _require_own_photo_url(photo_url)
        photo = _add_moderated_photo(review, photo_url)
        auto_approve_if_clean(review)
        db.session.commit()
        return ReviewPhoto.from_model(photo)

    @strawberry.mutation
    def approve_review(self, info: strawberry.types.Info, review_id: int) -> Review:
        admin = require_admin(info)

        review = ReviewModel.query.get(review_id)
        if not review:
            raise GraphQLError("Review not found")
        if review.status != ReviewStatus.pending:
            raise GraphQLError(f"Review is already {review.status.value}")

        review.status = ReviewStatus.approved
        credit_for_approved_review(review)
        db.session.commit()
        return Review.from_model(review, current_user_id=admin.id)

    @strawberry.mutation
    def reject_review(self, info: strawberry.types.Info, review_id: int) -> Review:
        admin = require_admin(info)

        review = ReviewModel.query.get(review_id)
        if not review:
            raise GraphQLError("Review not found")
        if review.status != ReviewStatus.pending:
            raise GraphQLError(f"Review is already {review.status.value}")

        review.status = ReviewStatus.rejected
        db.session.commit()
        return Review.from_model(review, current_user_id=admin.id)

    @strawberry.mutation
    def vote_helpful(self, info: strawberry.types.Info, review_id: int) -> Review:
        """Toggles the current user's helpful vote on a review."""
        user = require_user(info)

        review = ReviewModel.query.get(review_id)
        if not review:
            raise GraphQLError("Review not found")
        if review.status != ReviewStatus.approved:
            raise GraphQLError("Only approved reviews can be voted helpful")
        if review.user_id == user.id:
            raise GraphQLError("You can't vote your own review helpful")

        existing = ReviewHelpfulVoteModel.query.filter_by(review_id=review_id, voter_user_id=user.id).first()
        if existing:
            db.session.delete(existing)
        else:
            db.session.add(ReviewHelpfulVoteModel(review_id=review_id, voter_user_id=user.id))
        db.session.commit()
        return Review.from_model(review, current_user_id=user.id)

    @strawberry.mutation
    def redeem_reward(self, info: strawberry.types.Info, reward_id: int) -> Redemption:
        user = require_user(info)

        reward = RewardModel.query.get(reward_id)
        if not reward:
            raise GraphQLError("Reward not found")
        if reward.stock <= 0:
            raise GraphQLError("This reward is out of stock")
        if get_points_balance(user.id) < reward.points_cost:
            raise GraphQLError("Not enough points for this reward")

        reward.stock -= 1
        redemption = RedemptionModel(user_id=user.id, reward_id=reward.id, points_spent=reward.points_cost)
        db.session.add(redemption)
        db.session.flush()
        credit_points(user.id, -reward.points_cost, REASON_REWARD_REDEMPTION)
        db.session.commit()
        return Redemption.from_model(redemption)
