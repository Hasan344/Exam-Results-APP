import { Routes, Route, NavLink } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import AdminSetupPage from "./AdminSetupPage";
import MainPage from "./MainPage";
import AppealPage from "./AppealPage";
import ResultsPage from "./ResultsPage";

function AppShell() {
  const { phase, adminConfig, adminLogout } = useAuth();

  if (phase === "login") {
    return <LoginPage />;
  }

  if (phase === "setup") {
    return <AdminSetupPage />;
  }

  const isAppeal = adminConfig?.mode === "appeal";

  return (
    <>
      <nav className="bg-gray-950 border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-white text-gray-950" : "text-white/60 hover:text-white hover:bg-white/10"
              }`
            }
          >
            {isAppeal ? "Apellyasiya" : "Ana Sistem"}
          </NavLink>
          <NavLink
            to="/results"
            className={({ isActive }) =>
              `px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-white text-gray-950" : "text-white/60 hover:text-white hover:bg-white/10"
              }`
            }
          >
            Nəticələr
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/40">
            <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">
              {adminConfig?.building?.name}
            </span>
            <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">
              {adminConfig?.date}
            </span>
            {adminConfig?.subject && (
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                {adminConfig.subject.Name}
              </span>
            )}
          </div>
          <button
            onClick={adminLogout}
            title="Admin olaraq giriş et"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Admin
          </button>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            isAppeal
              ? <AppealPage config={adminConfig} />
              : <MainPage config={adminConfig} />
          }
        />
        <Route
          path="/results"
          element={<ResultsPage config={adminConfig} />}
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}