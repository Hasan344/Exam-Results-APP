import { useState, useEffect } from "react";

function ResultsPage({ config }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const subjectId = config?.subject?.id;
  const buildingCode = config?.building?.code;
  const examDate = config?.date;
  const isSubject4 = subjectId === 4;

  useEffect(() => {
    const params = new URLSearchParams();
    if (buildingCode) params.append("buildingCode", buildingCode);
    if (examDate) params.append("examDate", examDate);
    if (subjectId) params.append("subjectId", subjectId);

    fetch(`http://localhost:5000/students/results?${params.toString()}`)
      .then(res => res.json())
      .then(data => { setStudents(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [buildingCode, examDate, subjectId]);

  // result_appeal null/undefined deyilsə → onu göstər, əks halda result
  const displayResult  = (s) => (s.result_appeal  != null ? s.result_appeal  : s.result)  ?? "-";
  const displayResult2 = (s) => (s.result_appeal2 != null ? s.result_appeal2 : s.result2) ?? "-";

  const hasAppeal  = (s) => s.result_appeal  != null;
  const hasAppeal2 = (s) => s.result_appeal2 != null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Nəticələr</h1>
          <div className="flex gap-2 text-xs text-white/70">
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
          </div>
        </div>

        <div className="flex gap-4 mb-4 text-xs text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 inline-block"></span>
            Apellyasiya nəticəsi
          </span>
        </div>

        <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-white/60">Yüklənir...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-white/60">Nəticə tapılmadı</div>
          ) : (
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