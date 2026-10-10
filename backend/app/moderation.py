import io
import re
import urllib.request
from typing import Optional

import imagehash
from flask import current_app
from PIL import Image

from app.models import Review, ReviewPhoto
from app.models.review import ReviewStatus
from app.models.review_photo import ModerationStatus
from app.points import credit_for_approved_review

MIN_REVIEW_LENGTH = 20
DUPLICATE_HASH_DISTANCE = 5
PHOTO_FETCH_TIMEOUT_SECONDS = 5
MAX_PHOTO_BYTES = 10 * 1024 * 1024

_LINK_PATTERN = re.compile(r"https?://|www\.", re.IGNORECASE)


def is_own_cloudinary_url(url: str) -> bool:
    cloud_name = current_app.config["CLOUDINARY_CLOUD_NAME"]
    return bool(cloud_name) and url.startswith(f"https://res.cloudinary.com/{cloud_name}/")


def review_text_passes(text: Optional[str]) -> bool:
    if not text or len(text.strip()) < MIN_REVIEW_LENGTH:
        return False
    return not _LINK_PATTERN.search(text)


def compute_perceptual_hash(url: str) -> Optional[str]:
    """Returns None when the image can't be fetched or decoded. Callers treat that as
    unverifiable and leave the photo pending, never as a pass."""
    try:
        with urllib.request.urlopen(url, timeout=PHOTO_FETCH_TIMEOUT_SECONDS) as response:
            data = response.read(MAX_PHOTO_BYTES)
        return str(imagehash.phash(Image.open(io.BytesIO(data))))
    except (OSError, ValueError):
        return None


def _is_duplicate(phash: str, photo_id: int) -> bool:
    target = imagehash.hex_to_hash(phash)
    existing = ReviewPhoto.query.filter(
        ReviewPhoto.perceptual_hash.isnot(None),
        ReviewPhoto.is_duplicate.is_(False),
        ReviewPhoto.id != photo_id,
    ).all()
    return any(target - imagehash.hex_to_hash(p.perceptual_hash) <= DUPLICATE_HASH_DISTANCE for p in existing)


def moderate_photo(photo: ReviewPhoto) -> None:
    phash = compute_perceptual_hash(photo.photo_url)
    photo.perceptual_hash = phash
    if phash is None:
        photo.moderation_status = ModerationStatus.pending
    elif _is_duplicate(phash, photo.id):
        photo.is_duplicate = True
        photo.moderation_status = ModerationStatus.rejected
    else:
        photo.moderation_status = ModerationStatus.approved


def auto_approve_if_clean(review: Review) -> None:
    """Approves and credits points only when every check passes. Anything else
    stays pending for the admin queue. Call once the review's photos are final."""
    if review.status != ReviewStatus.pending:
        return
    if not review_text_passes(review.review_text):
        return
    if any(p.moderation_status != ModerationStatus.approved for p in review.photos):
        return
    review.status = ReviewStatus.approved
    credit_for_approved_review(review)
