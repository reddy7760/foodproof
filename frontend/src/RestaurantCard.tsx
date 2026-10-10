import { useMutation } from "@apollo/client";
import { useAuth } from "./AuthContext";
import { VOTE_HELPFUL_MUTATION } from "./queries";
import type { Restaurant } from "./types";
import type { VoteHelpfulMutation, VoteHelpfulMutationVariables } from "./generated/graphql";

const PRICE_SYMBOLS = ["", " ₹", " ₹", " ₹", " ₹"];

function ReviewHelpfulButton({ review }: { review: Restaurant["reviews"][number] }) {
  const { user } = useAuth();
  const [voteHelpful, { loading }] = useMutation<VoteHelpfulMutation, VoteHelpfulMutationVariables>(
    VOTE_HELPFUL_MUTATION,
  );

  if (!user || user.id === review.userId) {
    return (
      <span className="review-list__helpful review-list__helpful--static">
        {review.helpfulCount} found this helpful
      </span>
    );
  }

  return (
    <button
      type="button"
      className={
        review.hasVotedHelpful
          ? "review-list__helpful review-list__helpful--active"
          : "review-list__helpful"
      }
      disabled={loading}
      onClick={() => voteHelpful({ variables: { reviewId: review.id } })}
    >
      👍 Helpful{review.helpfulCount > 0 ? ` (${review.helpfulCount})` : ""}
    </button>
  );
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <article className="restaurant-card">
      <header className="restaurant-card__header">
        <h2>{restaurant.name}</h2>
        <span className="restaurant-card__rating">
          {restaurant.avgRating > 0 ? `★ ${restaurant.avgRating.toFixed(1)}` : "No ratings yet"}
        </span>
      </header>
      <p className="restaurant-card__meta">
        {restaurant.city}
        {restaurant.address ? ` · ${restaurant.address}` : ""}
        {restaurant.priceRange ? ` · ${PRICE_SYMBOLS[restaurant.priceRange]}` : ""}
      </p>
      <ul className="dish-list">
        {restaurant.dishes.map((dish) => (
          <li key={dish.id} className="dish-list__item">
            <span className="dish-list__name">{dish.name}</span>
            {dish.category && <span className="dish-list__category">{dish.category}</span>}
            {dish.avgPrice != null && <span className="dish-list__price">₹{dish.avgPrice}</span>}
          </li>
        ))}
      </ul>

      {restaurant.reviews.length > 0 && (
        <ul className="review-list">
          {restaurant.reviews.map((review) => (
            <li key={review.id} className="review-list__item">
              <div className="review-list__header">
                <span className="review-list__rating">{"★".repeat(review.rating)}</span>
                <span className="review-list__author">{review.userName}</span>
                {review.dishName && <span className="review-list__dish">· {review.dishName}</span>}
              </div>
              {review.reviewText && <p className="review-list__text">{review.reviewText}</p>}
              {review.photos.length > 0 && (
                <div className="review-list__photos">
                  {review.photos.map((photo) => (
                    <img key={photo.id} src={photo.photoUrl} alt="Review upload" />
                  ))}
                </div>
              )}
              <ReviewHelpfulButton review={review} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
