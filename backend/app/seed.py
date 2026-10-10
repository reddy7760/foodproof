"""Seed data for local development. Run with: flask seed"""

from app.extensions import db
from app.models import Dish, Restaurant, Reward

RESTAURANTS = [
    {
        "name": "Spice Route",
        "city": "Bengaluru",
        "address": "100 Ft Road, Indiranagar",
        "lat": 12.9716,
        "lng": 77.6412,
        "price_range": 2,
        "dishes": [
            {"name": "Butter Chicken", "category": "Main", "avg_price": 320},
            {"name": "Paneer Tikka", "category": "Starter", "avg_price": 260},
            {"name": "Garlic Naan", "category": "Bread", "avg_price": 70},
        ],
    },
    {
        "name": "Rustic Tavern",
        "city": "Bengaluru",
        "address": "Church Street",
        "lat": 12.9754,
        "lng": 77.6046,
        "price_range": 3,
        "dishes": [
            {"name": "Margherita Pizza", "category": "Main", "avg_price": 450},
            {"name": "Tiramisu", "category": "Dessert", "avg_price": 220},
        ],
    },
    {
        "name": "Dakshin Diner",
        "city": "Chennai",
        "address": "T Nagar",
        "lat": 13.0418,
        "lng": 80.2341,
        "price_range": 1,
        "dishes": [
            {"name": "Masala Dosa", "category": "Breakfast", "avg_price": 90},
            {"name": "Filter Coffee", "category": "Beverage", "avg_price": 40},
        ],
    },
]


REWARDS = [
    {"title": "Free filter coffee", "points_cost": 20, "stock": 15, "restaurant_name": "Dakshin Diner"},
    {"title": "Free dessert", "points_cost": 40, "stock": 8, "restaurant_name": "Rustic Tavern"},
    {"title": "10% off your next visit", "points_cost": 50, "stock": 10, "restaurant_name": "Spice Route"},
    {"title": "₹100 off any order", "points_cost": 100, "stock": 5, "restaurant_name": None},
]


def run_seed() -> None:
    restaurants_by_name = {}
    for restaurant_data in RESTAURANTS:
        dishes_data = restaurant_data.pop("dishes")
        restaurant = Restaurant(**restaurant_data)
        db.session.add(restaurant)
        db.session.flush()
        restaurants_by_name[restaurant.name] = restaurant
        for dish_data in dishes_data:
            db.session.add(Dish(restaurant_id=restaurant.id, **dish_data))

    for reward_data in REWARDS:
        reward_data = dict(reward_data)
        restaurant_name = reward_data.pop("restaurant_name")
        restaurant_id = restaurants_by_name[restaurant_name].id if restaurant_name else None
        db.session.add(Reward(restaurant_id=restaurant_id, **reward_data))

    db.session.commit()
    print(f"Seeded {len(RESTAURANTS)} restaurants and {len(REWARDS)} rewards.")


def run_seed_rewards() -> None:
    """Adds the reward catalog to a database that already has restaurants seeded,
    without touching or duplicating existing restaurants/dishes. Run with:
    flask seed-rewards"""
    if Reward.query.count() > 0:
        print("Rewards already seeded, skipping.")
        return

    restaurants_by_name = {r.name: r for r in Restaurant.query.all()}
    for reward_data in REWARDS:
        reward_data = dict(reward_data)
        restaurant_name = reward_data.pop("restaurant_name")
        if restaurant_name and restaurant_name not in restaurants_by_name:
            print(f"Skipping '{reward_data['title']}': restaurant '{restaurant_name}' not found")
            continue
        restaurant_id = restaurants_by_name[restaurant_name].id if restaurant_name else None
        db.session.add(Reward(restaurant_id=restaurant_id, **reward_data))

    db.session.commit()
    print(f"Seeded {len(REWARDS)} rewards.")
