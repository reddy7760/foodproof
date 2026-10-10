import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  APPROVE_REVIEW_MUTATION,
  PENDING_REVIEWS_QUERY,
  REJECT_REVIEW_MUTATION,
} from "../queries";
import type {
  ApproveReviewMutation,
  ApproveReviewMutationVariables,
  PendingReviewsQuery,
  RejectReviewMutation,
  RejectReviewMutationVariables,
} from "../generated/graphql";

export default function AdminQueuePage() {
  const { data, loading, error } = useQuery<PendingReviewsQuery>(PENDING_REVIEWS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const refetchOptions = { refetchQueries: [{ query: PENDING_REVIEWS_QUERY }] };
  const [approveReview] = useMutation<ApproveReviewMutation, ApproveReviewMutationVariables>(
    APPROVE_REVIEW_MUTATION,
    refetchOptions,
  );
  const [rejectReview] = useMutation<RejectReviewMutation, RejectReviewMutationVariables>(
    REJECT_REVIEW_MUTATION,
    refetchOptions,
  );

  const handle = async (action: "approve" | "reject", reviewId: number) => {
    setActionError(null);
    setPendingId(reviewId);
    try {
      if (action === "approve") {
        await approveReview({ variables: { reviewId } });
      } else {
        await rejectReview({ variables: { reviewId } });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setPendingId(null);
    }
  };

  const reviews = data?.pendingReviews ?? [];

  return (
    <div className="admin-page">
      <h2>Pending reviews</h2>

      {loading && !data && <p className="status">Loading…</p>}
      {error && <p className="status status--error">Failed to load: {error.message}</p>}
      {actionError && <p className="status status--error">{actionError}</p>}
      {data && reviews.length === 0 && <p className="status">Nothing waiting on review.</p>}

      <div className="admin-queue">
        {reviews.map((review) => (
          <article key={review.id} className="admin-card">
            <header className="admin-card__header">
              <div>
                <strong>{review.restaurantName}</strong>
                {review.dishName && <span> · {review.dishName}</span>}
              </div>
              <span className="admin-card__rating">{"★".repeat(review.rating)}</span>
            </header>
            <p className="admin-card__meta">
              {review.userName} ({review.userEmail}) ·{" "}
              {new Date(review.createdAt).toLocaleString()}
              {review.pricePaid != null && ` · ₹${review.pricePaid}`}
            </p>
            {review.reviewText && <p className="admin-card__text">{review.reviewText}</p>}
            {review.photos.length > 0 && (
              <div className="admin-card__photos">
                {review.photos.map((photo) => (
                  <figure key={photo.id} className="admin-card__photo">
                    <img src={photo.photoUrl} alt="Review upload" />
                    <figcaption>{photo.moderationStatus}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            <div className="admin-card__actions">
              <button
                type="button"
                className="admin-card__approve"
                disabled={pendingId === review.id}
                onClick={() => handle("approve", review.id)}
              >
                Approve
              </button>
              <button
                type="button"
                className="admin-card__reject"
                disabled={pendingId === review.id}
                onClick={() => handle("reject", review.id)}
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
