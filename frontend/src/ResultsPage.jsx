import { useState, useEffect } from "react";
import { API_BASE } from "./api";

function ResultsPage({ config }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const exerciseId   = config?.exercise?.id;
  const sectionId    = config?.section?.id;
  const buildingCode = config?.building?.code;
  const examDate     = config?.date;
  const examId       = config?.exam?.id;

  const isSection3  = sectionId === 3;
  const isSection1  = sectionId === 1;
  const isExercise4 = exerciseId === 4;

  useEffect(() => {
    const params = new URLSearchParams();
    if (buildingCode) params.append("buildingCode", buildingCode);
    if (examDate)     params.append("examDate", examDate);
    if (exerciseId)   params.append("subjectId", exerciseId); // backend hələ subjectId qəbul edir
    if (isSection3 && examId) params.append("examId", examId);

    setLoading(true);
    fetch(`${API_BASE}/students/results?${params.toString()}`)
      .then(res => res.json())
      .then(data => { setStudents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [buildingCode, examDate, exerciseId, examId, isSection3]);

  const handleExport = async (appealOnly = false) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (buildingCode) params.append("buildingCode", buildingCode);
      if (examDate)     params.append("examDate", examDate);
      if (exerciseId)   params.append("subjectId", exerciseId);
      if (appealOnly)   params.append("appealOnly", "true");

      const res = await fetch(`${API_BASE}/imports/results/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Export xətası: " + (err.message || res.statusText));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") || "";
      const match = cd.match(/filename\*=UTF-8''(.+)/i) || cd.match(/filename="?([^"]+)"?/i);
      a.download = match ? decodeURIComponent(match[1]) : "neticeler_export.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export alınmadı: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const calcAverage = (s) => {
    const scores = Array.isArray(s.expertScores) ? s.expertScores : [];
    const nums = scores
      .map(x => x?.score)
      .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
      .map(Number);
    if (nums.length === 0) return null;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return { avg, count: nums.length };
  };

  const displayResult  = (s) => (s.result_appeal  != null ? s.result_appeal  : s.result)  ?? "-";
  const displayResult2 = (s) => (s.result_appeal2 != null ? s.result_appeal2 : s.result2) ?? "-";
  const hasAppeal      = (s) => s.result_appeal  != null;
  const hasAppeal2     = (s) => s.result_appeal2 != null;
  const hasAnyAppeal   = students.some(s => s.result_appeal != null || s.result_appeal2 != null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="text-3xl font-bold text-white">Nəticələr</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-2 text-xs text-white/70 flex-wrap">
              {config?.section && (
                <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">{config.section.name}</span>
              )}
              {config?.exercise && (
                <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">{config.exercise.name}</span>
              )}
              {config?.building && (
                <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">{config.building.name}</span>
              )}
              {examDate && (
                <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">{examDate}</span>
              )}
              {isSection3 && config?.exam && (
                <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">{config.exam.Name}</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport(false)}
                disabled={exporting || loading || students.length === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/15 border border-white/25
                           text-white text-sm font-medium hover:bg-white/25 transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>Export…</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/>
                  </svg>Export</>
                )}
              </button>

              {hasAnyAppeal && (
                <button
                  onClick={() => handleExport(true)}
                  disabled={exporting || loading}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-yellow-400/20 border border-yellow-300/30
                             text-yellow-200 text-sm font-medium hover:bg-yellow-400/30 transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  Apellyasiya
                </button>
              )}
            </div>
          </div>
        </div>

        {!isSection3 && (
          <div className="flex gap-4 mb-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 inline-block"></span>
              Apellyasiya nəticəsi
            </span>
          </div>
        )}

        <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-white/60">Yüklənir...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-white/60">Nəticə tapılmadı</div>
          ) : isSection3 ? (
            <div className="divide-y divide-white/10">
              {students.map((s) => {
                const avgInfo = calcAverage(s);
                const scores = Array.isArray(s.expertScores) ? s.expertScores : [];
                return (
                  <div key={s.orderNo} className="flex items-center gap-5 px-6 py-5 hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-white/90 font-bold text-sm">{s.orderNo}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate mb-1.5">
                        {s.name} {s.surname} {s.middleName}
                      </p>
                      {scores.length === 0 ? (
                        <span className="text-white/40 text-xs">Bal daxil edilməyib</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {scores.map((x) => (
                            <span key={x.expertId}
                              title={`${x.expertSurname ?? ""} ${x.expertName ?? ""}`.trim()}
                              className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-white/80 text-xs font-medium"
                            >{x.score}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {avgInfo ? (
                        <>
                          <div className="text-3xl font-bold text-white leading-none">{avgInfo.avg.toFixed(2)}</div>
                          <div className="text-[11px] text-white/50 uppercase tracking-widest mt-1.5">Orta · {avgInfo.count} ekspert</div>
                        </>
                      ) : (
                        <span className="text-white/30 text-2xl">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-white">
              <thead>
                <tr className="bg-white/20 text-left">
                  <th className="px-6 py-4">№</th>
                  <th className="px-6 py-4">Ad Soyad Ata adı</th>
                  <th className="px-6 py-4">{isSection1 ? (config?.exercise?.name ?? "Bal 1") : "Bal 1"}</th>
                  {isExercise4 && (
                    <th className="px-6 py-4">{isSection1 ? `${config?.exercise?.name ?? "Bal"} 2` : "Bal 2"}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {students.map((s, index) => (
                  <tr key={s.orderNo}
                    className={`border-t border-white/20 hover:bg-white/20 transition-colors ${
                      index % 2 === 0 ? "bg-white/10" : "bg-indigo-900/30"
                    }`}
                  >
                    <td className="px-6 py-4">{s.orderNo}</td>
                    <td className="px-6 py-4">{s.name} {s.surname} {s.middleName}</td>
                    <td className="px-6 py-4">
                      <span className={hasAppeal(s) ? "text-yellow-300 font-semibold" : ""}>{displayResult(s)}</span>
                    </td>
                    {isExercise4 && (
                      <td className="px-6 py-4">
                        <span className={hasAppeal2(s) ? "text-yellow-300 font-semibold" : ""}>{displayResult2(s)}</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
