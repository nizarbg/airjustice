import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PartnerProtectedRoute({ children }) {
  const { isAuthed, user } = useAuth();
  if (!isAuthed) return <Navigate to="/partner/login" replace />;
  if (!user?.role?.startsWith("PARTNER_")) return <Navigate to="/" replace />;
  return children;
}