import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="status">Loading…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
