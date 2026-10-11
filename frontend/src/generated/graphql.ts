export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Date with time (isoformat) */
  DateTime: { input: string; output: string; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  user: User;
};

export type CloudinarySignature = {
  __typename?: 'CloudinarySignature';
  apiKey: Scalars['String']['output'];
  cloudName: Scalars['String']['output'];
  folder: Scalars['String']['output'];
  signature: Scalars['String']['output'];
  timestamp: Scalars['Int']['output'];
};

export type Dish = {
  __typename?: 'Dish';
  avgPrice?: Maybe<Scalars['Float']['output']>;
  avgRating: Scalars['Float']['output'];
  category?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  approveReview: Review;
  attachReviewPhoto: ReviewPhoto;
  createReview: Review;
  login: AuthPayload;
  logout: Scalars['Boolean']['output'];
  redeemReward: Redemption;
  rejectReview: Review;
  signup: AuthPayload;
  voteHelpful: Review;
};


export type MutationApproveReviewArgs = {
  reviewId: Scalars['Int']['input'];
};


export type MutationAttachReviewPhotoArgs = {
  photoUrl: Scalars['String']['input'];
  reviewId: Scalars['Int']['input'];
};


export type MutationCreateReviewArgs = {
  dishId?: InputMaybe<Scalars['Int']['input']>;
  photoUrl?: InputMaybe<Scalars['String']['input']>;
  pricePaid?: InputMaybe<Scalars['Float']['input']>;
  rating: Scalars['Int']['input'];
  restaurantId: Scalars['Int']['input'];
  reviewText?: InputMaybe<Scalars['String']['input']>;
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRedeemRewardArgs = {
  rewardId: Scalars['Int']['input'];
};


export type MutationRejectReviewArgs = {
  reviewId: Scalars['Int']['input'];
};


export type MutationSignupArgs = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
};


export type MutationVoteHelpfulArgs = {
  reviewId: Scalars['Int']['input'];
};

export type PointsLedgerEntry = {
  __typename?: 'PointsLedgerEntry';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  points: Scalars['Int']['output'];
  reason: Scalars['String']['output'];
  reviewId?: Maybe<Scalars['Int']['output']>;
};

export type Query = {
  __typename?: 'Query';
  cloudinaryUploadSignature: CloudinarySignature;
  dish?: Maybe<Dish>;
  me?: Maybe<User>;
  myPointsBalance: Scalars['Int']['output'];
  myPointsHistory: Array<PointsLedgerEntry>;
  myRedemptions: Array<Redemption>;
  pendingReviews: Array<Review>;
  restaurant?: Maybe<Restaurant>;
  restaurants: Array<Restaurant>;
  rewards: Array<Reward>;
};


export type QueryDishArgs = {
  id: Scalars['Int']['input'];
};


export type QueryRestaurantArgs = {
  id: Scalars['Int']['input'];
};


export type QueryRestaurantsArgs = {
  city?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type Redemption = {
  __typename?: 'Redemption';
  id: Scalars['Int']['output'];
  pointsSpent: Scalars['Int']['output'];
  redeemedAt: Scalars['DateTime']['output'];
  rewardId: Scalars['Int']['output'];
  rewardTitle: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type Restaurant = {
  __typename?: 'Restaurant';
  address?: Maybe<Scalars['String']['output']>;
  avgRating: Scalars['Float']['output'];
  city: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  dishes: Array<Dish>;
  id: Scalars['Int']['output'];
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  priceRange?: Maybe<Scalars['Int']['output']>;
  reviews: Array<Review>;
};

export type Review = {
  __typename?: 'Review';
  createdAt: Scalars['DateTime']['output'];
  dishId?: Maybe<Scalars['Int']['output']>;
  dishName?: Maybe<Scalars['String']['output']>;
  hasVotedHelpful: Scalars['Boolean']['output'];
  helpfulCount: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  isVerifiedVisit: Scalars['Boolean']['output'];
  photos: Array<ReviewPhoto>;
  pricePaid?: Maybe<Scalars['Float']['output']>;
  rating: Scalars['Int']['output'];
  restaurantId: Scalars['Int']['output'];
  restaurantName: Scalars['String']['output'];
  reviewText?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  userEmail: Scalars['String']['output'];
  userId: Scalars['Int']['output'];
  userName: Scalars['String']['output'];
};

export type ReviewPhoto = {
  __typename?: 'ReviewPhoto';
  id: Scalars['Int']['output'];
  moderationStatus: Scalars['String']['output'];
  photoUrl: Scalars['String']['output'];
  reviewId: Scalars['Int']['output'];
};

export type Reward = {
  __typename?: 'Reward';
  id: Scalars['Int']['output'];
  pointsCost: Scalars['Int']['output'];
  restaurantId?: Maybe<Scalars['Int']['output']>;
  restaurantName?: Maybe<Scalars['String']['output']>;
  stock: Scalars['Int']['output'];
  title: Scalars['String']['output'];
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  isAdmin: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
};

export type RestaurantsQueryVariables = Exact<{
  city?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type RestaurantsQuery = { __typename?: 'Query', restaurants: Array<{ __typename?: 'Restaurant', id: number, name: string, city: string, address?: string | null, priceRange?: number | null, avgRating: number, dishes: Array<{ __typename?: 'Dish', id: number, name: string, category?: string | null, avgRating: number, avgPrice?: number | null }>, reviews: Array<{ __typename?: 'Review', id: number, userId: number, userName: string, dishName?: string | null, rating: number, reviewText?: string | null, createdAt: string, helpfulCount: number, hasVotedHelpful: boolean, photos: Array<{ __typename?: 'ReviewPhoto', id: number, photoUrl: string }> }> }> };

export type RestaurantFilterOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type RestaurantFilterOptionsQuery = { __typename?: 'Query', restaurants: Array<{ __typename?: 'Restaurant', id: number, name: string, city: string, address?: string | null }> };

export type VoteHelpfulMutationVariables = Exact<{
  reviewId: Scalars['Int']['input'];
}>;


export type VoteHelpfulMutation = { __typename?: 'Mutation', voteHelpful: { __typename?: 'Review', id: number, helpfulCount: number, hasVotedHelpful: boolean } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: number, name: string, email: string, phone?: string | null, isAdmin: boolean } | null };

export type MyPointsBalanceQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPointsBalanceQuery = { __typename?: 'Query', myPointsBalance: number };

export type SignupMutationVariables = Exact<{
  name: Scalars['String']['input'];
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
}>;


export type SignupMutation = { __typename?: 'Mutation', signup: { __typename?: 'AuthPayload', user: { __typename?: 'User', id: number, name: string, email: string, phone?: string | null } } };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', user: { __typename?: 'User', id: number, name: string, email: string, phone?: string | null } } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type CreateReviewMutationVariables = Exact<{
  restaurantId: Scalars['Int']['input'];
  rating: Scalars['Int']['input'];
  dishId?: InputMaybe<Scalars['Int']['input']>;
  reviewText?: InputMaybe<Scalars['String']['input']>;
  pricePaid?: InputMaybe<Scalars['Float']['input']>;
  photoUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateReviewMutation = { __typename?: 'Mutation', createReview: { __typename?: 'Review', id: number, status: string, rating: number, reviewText?: string | null, pricePaid?: number | null, dishId?: number | null, restaurantId: number, photos: Array<{ __typename?: 'ReviewPhoto', id: number, moderationStatus: string }> } };

export type CloudinaryUploadSignatureQueryVariables = Exact<{ [key: string]: never; }>;


export type CloudinaryUploadSignatureQuery = { __typename?: 'Query', cloudinaryUploadSignature: { __typename?: 'CloudinarySignature', signature: string, timestamp: number, apiKey: string, cloudName: string, folder: string } };

export type RestaurantsForReviewQueryVariables = Exact<{ [key: string]: never; }>;


export type RestaurantsForReviewQuery = { __typename?: 'Query', restaurants: Array<{ __typename?: 'Restaurant', id: number, name: string, dishes: Array<{ __typename?: 'Dish', id: number, name: string }> }> };

export type PendingReviewsQueryVariables = Exact<{ [key: string]: never; }>;


export type PendingReviewsQuery = { __typename?: 'Query', pendingReviews: Array<{ __typename?: 'Review', id: number, userName: string, userEmail: string, restaurantName: string, dishName?: string | null, rating: number, reviewText?: string | null, pricePaid?: number | null, createdAt: string, photos: Array<{ __typename?: 'ReviewPhoto', id: number, photoUrl: string, moderationStatus: string }> }> };

export type ApproveReviewMutationVariables = Exact<{
  reviewId: Scalars['Int']['input'];
}>;


export type ApproveReviewMutation = { __typename?: 'Mutation', approveReview: { __typename?: 'Review', id: number, status: string } };

export type RejectReviewMutationVariables = Exact<{
  reviewId: Scalars['Int']['input'];
}>;


export type RejectReviewMutation = { __typename?: 'Mutation', rejectReview: { __typename?: 'Review', id: number, status: string } };

export type RewardsQueryVariables = Exact<{ [key: string]: never; }>;


export type RewardsQuery = { __typename?: 'Query', rewards: Array<{ __typename?: 'Reward', id: number, title: string, pointsCost: number, stock: number, restaurantName?: string | null }> };

export type MyRedemptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyRedemptionsQuery = { __typename?: 'Query', myRedemptions: Array<{ __typename?: 'Redemption', id: number, rewardTitle: string, pointsSpent: number, redeemedAt: string, status: string }> };

export type RedeemRewardMutationVariables = Exact<{
  rewardId: Scalars['Int']['input'];
}>;


export type RedeemRewardMutation = { __typename?: 'Mutation', redeemReward: { __typename?: 'Redemption', id: number, status: string, pointsSpent: number, rewardTitle: string } };
