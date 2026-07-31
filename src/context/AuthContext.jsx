// Stores the JWT in localStorage and exposes { user, token, login, logout } to the whole app. The Axios instance in api.js reads the token from here via an interceptor so every request is automatically authenticated.

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
const USER_KEY  = "bt_user";

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  });

  function login(newUser) {
    setUser(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
