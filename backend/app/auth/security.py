from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from flask import current_app
from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _pwd_context.verify(password, password_hash)


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(seconds=current_app.config["JWT_EXPIRES_SECONDS"]),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm=current_app.config["JWT_ALGORITHM"])


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(
            token,
            current_app.config["JWT_SECRET_KEY"],
            algorithms=[current_app.config["JWT_ALGORITHM"]],
        )
    except jwt.PyJWTError:
        return None
