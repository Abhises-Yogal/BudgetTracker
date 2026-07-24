// Wraps any route that requires authentication.
// If there's no token in context, redirects to /login immediately, preserving the attempted URL so we can send the user back after login.

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location  = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
