import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export default function AdminSetupPage() {
  const { confirmSetup, adminLogout } = useAuth();

  const [sections, setSections] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [examDates, setExamDates] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [mode, setMode] = useState("main"); // "main" | "appeal"

  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/sections")
      .then(r => r.json()).then(setSections).catch(() => {});
    fetch("http://localhost:5000/students/buildings")
      .then(r => r.json()).then(setBuildings).catch(() => {});
    fetch("http://localhost:5000/students/exam-dates")
      .then(r => r.json()).then(setExamDates).catch(() => {});
  }, []);

  // Section seçiləndə həmin section-a aid subject-ləri gətir
  useEffect(() => {
    if (!selectedSection) {
      setSubjects([]);
      setSelectedSubject(null);
      return;
    }
    fetch(`http://localhost:5000/sections/${selectedSection.id}/subjects`)
      .then(r => r.json())
      .then(data => {
        setSubjects(data);
        setSelectedSubject(null);
      })
      .catch(() => {});
  }, [selectedSection]);

  const handleConfirm = () => {
    if (mode === "main") {
      if (!selectedSection) { setError("Zəhmət olmasa bölmə seçin"); return; }
      if (!selectedSubject) { setError("Zəhmət olmasa fənn seçin"); return; }
    }
    if (!selectedBuilding) { setError("Zəhmət olmasa bina seçin"); return; }
    if (!selectedDate) { setError("Zəhmət olmasa tarix seçin"); return; }

    confirmSetup({
      mode,
      section: mode === "main" ? selectedSection : null,
      subject: mode === "main" ? selectedSubject : null,
      building: selectedBuilding,
      date: selectedDate,
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Parametrləri Seçin</h1>
            <p className="text-white/40 text-sm mt-0.5">Admin konfiqurasiyası</p>
          </div>
          <button
            onClick={adminLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Çıxış
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm flex flex-col gap-5">
          {/* Mode selector */}
          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-3">
              Rejim
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "main",
                  label: "Ana Sistem",
                  icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                },
                {
                  value: "appeal",
                  label: "Apellyasiya",
                  icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setMode(opt.value); setError(""); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    mode === opt.value
                      ? "bg-white text-gray-950 border-white"
                      : "bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                  </svg>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section (only for main mode) */}
          {mode === "main" && (
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                Bölmə
              </label>
              <select
                value={selectedSection?.id ?? ""}
                onChange={(e) => {
                  setSelectedSection(sections.find(s => s.id === Number(e.target.value)) || null);
                  setError("");
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors text-sm appearance-none"
              >
                <option value="" disabled className="bg-gray-900">Bölmə seçin</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subject (only for main mode, only after section selected) */}
          {mode === "main" && selectedSection && (
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                Fənn
              </label>
              {subjects.length === 0 ? (
                <p className="text-white/30 text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  Bu bölməyə aid fənn tapılmadı
                </p>
              ) : (
                <select
                  value={selectedSubject?.id ?? ""}
                  onChange={(e) => {
                    setSelectedSubject(subjects.find(s => s.id === Number(e.target.value)) || null);
                    setError("");
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors text-sm appearance-none"
                >
                  <option value="" disabled className="bg-gray-900">Fənn seçin</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id} className="bg-gray-900">{s.Name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Building */}
          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
              Bina
            </label>
            <select
              value={selectedBuilding?.code ?? ""}
              onChange={(e) => {
                setSelectedBuilding(buildings.find(b => b.code === Number(e.target.value)) || null);
                setError("");
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors text-sm appearance-none"
            >
              <option value="" disabled className="bg-gray-900">Bina seçin</option>
              {buildings.map(b => (
                <option key={b.code} value={b.code} className="bg-gray-900">{b.name} ({b.code})</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
              İmtahan tarixi
            </label>
            <select
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setError(""); }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors text-sm appearance-none"
            >
              <option value="" disabled className="bg-gray-900">Tarix seçin</option>
              {examDates.map(d => (
                <option key={d} value={d} className="bg-gray-900">{d}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-xl bg-white text-gray-950 font-semibold text-sm hover:bg-white/90 transition-colors mt-1"
          >
            Təsdiqlə və çıxış et →
          </button>
        </div>
      </div>
    </div>
  );
}