import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Baza üzərindən auth yoxlaması
// name="admin" → admin giriş
// name="unlock" → kilit açma
export async function checkAuth(name, password) {
  try {
    const res = await fetch("http://localhost:5000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [phase, setPhase] = useState(() => {
    return sessionStorage.getItem("appPhase") || "login";
  });

  const [adminConfig, setAdminConfig] = useState(() => {
    const saved = sessionStorage.getItem("adminConfig");
    return saved ? JSON.parse(saved) : null;
  });

  // Admin giriş — bazadan "admin" adlı istifadəçini yoxlayır
  const login = async (password) => {
    const ok = await checkAuth("admin", password);
    if (ok) {
      setPhase("setup");
      sessionStorage.setItem("appPhase", "setup");
    }
    return ok;
  };

  const confirmSetup = (config) => {
    setAdminConfig(config);
    sessionStorage.setItem("adminConfig", JSON.stringify(config));
    setPhase("user");
    sessionStorage.setItem("appPhase", "user");
  };

  const adminLogout = () => {
    setPhase("login");
    sessionStorage.setItem("appPhase", "login");
  };

  return (
    <AuthContext.Provider value={{ phase, adminConfig, login, confirmSetup, adminLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}