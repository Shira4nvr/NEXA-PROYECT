import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@shein-clone/shared";

export default function RequireRole({ role, children }) {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : user.role === "SELLER" ? "/seller" : "/store"} replace />;
  }
  return children;
}