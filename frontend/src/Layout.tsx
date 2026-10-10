import { useQuery } from "@apollo/client";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { MY_POINTS_BALANCE_QUERY } from "./queries";
import type { MyPointsBalanceQuery } from "./generated/graphql";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: pointsData } = useQuery<MyPointsBalanceQuery>(MY_POINTS_BALANCE_QUERY, {
    skip: !user,
    fetchPolicy: "cache-and-network",
  });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-row">
          <div>
            <h1>
              <Link to="/">FoodProof</Link>
            </h1>
            <p>Dish-level reviews from real visits.</p>
          </div>
          <nav className="app__nav">
            <Link to="/rewards">Rewards</Link>
            {user ? (
              <>
                <Link to="/reviews/new">Write a review</Link>
                {user.isAdmin && <Link to="/admin">Admin</Link>}
                <span className="app__nav-points">{pointsData?.myPointsBalance ?? 0} pts</span>
                <span className="app__nav-user">{user.name}</span>
                <button type="button" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link to="/signup">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
