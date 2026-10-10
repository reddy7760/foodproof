import click
from flask import Flask

from app.config import Config
from app.extensions import db, migrate


def create_app(config_class: type = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)

    from app import models  # noqa: F401  (registers models with SQLAlchemy metadata)
    from app.graphql.schema import FoodProofGraphQLView, schema
    from app.integrations.cloudinary_client import init_cloudinary

    init_cloudinary(app)

    app.add_url_rule(
        "/graphql",
        view_func=FoodProofGraphQLView.as_view("graphql_view", schema=schema),
    )

    @app.cli.command("seed")
    def seed_command():
        """Seed the database with sample restaurants and dishes."""
        from app.seed import run_seed

        run_seed()

    @app.cli.command("seed-rewards")
    def seed_rewards_command():
        """Add the reward catalog to a DB that already has restaurants seeded."""
        from app.seed import run_seed_rewards

        run_seed_rewards()

    @app.cli.command("export-schema")
    def export_schema_command():
        """Print the GraphQL SDL, for the frontend's codegen to consume."""
        print(schema.as_str())

    @app.cli.command("make-admin")
    @click.argument("email")
    def make_admin_command(email: str):
        """Grant admin access to an existing user, for the approval queue."""
        from app.models import User

        user = User.query.filter_by(email=email.lower().strip()).first()
        if not user:
            print(f"No user found with email {email}")
            return
        user.is_admin = True
        db.session.commit()
        print(f"{user.email} is now an admin")

    return app
