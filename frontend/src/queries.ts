import { gql } from "@apollo/client";

export const RESTAURANTS_QUERY = gql`
  query Restaurants($city: String, $search: String) {
    restaurants(city: $city, search: $search) {
      id
      name
      city
      address
      priceRange
      avgRating
      dishes {
        id
        name
        category
        avgRating
        avgPrice
      }
      reviews {
        id
        userId
        userName
        dishName
        rating
        reviewText
        createdAt
        helpfulCount
        hasVotedHelpful
        photos {
          id
          photoUrl
        }
      }
    }
  }
`;

export const RESTAURANT_FILTER_OPTIONS_QUERY = gql`
  query RestaurantFilterOptions {
    restaurants {
      id
      name
      city
      address
    }
  }
`;

export const VOTE_HELPFUL_MUTATION = gql`
  mutation VoteHelpful($reviewId: Int!) {
    voteHelpful(reviewId: $reviewId) {
      id
      helpfulCount
      hasVotedHelpful
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      phone
      isAdmin
    }
  }
`;

export const MY_POINTS_BALANCE_QUERY = gql`
  query MyPointsBalance {
    myPointsBalance
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup($name: String!, $email: String!, $password: String!, $phone: String) {
    signup(name: $name, email: $email, password: $password, phone: $phone) {
      user {
        id
        name
        email
        phone
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        name
        email
        phone
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const CREATE_REVIEW_MUTATION = gql`
  mutation CreateReview(
    $restaurantId: Int!
    $rating: Int!
    $dishId: Int
    $reviewText: String
    $pricePaid: Float
    $photoUrl: String
  ) {
    createReview(
      restaurantId: $restaurantId
      rating: $rating
      dishId: $dishId
      reviewText: $reviewText
      pricePaid: $pricePaid
      photoUrl: $photoUrl
    ) {
      id
      status
      rating
      reviewText
      pricePaid
      dishId
      restaurantId
      photos {
        id
        moderationStatus
      }
    }
  }
`;

export const CLOUDINARY_UPLOAD_SIGNATURE_QUERY = gql`
  query CloudinaryUploadSignature {
    cloudinaryUploadSignature {
      signature
      timestamp
      apiKey
      cloudName
      folder
    }
  }
`;

export const RESTAURANTS_FOR_REVIEW_QUERY = gql`
  query RestaurantsForReview {
    restaurants {
      id
      name
      dishes {
        id
        name
      }
    }
  }
`;

export const PENDING_REVIEWS_QUERY = gql`
  query PendingReviews {
    pendingReviews {
      id
      userName
      userEmail
      restaurantName
      dishName
      rating
      reviewText
      pricePaid
      createdAt
      photos {
        id
        photoUrl
        moderationStatus
      }
    }
  }
`;

export const APPROVE_REVIEW_MUTATION = gql`
  mutation ApproveReview($reviewId: Int!) {
    approveReview(reviewId: $reviewId) {
      id
      status
    }
  }
`;

export const REJECT_REVIEW_MUTATION = gql`
  mutation RejectReview($reviewId: Int!) {
    rejectReview(reviewId: $reviewId) {
      id
      status
    }
  }
`;

export const REWARDS_QUERY = gql`
  query Rewards {
    rewards {
      id
      title
      pointsCost
      stock
      restaurantName
    }
  }
`;

export const MY_REDEMPTIONS_QUERY = gql`
  query MyRedemptions {
    myRedemptions {
      id
      rewardTitle
      pointsSpent
      redeemedAt
      status
    }
  }
`;

export const REDEEM_REWARD_MUTATION = gql`
  mutation RedeemReward($rewardId: Int!) {
    redeemReward(rewardId: $rewardId) {
      id
      status
      pointsSpent
      rewardTitle
    }
  }
`;
