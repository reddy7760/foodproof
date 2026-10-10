import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAdmin({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="status">Loading…</p>;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;
  return children;
}
