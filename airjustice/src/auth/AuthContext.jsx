import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [adminToken, setAdminToken] = useState(() =>
    localStorage.getItem("adminToken")
  );
  const [adminUser, setAdminUser] = useState(() => {
    const raw = localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  });

  const login = ({ token, user }) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const loginAdmin = ({ token, user }) => {
    setAdminToken(token);
    setAdminUser(user);
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminUser", JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const logoutAdmin = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthed: !!token,
      login,
      logout,
      adminToken,
      adminUser,
      isAdminAuthed: !!adminToken,
      loginAdmin,
      logoutAdmin,
    }),
    [token, user, adminToken, adminUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
