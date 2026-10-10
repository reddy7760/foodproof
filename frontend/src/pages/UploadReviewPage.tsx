import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  CLOUDINARY_UPLOAD_SIGNATURE_QUERY,
  CREATE_REVIEW_MUTATION,
  RESTAURANTS_FOR_REVIEW_QUERY,
} from "../queries";
import type {
  CloudinaryUploadSignatureQuery,
  CreateReviewMutation,
  CreateReviewMutationVariables,
  RestaurantsForReviewQuery,
} from "../generated/graphql";

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

const reviewSchema = z.object({
  restaurantId: z.coerce.number({ invalid_type_error: "Select a restaurant" }).int().positive(),
  dishId: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  reviewText: z.string().max(2000).optional(),
  pricePaid: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
});

type ReviewForm = z.infer<typeof reviewSchema>;

export default function UploadReviewPage() {
  const { data: restaurantsData } = useQuery<RestaurantsForReviewQuery>(RESTAURANTS_FOR_REVIEW_QUERY);
  const [fetchSignature] = useLazyQuery<CloudinaryUploadSignatureQuery>(
    CLOUDINARY_UPLOAD_SIGNATURE_QUERY,
    { fetchPolicy: "network-only" },
  );
  const [createReview] = useMutation<CreateReviewMutation, CreateReviewMutationVariables>(
    CREATE_REVIEW_MUTATION,
  );

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateReviewMutation["createReview"] | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReviewForm>({ resolver: zodResolver(reviewSchema) });

  const restaurants = restaurantsData?.restaurants ?? [];
  const selectedRestaurantId = watch("restaurantId");
  const dishes = restaurants.find((r) => r.id === Number(selectedRestaurantId))?.dishes ?? [];

  useEffect(() => {
    setValue("dishId", undefined);
  }, [selectedRestaurantId, setValue]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const { data } = await fetchSignature();
      const sig = data?.cloudinaryUploadSignature;
      if (!sig) throw new Error("Could not get an upload signature");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload to Cloudinary failed");
      const uploaded = (await res.json()) as { secure_url: string };
      setPhotoUrl(uploaded.secure_url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: ReviewForm) => {
    setServerError(null);
    try {
      const { data } = await createReview({
        variables: {
          restaurantId: values.restaurantId,
          dishId: values.dishId ?? null,
          rating: values.rating,
          reviewText: values.reviewText || null,
          pricePaid: values.pricePaid ?? null,
          photoUrl,
        },
      });
      setResult(data?.createReview ?? null);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to submit review");
    }
  };

  if (result) {
    const photoRejected = result.photos.some((p) => p.moderationStatus === "rejected");
    return (
      <div className="review-page">
        <h2>Thanks for your review!</h2>
        {result.status === "approved" ? (
          <p className="status">Your review is live, and you've earned points.</p>
        ) : (
          <p className="status">
            Your review is pending a manual check before it goes live.
          </p>
        )}
        {photoRejected && (
          <p className="status status--error">
            Your photo matches one already on FoodProof, so it was flagged as a duplicate.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="review-page">
      <h2>Write a review</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Restaurant
          <select {...register("restaurantId")} defaultValue="">
            <option value="" disabled>
              Select a restaurant
            </option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {errors.restaurantId && <span className="field-error">{errors.restaurantId.message}</span>}
        </label>

        <label>
          Dish (optional)
          <select {...register("dishId")} defaultValue="">
            <option value="">Restaurant-level review</option>
            {dishes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <div className="rating-input">
              <span>Rating</span>
              <div className="rating-input__stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={field.value >= star ? "star star--filled" : "star"}
                    onClick={() => field.onChange(star)}
                    aria-label={`${star} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {errors.rating && <span className="field-error">{errors.rating.message}</span>}
            </div>
          )}
        />

        <label>
          Review
          <textarea rows={4} {...register("reviewText")} />
        </label>

        <label>
          Price paid (optional)
          <input type="number" step="0.01" min="0" {...register("pricePaid")} />
        </label>

        <label>
          Photo (optional)
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        </label>
        {uploading && <p className="status">Uploading photo…</p>}
        {uploadError && <p className="status status--error">{uploadError}</p>}
        {photoUrl && <img className="review-page__preview" src={photoUrl} alt="Review upload preview" />}

        {serverError && <p className="status status--error">{serverError}</p>}
        <button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </div>
  );
}
