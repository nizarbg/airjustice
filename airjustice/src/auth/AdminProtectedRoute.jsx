import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AdminProtectedRoute({ children }) {
  const { isAdminAuthed, adminUser } = useAuth();
  if (!isAdminAuthed) return <Navigate to="/admin/login" replace />;
  if (adminUser?.role !== "OWNER_ADMIN") return <Navigate to="/" replace />;
  return children;
}

