import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "../auth/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </LanguageProvider>
  );
}
