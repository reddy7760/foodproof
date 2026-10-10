import os


class Config:
    # Defaults to a local SQLite file until WSL2/Docker Postgres is set up on this
    # machine; set DATABASE_URL to switch back to Postgres, no code changes needed.
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///" + os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    # Auth: JWT is carried in an httpOnly cookie (not exposed to frontend JS/localStorage).
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRES_SECONDS = int(os.environ.get("JWT_EXPIRES_SECONDS", 60 * 60 * 24 * 7))  # 7 days
    AUTH_COOKIE_NAME = "access_token"
    # Cookie needs Secure=False for local http dev; flip via env once served over https.
    AUTH_COOKIE_SECURE = os.environ.get("AUTH_COOKIE_SECURE", "0") == "1"

    # Cloudinary: backend only ever issues a signed upload signature: the actual
    # image bytes go from the browser straight to Cloudinary, never through Flask.
    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")
    CLOUDINARY_UPLOAD_FOLDER = os.environ.get("CLOUDINARY_UPLOAD_FOLDER", "foodproof/reviews")
