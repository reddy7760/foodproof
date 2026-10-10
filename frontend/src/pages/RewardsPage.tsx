import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  MY_POINTS_BALANCE_QUERY,
  MY_REDEMPTIONS_QUERY,
  REDEEM_REWARD_MUTATION,
  REWARDS_QUERY,
} from "../queries";
import type {
  MyPointsBalanceQuery,
  MyRedemptionsQuery,
  RedeemRewardMutation,
  RedeemRewardMutationVariables,
  RewardsQuery,
} from "../generated/graphql";

export default function RewardsPage() {
  const { user } = useAuth();
  const { data: rewardsData, loading, error } = useQuery<RewardsQuery>(REWARDS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const { data: balanceData } = useQuery<MyPointsBalanceQuery>(MY_POINTS_BALANCE_QUERY, {
    skip: !user,
    fetchPolicy: "cache-and-network",
  });
  const { data: redemptionsData } = useQuery<MyRedemptionsQuery>(MY_REDEMPTIONS_QUERY, {
    skip: !user,
    fetchPolicy: "cache-and-network",
  });

  const [redeemReward] = useMutation<RedeemRewardMutation, RedeemRewardMutationVariables>(
    REDEEM_REWARD_MUTATION,
    {
      refetchQueries: [{ query: REWARDS_QUERY }, { query: MY_POINTS_BALANCE_QUERY }, { query: MY_REDEMPTIONS_QUERY }],
    },
  );

  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  const balance = balanceData?.myPointsBalance ?? 0;

  const handleRedeem = async (rewardId: number) => {
    setRedeemError(null);
    setRedeemingId(rewardId);
    try {
      await redeemReward({ variables: { rewardId } });
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : "Redemption failed");
    } finally {
      setRedeemingId(null);
    }
  };

  const rewards = rewardsData?.rewards ?? [];

  return (
    <div className="rewards-page">
      <h2>Rewards</h2>
      <p className="status">Spend the points you earn from approved reviews on real perks.</p>

      {user && <p className="rewards-page__balance">You have {balance} pts</p>}
      {!user && (
        <p className="status">
          <Link to="/login">Log in</Link> to redeem a reward.
        </p>
      )}

      {loading && !rewardsData && <p className="status">Loading…</p>}
      {error && <p className="status status--error">Failed to load: {error.message}</p>}
      {redeemError && <p className="status status--error">{redeemError}</p>}

      <div className="rewards-grid">
        {rewards.map((reward) => {
          const outOfStock = reward.stock <= 0;
          const notEnoughPoints = user != null && balance < reward.pointsCost;
          const disabled = !user || outOfStock || notEnoughPoints || redeemingId === reward.id;

          let buttonLabel = "Redeem";
          if (!user) buttonLabel = "Log in to redeem";
          else if (outOfStock) buttonLabel = "Out of stock";
          else if (notEnoughPoints) buttonLabel = `Need ${reward.pointsCost - balance} more pts`;
          else if (redeemingId === reward.id) buttonLabel = "Redeeming…";

          return (
            <article key={reward.id} className="reward-card">
              <h3>{reward.title}</h3>
              <p className="reward-card__meta">
                {reward.restaurantName ?? "Any restaurant"} · {reward.pointsCost} pts
              </p>
              <p className="reward-card__stock">{outOfStock ? "Out of stock" : `${reward.stock} left`}</p>
              <button type="button" disabled={disabled} onClick={() => handleRedeem(reward.id)}>
                {buttonLabel}
              </button>
            </article>
          );
        })}
      </div>

      {user && redemptionsData && redemptionsData.myRedemptions.length > 0 && (
        <>
          <h2>Your redemptions</h2>
          <ul className="redemption-list">
            {redemptionsData.myRedemptions.map((r) => (
              <li key={r.id} className="redemption-list__item">
                <span className="redemption-list__title">{r.rewardTitle}</span>
                <span className="redemption-list__meta">
                  -{r.pointsSpent} pts · {r.status} · {new Date(r.redeemedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
