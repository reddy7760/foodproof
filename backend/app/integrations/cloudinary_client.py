import time

import cloudinary
import cloudinary.utils
from flask import Flask


def init_cloudinary(app: Flask) -> None:
    cloudinary.config(
        cloud_name=app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=app.config["CLOUDINARY_API_KEY"],
        api_secret=app.config["CLOUDINARY_API_SECRET"],
        secure=True,
    )


def build_upload_signature(folder: str) -> dict:
    """Signs the params the frontend must send back unmodified when it uploads
    directly to Cloudinary, so image bytes never round-trip through Flask."""
    timestamp = int(time.time())
    params_to_sign = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(params_to_sign, cloudinary.config().api_secret)
    return {
        "signature": signature,
        "timestamp": timestamp,
        "api_key": cloudinary.config().api_key,
        "cloud_name": cloudinary.config().cloud_name,
        "folder": folder,
    }
