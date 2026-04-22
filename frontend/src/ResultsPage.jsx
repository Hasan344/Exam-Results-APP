import { useState, useEffect } from "react";

function ResultsPage({ config }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const subjectId = config?.subject?.id;
  const sectionId = config?.section?.id;
  const buildingCode = config?.building?.code;
  const examDate = config?.date;
  const examId = config?.exam?.id;

  const isSection3 = sectionId === 3;
  const isSubject4 = subjectId === 4;

  useEffect(() => {
    const params = new URLSearchParams();
    if (buildingCode) params.append("buildingCode", buildingCode);
    if (examDate) params.append("examDate", examDate);
    if (subjectId) params.append("subjectId", subjectId);
    // section=3 üçün ekspert ballarını gətirməsi üçün examId-ni də göndəririk
    if (isSection3 && examId) params.append("examId", examId);

    setLoading(true);
    fetch(`http://localhost:5000/students/results?${params.toString()}`)
      .then(res => res.json())
      .then(data => { setStudents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [buildingCode, examDate, subjectId, examId, isSection3]);

  // Section=3: StudentResults-dən gələn expertScores array-ı əsasında orta hesabla
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

  // Apellyasiya varsa onu göstər, yoxsa əsli (yalnız section != 3)
  const displayResult  = (s) => (s.result_appeal  != null ? s.result_appeal  : s.result)  ?? "-";
  const displayResult2 = (s) => (s.result_appeal2 != null ? s.result_appeal2 : s.result2) ?? "-";

  const hasAppeal  = (s) => s.result_appeal  != null;
  const hasAppeal2 = (s) => s.result_appeal2 != null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="text-3xl font-bold text-white">Nəticələr</h1>
          <div className="flex gap-2 text-xs text-white/70 flex-wrap">
            {config?.section && (
              <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                {config.section.name}
              </span>
            )}
            {config?.subject && (
              <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                {config.subject.Name}
              </span>
            )}
            {config?.building && (
              <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                {config.building.name}
              </span>
            )}
            {examDate && (
              <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                {examDate}
              </span>
            )}
            {isSection3 && config?.exam && (
              <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                {config.exam.Name}
              </span>
            )}
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
            /* ─────────── SECTION = 3 — ekspert ballarının ortalaması ─────────── */
            <div className="divide-y divide-white/10">
              {students.map((s) => {
                const avgInfo = calcAverage(s);
                const scores = Array.isArray(s.expertScores) ? s.expertScores : [];
                return (
                  <div
                    key={s.orderNo}
                    className="flex items-center gap-5 px-6 py-5 hover:bg-white/5 transition-colors"
                  >
                    {/* Sıra nömrəsi */}
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-white/90 font-bold text-sm">{s.orderNo}</span>
                    </div>

                    {/* Ad + ekspert chipləri */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate mb-1.5">
                        {s.name} {s.surname} {s.middleName}
                      </p>
                      {scores.length === 0 ? (
                        <span className="text-white/40 text-xs">Bal daxil edilməyib</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {scores.map((x) => (
                            <span
                              key={x.expertId}
                              title={`${x.expertSurname ?? ""} ${x.expertName ?? ""}`.trim()}
                              className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-white/80 text-xs font-medium"
                            >
                              {x.score}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Orta bal */}
                    <div className="flex-shrink-0 text-right">
                      {avgInfo ? (
                        <>
                          <div className="text-3xl font-bold text-white leading-none">
                            {avgInfo.avg.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-white/50 uppercase tracking-widest mt-1.5">
                            Orta · {avgInfo.count} ekspert
                          </div>
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
            /* ─────────── SECTION != 3 — standart flow ─────────── */
            <table className="w-full text-white">
              <thead>
                <tr className="bg-white/20 text-left">
                  <th className="px-6 py-4">№</th>
                  <th className="px-6 py-4">Ad Soyad Ata adı</th>
                  <th className="px-6 py-4">Bal 1</th>
                  {isSubject4 && <th className="px-6 py-4">Bal 2</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((s, index) => (
                  <tr
                    key={s.orderNo}
                    className={`border-t border-white/20 hover:bg-white/20 transition-colors ${
                      index % 2 === 0 ? "bg-white/10" : "bg-indigo-900/30"
                    }`}
                  >
                    <td className="px-6 py-4">{s.orderNo}</td>
                    <td className="px-6 py-4">{s.name} {s.surname} {s.middleName}</td>
                    <td className="px-6 py-4">
                      <span className={hasAppeal(s) ? "text-yellow-300 font-semibold" : ""}>
                        {displayResult(s)}
                      </span>
                    </td>
                    {isSubject4 && (
                      <td className="px-6 py-4">
                        <span className={hasAppeal2(s) ? "text-yellow-300 font-semibold" : ""}>
                          {displayResult2(s)}
                        </span>
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