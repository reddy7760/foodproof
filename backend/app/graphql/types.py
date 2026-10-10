from datetime import datetime
from typing import Optional

import strawberry

from app.models import Dish as DishModel
from app.models import PointsLedger as PointsLedgerModel
from app.models import Redemption as RedemptionModel
from app.models import Restaurant as RestaurantModel
from app.models import Review as ReviewModel
from app.models import ReviewPhoto as ReviewPhotoModel
from app.models import Reward as RewardModel
from app.models import User as UserModel
from app.models.review import ReviewStatus


@strawberry.type
class Dish:
    id: int
    name: str
    category: Optional[str]
    avg_rating: float
    avg_price: Optional[float]
    created_at: datetime

    @classmethod
    def from_model(cls, model: DishModel) -> "Dish":
        return cls(
            id=model.id,
            name=model.name,
            category=model.category,
            avg_rating=model.avg_rating,
            avg_price=float(model.avg_price) if model.avg_price is not None else None,
            created_at=model.created_at,
        )


@strawberry.type
class ReviewPhoto:
    id: int
    review_id: int
    photo_url: str
    moderation_status: str

    @classmethod
    def from_model(cls, model: ReviewPhotoModel) -> "ReviewPhoto":
        return cls(
            id=model.id,
            review_id=model.review_id,
            photo_url=model.photo_url,
            moderation_status=model.moderation_status.value,
        )


@strawberry.type
class Review:
    id: int
    user_id: int
    restaurant_id: int
    dish_id: Optional[int]
    rating: int
    review_text: Optional[str]
    price_paid: Optional[float]
    status: str
    is_verified_visit: bool
    created_at: datetime
    photos: list[ReviewPhoto]
    helpful_count: int
    has_voted_helpful: bool
    # Denormalized for the admin queue, which only ever lists a handful of pending
    # reviews at once — not worth a selectin relationship for this volume.
    user_name: str
    user_email: str
    restaurant_name: str
    dish_name: Optional[str]

    @classmethod
    def from_model(cls, model: ReviewModel, current_user_id: Optional[int] = None) -> "Review":
        return cls(
            id=model.id,
            user_id=model.user_id,
            restaurant_id=model.restaurant_id,
            dish_id=model.dish_id,
            rating=model.rating,
            review_text=model.review_text,
            price_paid=float(model.price_paid) if model.price_paid is not None else None,
            status=model.status.value,
            is_verified_visit=model.is_verified_visit,
            created_at=model.created_at,
            photos=[ReviewPhoto.from_model(p) for p in model.photos],
            helpful_count=len(model.helpful_votes),
            has_voted_helpful=(
                current_user_id is not None
                and any(v.voter_user_id == current_user_id for v in model.helpful_votes)
            ),
            user_name=model.user.name,
            user_email=model.user.email,
            restaurant_name=model.restaurant.name,
            dish_name=model.dish.name if model.dish else None,
        )


@strawberry.type
class Restaurant:
    id: int
    name: str
    city: str
    address: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    price_range: Optional[int]
    avg_rating: float
    created_at: datetime
    dishes: list[Dish]
    reviews: list[Review]

    @classmethod
    def from_model(cls, model: RestaurantModel, current_user_id: Optional[int] = None) -> "Restaurant":
        # model.dishes/model.reviews are loaded via the relationships' lazy="selectin"
        # strategy, so SQLAlchemy batches this in one query across all restaurants in
        # the result set rather than issuing one query per restaurant (N+1).
        approved = [r for r in model.reviews if r.status == ReviewStatus.approved]
        approved.sort(key=lambda r: (-len(r.helpful_votes), -r.created_at.timestamp()))
        return cls(
            id=model.id,
            name=model.name,
            city=model.city,
            address=model.address,
            lat=model.lat,
            lng=model.lng,
            price_range=model.price_range,
            avg_rating=model.avg_rating,
            created_at=model.created_at,
            dishes=[Dish.from_model(d) for d in model.dishes],
            reviews=[Review.from_model(r, current_user_id) for r in approved],
        )


@strawberry.type
class User:
    id: int
    name: str
    email: str
    phone: Optional[str]
    is_admin: bool
    created_at: datetime

    @classmethod
    def from_model(cls, model: UserModel) -> "User":
        return cls(
            id=model.id,
            name=model.name,
            email=model.email,
            phone=model.phone,
            is_admin=model.is_admin,
            created_at=model.created_at,
        )


@strawberry.type
class AuthPayload:
    user: User


@strawberry.type
class CloudinarySignature:
    signature: str
    timestamp: int
    api_key: str
    cloud_name: str
    folder: str


@strawberry.type
class PointsLedgerEntry:
    id: int
    points: int
    reason: str
    review_id: Optional[int]
    created_at: datetime

    @classmethod
    def from_model(cls, model: PointsLedgerModel) -> "PointsLedgerEntry":
        return cls(
            id=model.id,
            points=model.points,
            reason=model.reason,
            review_id=model.review_id,
            created_at=model.created_at,
        )


@strawberry.type
class Reward:
    id: int
    title: str
    points_cost: int
    stock: int
    restaurant_id: Optional[int]
    restaurant_name: Optional[str]

    @classmethod
    def from_model(cls, model: RewardModel) -> "Reward":
        return cls(
            id=model.id,
            title=model.title,
            points_cost=model.points_cost,
            stock=model.stock,
            restaurant_id=model.restaurant_id,
            restaurant_name=model.restaurant.name if model.restaurant else None,
        )


@strawberry.type
class Redemption:
    id: int
    reward_id: int
    reward_title: str
    points_spent: int
    redeemed_at: datetime
    status: str

    @classmethod
    def from_model(cls, model: RedemptionModel) -> "Redemption":
        return cls(
            id=model.id,
            reward_id=model.reward_id,
            reward_title=model.reward.title,
            points_spent=model.points_spent,
            redeemed_at=model.redeemed_at,
            status=model.status.value,
        )
