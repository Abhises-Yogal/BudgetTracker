import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute   from "./components/ProtectedRoute";
import App              from "./App";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import "./index.css";

async function loadRuntimeConfig() {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch('/runtime-config.json', { cache: 'no-store' });
    if (!res.ok) return;
    const cfg = await res.json();
    if (cfg?.VITE_API_URL) {
      window.__API_URL = cfg.VITE_API_URL;
      console.info('Loaded runtime API URL:', cfg.VITE_API_URL);
    }
  } catch (e) {
    // ignore - runtime config is optional
  }
}

(async () => {
  await loadRuntimeConfig();

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected dashboard */}
            <Route path="/" element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </StrictMode>
  );
})();
