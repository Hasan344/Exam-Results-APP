import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { API_BASE } from "./api";

function ImportCard({ title, endpoint, columns, accept = ".xlsx,.xls,.csv" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ ok: false, message: data.message || "Xəta baş verdi" });
      } else {
        setResult({
          ok: true,
          message: data.message || "Tamam",
          inserted: data.inserted ?? 0,
          failed: data.failed ?? 0,
          errors: data.errors ?? [],
        });
      }
    } catch (err) {
      setResult({ ok: false, message: err.message || "Şəbəkə xətası" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-white/40 text-xs mt-0.5">
            Sütunlar:{" "}
            {columns.map((c, i) => (
              <span key={c.name}>
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[11px]">
                  {c.name}
                </code>
                {c.required && <span className="text-red-400 ml-0.5">*</span>}
                {i < columns.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={busy}
          className="hidden"
          id={`import-${endpoint}`}
        />
        <label
          htmlFor={`import-${endpoint}`}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-center cursor-pointer transition-colors ${
            busy
              ? "bg-white/5 text-white/30 cursor-not-allowed"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {busy ? "Yüklənir…" : "Fayl seç"}
        </label>
      </div>
      {result && (
        <div className={`mt-3 text-xs px-3 py-2 rounded-xl ${result.ok ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
          {result.message}
          {result.ok && result.inserted > 0 && ` · ${result.inserted} əlavə edildi`}
          {result.ok && result.failed > 0 && ` · ${result.failed} xəta`}
          {result.errors?.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer opacity-70">Detallar</summary>
              <ul className="mt-1 space-y-0.5 opacity-80">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSetupPage() {
  const { confirmSetup, adminLogout } = useAuth();

  const [sections, setSections] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [examDates, setExamDates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [exams, setExams] = useState([]);

  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [mode, setMode] = useState("main");

  const [error, setError] = useState("");
  const [showImports, setShowImports] = useState(false);

  const isSection3 = selectedSection?.id === 3;

  useEffect(() => {
    fetch(`${API_BASE}/sections`)
      .then(r => r.json()).then(setSections).catch(() => {});
    fetch(`${API_BASE}/students/buildings`)
      .then(r => r.json()).then(setBuildings).catch(() => {});
    fetch(`${API_BASE}/students/exam-dates`)
      .then(r => r.json()).then(setExamDates).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSection) {
      setExercises([]);
      setSelectedExercise(null);
      return;
    }
    fetch(`${API_BASE}/sections/${selectedSection.id}/exercises`)
      .then(r => r.json())
      .then(data => {
        setExercises(data);
        setSelectedExercise(null);
      })
      .catch(() => {});
  }, [selectedSection]);

  useEffect(() => {
    if (!isSection3 || mode !== "main") {
      setExams([]);
      setSelectedExam(null);
      return;
    }
    fetch(`${API_BASE}/exams`)
      .then(r => r.json()).then(setExams).catch(() => {});
  }, [isSection3, mode]);

  const handleConfirm = () => {
    if (mode === "main") {
      if (!selectedSection)  { setError("Zəhmət olmasa bölmə seçin"); return; }
      if (!selectedExercise) { setError("Zəhmət olmasa hərəkət seçin"); return; }
      if (isSection3 && !selectedExam) { setError("Zəhmət olmasa imtahan seçin"); return; }
    }
    if (!selectedBuilding) { setError("Zəhmət olmasa bina seçin"); return; }
    if (!selectedDate)     { setError("Zəhmət olmasa tarix seçin"); return; }

    confirmSetup({
      mode,
      section:  mode === "main" ? selectedSection  : null,
      exercise: mode === "main" ? selectedExercise : null,
      building: selectedBuilding,
      date:     selectedDate,
      exam:     mode === "main" && isSection3 ? selectedExam : null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-start justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8 mt-8">
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
          {/* Rejim */}
          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-3">Rejim</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "main",   label: "Ana Sistem" },
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

          {/* Bölmə */}
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

          {/* Hərəkət (Exercise) */}
          {mode === "main" && selectedSection && (
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Hərəkət</label>
              {exercises.length === 0 ? (
                <p className="text-white/30 text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  Bu bölməyə aid hərəkət tapılmadı
                </p>
              ) : (
                <select
                  value={selectedExercise?.id ?? ""}
                  onChange={(e) => {
                    setSelectedExercise(exercises.find(s => s.id === Number(e.target.value)) || null);
                    setError("");
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors text-sm appearance-none"
                >
                  <option value="" disabled className="bg-gray-900">Hərəkət seçin</option>
                  {exercises.map(s => (
                    <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* İmtahan (section=3) */}
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

          {/* Bina */}
          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Bina</label>
            <select
              value={selectedBuilding?.code ?? ""}
              onChange={(e) => {
                setSelectedBuilding(buildings.find(b => b.code === e.target.value) || null);
                setError("");
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors text-sm appearance-none"
            >
              <option value="" disabled className="bg-gray-900">Bina seçin</option>
              {buildings.map(b => (
                <option key={b.code} value={b.code} className="bg-gray-900">{b.name}</option>
              ))}
            </select>
          </div>

          {/* Tarix */}
          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Tarix</label>
            {examDates.length === 0 ? (
              <p className="text-white/30 text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                Tarix tapılmadı
              </p>
            ) : (
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
            )}
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-white text-gray-950 font-semibold text-sm hover:bg-white/90 transition-colors"
          >
            Davam et
          </button>

          {/* Import bölməsi */}
          <div className="border-t border-white/10 pt-4">
            <button
              onClick={() => setShowImports(v => !v)}
              className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs font-medium transition-colors w-full"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showImports ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
              Import alətləri
            </button>

            {showImports && (
              <div className="mt-3 flex flex-col gap-3">
                <ImportCard
                  title="İmtahanlar (Exams)"
                  endpoint="/imports/exams"
                  columns={[
                    { name: "Name", required: true },
                    { name: "Date", required: true },
                  ]}
                />
                <ImportCard
                  title="Ekspertlər (Experts)"
                  endpoint="/imports/experts"
                  columns={[
                    { name: "name", required: true },
                    { name: "surname", required: true },
                    { name: "middlename", required: false },
                  ]}
                />
                <ImportCard
                  title="İmtahan ↔ Ekspert bağlantıları (ExamExperts)"
                  endpoint="/imports/exam-experts"
                  columns={[
                    { name: "ExamId", required: true },
                    { name: "ExpertId", required: true },
                  ]}
                />
                <p className="text-white/30 text-[11px] px-1">
                  Dəstəklənən formatlar: .xlsx, .xls, .csv &nbsp;·&nbsp; Sütun başlıqları böyük/kiçik hərfə həssas deyil
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
