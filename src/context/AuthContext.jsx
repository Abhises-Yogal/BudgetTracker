// Stores the JWT in localStorage and exposes { user, token, login, logout } to the whole app. The Axios instance in api.js reads the token from here via an interceptor so every request is automatically authenticated.

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "bt_token";
const USER_KEY  = "bt_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  });

  // Keep localStorage in sync whenever token/user change
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else       localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else      localStorage.removeItem(USER_KEY);
  }, [user]);

  function login(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
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
