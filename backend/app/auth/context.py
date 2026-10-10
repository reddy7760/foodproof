from typing import Optional

import strawberry
from flask import Request, current_app
from graphql import GraphQLError

from app.auth.security import decode_access_token
from app.models import User


def get_current_user(request: Request) -> Optional[User]:
    token = request.cookies.get(current_app.config["AUTH_COOKIE_NAME"])
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer ") :]
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload:
        return None

    return User.query.get(int(payload["sub"]))


def require_user(info: strawberry.types.Info) -> User:
    user = info.context.get("current_user")
    if user is None:
        raise GraphQLError("Authentication required")
    return user


def require_admin(info: strawberry.types.Info) -> User:
    user = require_user(info)
    if not user.is_admin:
        raise GraphQLError("Admin access required")
    return user
