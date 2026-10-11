"""Seed data for local development. Run with: flask seed"""

from app.extensions import db
from app.models import Dish, Restaurant, Reward

# Category taxonomy. Dish categories elsewhere in this file must use these exact strings
# (not the older "Main"/"Starter"/"Dessert"/"Bread"/"Beverage" singular forms) so the
# searchable dish dropdown groups consistently across restaurants.
CATEGORY_STARTERS = "Starters"
CATEGORY_MAIN_COURSE = "Main Course"
CATEGORY_BREADS = "Breads"
CATEGORY_DESSERTS = "Desserts"
CATEGORY_BEVERAGES = "Beverages"
CATEGORY_BREAKFAST = "Breakfast"

# Maps every category string this file (or an earlier seed run) has ever used onto the
# current taxonomy above, so `sync_dish_catalog` can bring an already-seeded database's
# categories up to date without touching anything else about those rows.
LEGACY_CATEGORY_RENAMES = {
    "Main": CATEGORY_MAIN_COURSE,
    "Starter": CATEGORY_STARTERS,
    "Bread": CATEGORY_BREADS,
    "Dessert": CATEGORY_DESSERTS,
    "Beverage": CATEGORY_BEVERAGES,
}

RESTAURANTS = [
    {
        "name": "Spice Route",
        "city": "Bengaluru",
        "address": "Indiranagar",
        "lat": 12.9716,
        "lng": 77.6412,
        "price_range": 2,
        "dishes": [
            {"name": "Paneer Tikka", "category": CATEGORY_STARTERS, "avg_price": 260},
            {"name": "Chicken Seekh Kebab", "category": CATEGORY_STARTERS, "avg_price": 310},
            {"name": "Veg Spring Rolls", "category": CATEGORY_STARTERS, "avg_price": 220},
            {"name": "Dahi Puri", "category": CATEGORY_STARTERS, "avg_price": 150},
            {"name": "Butter Chicken", "category": CATEGORY_MAIN_COURSE, "avg_price": 320},
            {"name": "Dal Makhani", "category": CATEGORY_MAIN_COURSE, "avg_price": 240},
            {"name": "Palak Paneer", "category": CATEGORY_MAIN_COURSE, "avg_price": 260},
            {"name": "Chicken Biryani", "category": CATEGORY_MAIN_COURSE, "avg_price": 340},
            {"name": "Garlic Naan", "category": CATEGORY_BREADS, "avg_price": 70},
            {"name": "Tandoori Roti", "category": CATEGORY_BREADS, "avg_price": 40},
            {"name": "Laccha Paratha", "category": CATEGORY_BREADS, "avg_price": 60},
            {"name": "Gulab Jamun", "category": CATEGORY_DESSERTS, "avg_price": 120},
            {"name": "Rasmalai", "category": CATEGORY_DESSERTS, "avg_price": 140},
            {"name": "Masala Chai", "category": CATEGORY_BEVERAGES, "avg_price": 50},
            {"name": "Sweet Lassi", "category": CATEGORY_BEVERAGES, "avg_price": 90},
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
            {"name": "Bruschetta", "category": CATEGORY_STARTERS, "avg_price": 240},
            {"name": "Garlic Bread", "category": CATEGORY_STARTERS, "avg_price": 180},
            {"name": "Calamari Fritti", "category": CATEGORY_STARTERS, "avg_price": 320},
            {"name": "Caprese Salad", "category": CATEGORY_STARTERS, "avg_price": 260},
            {"name": "Margherita Pizza", "category": CATEGORY_MAIN_COURSE, "avg_price": 450},
            {"name": "Spaghetti Aglio e Olio", "category": CATEGORY_MAIN_COURSE, "avg_price": 380},
            {"name": "Grilled Chicken Alfredo", "category": CATEGORY_MAIN_COURSE, "avg_price": 420},
            {"name": "Mushroom Risotto", "category": CATEGORY_MAIN_COURSE, "avg_price": 400},
            {"name": "Tiramisu", "category": CATEGORY_DESSERTS, "avg_price": 220},
            {"name": "Chocolate Lava Cake", "category": CATEGORY_DESSERTS, "avg_price": 240},
            {"name": "Panna Cotta", "category": CATEGORY_DESSERTS, "avg_price": 200},
            {"name": "Iced Americano", "category": CATEGORY_BEVERAGES, "avg_price": 160},
            {"name": "Virgin Mojito", "category": CATEGORY_BEVERAGES, "avg_price": 190},
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
            {"name": "Masala Dosa", "category": CATEGORY_BREAKFAST, "avg_price": 90},
            {"name": "Idli Sambar", "category": CATEGORY_BREAKFAST, "avg_price": 70},
            {"name": "Medu Vada", "category": CATEGORY_BREAKFAST, "avg_price": 60},
            {"name": "Uttapam", "category": CATEGORY_BREAKFAST, "avg_price": 80},
            {"name": "Banana Chips", "category": CATEGORY_STARTERS, "avg_price": 40},
            {"name": "Vada Curry", "category": CATEGORY_STARTERS, "avg_price": 90},
            {"name": "Chettinad Chicken Curry", "category": CATEGORY_MAIN_COURSE, "avg_price": 280},
            {"name": "Sambar Rice", "category": CATEGORY_MAIN_COURSE, "avg_price": 120},
            {"name": "Curd Rice", "category": CATEGORY_MAIN_COURSE, "avg_price": 90},
            {"name": "Lemon Rice", "category": CATEGORY_MAIN_COURSE, "avg_price": 100},
            {"name": "Payasam", "category": CATEGORY_DESSERTS, "avg_price": 70},
            {"name": "Filter Coffee", "category": CATEGORY_BEVERAGES, "avg_price": 40},
            {"name": "Buttermilk", "category": CATEGORY_BEVERAGES, "avg_price": 30},
            {"name": "Tender Coconut Water", "category": CATEGORY_BEVERAGES, "avg_price": 50},
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


def sync_dish_catalog() -> None:
    """Brings an already-seeded database's dish catalog up to date with RESTAURANTS above:
    renames categories still using the old taxonomy, and adds any dish that isn't already
    there by (restaurant, name) — without touching existing dishes, reviews, or anything
    else. Safe to run repeatedly. Run with: flask sync-dishes"""
    renamed = 0
    for dish in Dish.query.filter(Dish.category.in_(LEGACY_CATEGORY_RENAMES.keys())).all():
        dish.category = LEGACY_CATEGORY_RENAMES[dish.category]
        renamed += 1

    restaurants_by_name = {r.name: r for r in Restaurant.query.all()}
    added = 0
    for restaurant_data in RESTAURANTS:
        restaurant = restaurants_by_name.get(restaurant_data["name"])
        if not restaurant:
            print(f"Skipping dishes for '{restaurant_data['name']}': restaurant not found")
            continue
        existing_names = {d.name for d in restaurant.dishes}
        for dish_data in restaurant_data["dishes"]:
            if dish_data["name"] in existing_names:
                continue
            db.session.add(Dish(restaurant_id=restaurant.id, **dish_data))
            added += 1

    db.session.commit()
    print(f"Renamed {renamed} dish categories, added {added} new dishes.")


def sync_restaurant_details() -> None:
    """Brings an already-seeded database's restaurant fields (currently just `address`,
    used as the short area name — "Indiranagar", not a full street address) up to date
    with RESTAURANTS above, matched by name. Doesn't touch dishes, reviews, or anything
    else. Safe to run repeatedly. Run with: flask sync-restaurant-details"""
    restaurants_by_name = {r.name: r for r in Restaurant.query.all()}
    updated = 0
    for restaurant_data in RESTAURANTS:
        restaurant = restaurants_by_name.get(restaurant_data["name"])
        if not restaurant:
            continue
        if restaurant.address != restaurant_data["address"]:
            restaurant.address = restaurant_data["address"]
            updated += 1

    db.session.commit()
    print(f"Updated address on {updated} restaurants.")
