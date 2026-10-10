# Not wired up yet: strawberry's async DataLoader needs a live asyncio event
# loop per request, which Flask's sync WSGI dev server doesn't provide (each
# request lands on a fresh worker thread, and strawberry's execute_sync tears
# the loop down via asyncio.run after each resolver anyway). For restaurant ->
# dishes we instead rely on SQLAlchemy's lazy="selectin" relationship loading,
# which batches in one query without needing asyncio. Revisit these loaders
# for the deeper dish -> reviews -> photos chain (Milestone 3/4) once the app
# runs behind an ASGI server (strawberry.flask.views has no async variant;
# would mean switching to strawberry.asgi.GraphQL + Hypercorn/Uvicorn) or
# reimplement N+1 avoidance with plain per-request query batching instead.

from collections import defaultdict

from strawberry.dataloader import DataLoader

from app.models import Dish, Review, ReviewPhoto
from app.models.review import ReviewStatus


async def load_dishes_by_restaurant(restaurant_ids: list[int]) -> list[list[Dish]]:
    rows = Dish.query.filter(Dish.restaurant_id.in_(restaurant_ids)).all()
    by_restaurant: dict[int, list[Dish]] = defaultdict(list)
    for dish in rows:
        by_restaurant[dish.restaurant_id].append(dish)
    return [by_restaurant.get(rid, []) for rid in restaurant_ids]


async def load_approved_reviews_by_dish(dish_ids: list[int]) -> list[list[Review]]:
    rows = Review.query.filter(
        Review.dish_id.in_(dish_ids), Review.status == ReviewStatus.approved
    ).all()
    by_dish: dict[int, list[Review]] = defaultdict(list)
    for review in rows:
        by_dish[review.dish_id].append(review)
    return [by_dish.get(did, []) for did in dish_ids]


async def load_photos_by_review(review_ids: list[int]) -> list[list[ReviewPhoto]]:
    rows = ReviewPhoto.query.filter(ReviewPhoto.review_id.in_(review_ids)).all()
    by_review: dict[int, list[ReviewPhoto]] = defaultdict(list)
    for photo in rows:
        by_review[photo.review_id].append(photo)
    return [by_review.get(rid, []) for rid in review_ids]


def build_loaders() -> dict[str, DataLoader]:
    return {
        "dishes_by_restaurant": DataLoader(load_fn=load_dishes_by_restaurant),
        "reviews_by_dish": DataLoader(load_fn=load_approved_reviews_by_dish),
        "photos_by_review": DataLoader(load_fn=load_photos_by_review),
    }
