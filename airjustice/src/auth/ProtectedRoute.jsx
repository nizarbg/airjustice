import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/partner/login" replace />;
  return children;
}
