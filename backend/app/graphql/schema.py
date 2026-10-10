import strawberry
from flask import Request, Response
from strawberry.flask.views import GraphQLView

from app.auth.context import get_current_user
from app.graphql.mutations import Mutation
from app.graphql.queries import Query

schema = strawberry.Schema(query=Query, mutation=Mutation)


class FoodProofGraphQLView(GraphQLView):
    graphiql = True

    def get_context(self, request: Request, response: Response) -> dict:
        return {
            "request": request,
            "response": response,
            "current_user": get_current_user(request),
        }
