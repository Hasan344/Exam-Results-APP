import { useState, useEffect } from "react";
import { useAuth } from "../../.claude/worktrees/condescending-carson-518c9a/frontend/src/AuthContext";

export default function AdminSetupPage() {
  const { confirmSetup, adminLogout } = useAuth();

  const [sections, setSections] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [examDates, setExamDates] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [examExperts, setExamExperts] = useState([]);

  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [mode, setMode] = useState("main"); // "main" | "appeal"

  const [error, setError] = useState("");

  const isSection3 = selectedSection?.id === 3;

  useEffect(() => {
    fetch("http://localhost:5000/sections")
      .then(r => r.json()).then(setSections).catch(() => {});
    fetch("http://localhost:5000/students/buildings")
      .then(r => r.json()).then(setBuildings).catch(() => {});
    fetch("http://localhost:5000/students/exam-dates")
      .then(r => r.json()).then(setExamDates).catch(() => {});
  }, []);

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

  // section=3 seçiləndə imtahanları yüklə
  useEffect(() => {
    if (!isSection3 || mode !== "main") {
      setExams([]);
      setSelectedExam(null);
      return;
    }
    fetch("http://localhost:5000/exams")
      .then(r => r.json()).then(setExams).catch(() => {});
  }, [isSection3, mode]);

  // Exam seçiləndə bu imtahana təyin olunmuş ekspertləri yüklə
  useEffect(() => {
    if (!selectedExam) {
      setExamExperts([]);
      setSelectedExpert(null);
      return;
    }
    fetch(`http://localhost:5000/exams/${selectedExam.id}/experts`)
      .then(r => r.json()).then(data => {
        setExamExperts(data);
        setSelectedExpert(null);
      }).catch(() => {});
  }, [selectedExam]);

  const handleConfirm = () => {
    if (mode === "main") {
      if (!selectedSection) { setError("Zəhmət olmasa bölmə seçin"); return; }
      if (!selectedSubject) { setError("Zəhmət olmasa fənn seçin"); return; }
      if (isSection3) {
        if (!selectedExam)   { setError("Zəhmət olmasa imtahan seçin"); return; }
        if (!selectedExpert) { setError("Zəhmət olmasa ekspert seçin"); return; }
      }
    }
    if (!selectedBuilding) { setError("Zəhmət olmasa bina seçin"); return; }
    if (!selectedDate) { setError("Zəhmət olmasa tarix seçin"); return; }

    confirmSetup({
      mode,
      section: mode === "main" ? selectedSection : null,
      subject: mode === "main" ? selectedSubject : null,
      building: selectedBuilding,
      date: selectedDate,
      exam: mode === "main" && isSection3 ? selectedExam : null,
      expert: mode === "main" && isSection3 ? selectedExpert : null,
    });
  };

  const expertFullName = (e) =>
    [e.surname, e.name, e.middlename].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
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
          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-3">Rejim</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "main", label: "Ana Sistem" },
                { value: "appeal", label: "Apellyasiya" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setMode(opt.value); setError(""); }}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    mode === opt.value
                      ? "bg-white text-gray-950 border-white"
                      : "bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "main" && (
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Bölmə</label>
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

          {mode === "main" && selectedSection && (
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Fənn</label>
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

          {/* section=3 üçün imtahan seçimi */}
          {mode === "main" && isSection3 && (
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">İmtahan</label>
              {exams.length === 0 ? (
                <p className="text-white/30 text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  İmtahan tapılmadı — əvvəlcə admin panelindən əlavə edin
                </p>
              ) : (
                <select
                  value={selectedExam?.id ?? ""}
                  onChange={(e) => {
                    setSelectedExam(exams.find(x => x.id === Number(e.target.value)) || null);
                    setError("");
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors text-sm appearance-none"
                >
                  <option value="" disabled className="bg-gray-900">İmtahan seçin</option>
                  {exams.map(x => (
                    <option key={x.id} value={x.id} className="bg-gray-900">{x.Name} — {x.Date}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* section=3 üçün ekspert seçimi */}
          {mode === "main" && isSection3 && selectedExam && (
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Ekspert</label>
              {examExperts.length === 0 ? (
                <p className="text-white/30 text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  Bu imtahana heç bir ekspert təyin olunmayıb
                </p>
              ) : (
                <select
                  value={selectedExpert?.id ?? ""}
                  onChange={(e) => {
                    setSelectedExpert(examExperts.find(x => x.id === Number(e.target.value)) || null);
                    setError("");
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors text-sm appearance-none"
                >
                  <option value="" disabled className="bg-gray-900">Ekspert seçin</option>
                  {examExperts.map(e => (
                    <option key={e.id} value={e.id} className="bg-gray-900">{expertFullName(e)}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Bina</label>
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

          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">İmtahan tarixi</label>
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

          {error && <p className="text-red-400 text-sm">{error}</p>}

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
