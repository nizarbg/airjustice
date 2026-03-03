import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "../auth/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
