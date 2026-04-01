import { useState } from "react";
import MainPage from "./MainPage";
import AppealPage from "./AppealPage";
import ResultsPage from "./ResultsPage";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

function App() {
  const [selectedSubject, setSelectedSubject] = useState(() => {
    const saved = sessionStorage.getItem("selectedSubject");
    return saved ? JSON.parse(saved) : null;
  });

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    sessionStorage.setItem("selectedSubject", JSON.stringify(subject));
  };

  return (
    <BrowserRouter>
  <nav className="bg-gray-950 border-b border-white/10 px-6 py-3 flex justify-center gap-2">
    <NavLink
      to="/"
      className={({ isActive }) =>
        `px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive ? "bg-white text-gray-950" : "text-white/60 hover:text-white hover:bg-white/10"
        }`
      }
    >
      Ana Sistem
    </NavLink>
    <NavLink
      to="/appeal"
      className={({ isActive }) =>
        `px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive ? "bg-white text-gray-950" : "text-white/60 hover:text-white hover:bg-white/10"
        }`
      }
    >
      Appeal
    </NavLink>
    <NavLink
      to={`/results${selectedSubject ? `?subjectId=${selectedSubject.id}` : ""}`}
      className={({ isActive }) =>
        `px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive ? "bg-white text-gray-950" : "text-white/60 hover:text-white hover:bg-white/10"
        }`
      }
    >
      Nəticələr
    </NavLink>
  </nav>

      <Routes>
        <Route
          path="/"
          element={
            <MainPage
              onSubjectSelect={handleSubjectSelect}
              persistedSubject={selectedSubject}
            />
          }
        />
        <Route path="/appeal" element={<AppealPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;