import { createBrowserRouter } from "react-router-dom";
import Landing from "../pages/Landing";
import Login from "../pages/Login";

import PartnerApply from "../pages/partner/PartnerApply";
import PartnerLogin from "../pages/partner/PartnerLogin";
import PartnerDashboard from "../pages/partner/PartnerDashboard";
import PartnerProtectedRoute from "../auth/PartnerProtectedRoute";
import AdminProtectedRoute from "../auth/AdminProtectedRoute";
import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import CheckFlight from "../pages/CheckFlight";
import Track from "../pages/Track";
import Checkout from "../pages/CheckOut";
import CaseDetails from "../pages/CaseDetails";
import PartnerVerification from "../pages/partner/verfiy/PartnerVerification";

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },

  { path: "/partner/apply", element: <PartnerApply /> },
  { path: "/partner/login", element: <PartnerLogin /> },
  { path: "/partner/verify", element: <PartnerVerification /> },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin/dashboard",
    element: (
      <AdminProtectedRoute>
        <AdminDashboard />
      </AdminProtectedRoute>
    ),
  },
  { path: "/check", element: <CheckFlight /> },
  { path: "/checkout", element: <Checkout /> },
  { path: "/track", element: <Track /> },
  { path: "/case/:trackingCode", element: <CaseDetails /> },
  {
    path: "/partner/dashboard",
    element: (
      <PartnerProtectedRoute>
        <PartnerDashboard />
      </PartnerProtectedRoute>
    ),
  },
]);