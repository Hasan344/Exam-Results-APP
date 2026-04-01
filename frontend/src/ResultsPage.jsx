import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

function ResultsPage() {
  const [students, setStudents] = useState([]);
  const [searchParams] = useSearchParams();
  const subjectId = Number(searchParams.get("subjectId"));

  useEffect(() => {
    fetch("http://localhost:5000/students/results")
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(() => alert("Məlumat yüklənmədi"));
  }, []);

  const isSubject4 = subjectId === 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Nəticələr</h1>

        <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
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
    <td className="px-6 py-4">{s.result ?? "-"}</td>
    {isSubject4 && <td className="px-6 py-4">{s.result2 ?? "-"}</td>}
  </tr>
))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;