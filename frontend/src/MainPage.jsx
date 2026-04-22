import { useState, useEffect } from "react";
import { useUnlockModal } from "./useUnlockModal";
import { useToast } from "./Toast";

function MainPage({ config }) {
  const {
    subject: selectedSubject,
    section: selectedSection,
    building: selectedBuilding,
    date: selectedDate,
    exam: selectedExam,
  } = config;
  const { addToast } = useToast();

  const isSection3 = selectedSection?.id === 3;
  const isSubject4 = selectedSubject?.id === 4;

  const [orderNo, setOrderNo] = useState("");
  const [orderLocked, setOrderLocked] = useState(false);
  const [student, setStudent] = useState(null);

  const [result, setResult] = useState("");
  const [result2, setResult2] = useState("");

  // section=3 üçün: imtahandakı bütün ekspertlər və onların balları
  const [examExperts, setExamExperts] = useState([]);
  const [expertScores, setExpertScores] = useState({});      // { [expertId]: "score" }
  const [expertScoreLocks, setExpertScoreLocks] = useState({}); // { [expertId]: bool }

  const [result1Locked, setResult1Locked] = useState(false);
  const [result2Locked, setResult2Locked] = useState(false);

  const [successModal, setSuccessModal] = useState(false);
  const [successCallback, setSuccessCallback] = useState(null);

  const { openUnlock, UnlockModal } = useUnlockModal();

  // section=3 olanda imtahanın ekspertlərini yüklə
  useEffect(() => {
    if (!isSection3 || !selectedExam) {
      setExamExperts([]);
      return;
    }
    fetch(`http://localhost:5000/exams/${selectedExam.id}/experts`)
      .then(r => r.json())
      .then(data => setExamExperts(Array.isArray(data) ? data : []))
      .catch(() => setExamExperts([]));
  }, [isSection3, selectedExam]);

  const fetchStudent = async () => {
    if (!orderNo) return;
    try {
      const res = await fetch(
        `http://localhost:5000/students/order/${orderNo}?buildingCode=${selectedBuilding.code}&examDate=${encodeURIComponent(selectedDate)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Tələbə tapılmadı");
      }
      const data = await res.json();
      setStudent(data);
      setOrderLocked(true);

      if (isSection3) {
        try {
          const sr = await fetch(
            `http://localhost:5000/students/${data.id}/section3-results?examId=${selectedExam.id}`
          );
          const rows = sr.ok ? await sr.json() : [];
          const scoreMap = {};
          const lockMap = {};
          for (const row of rows) {
            scoreMap[row.expertId] = row.score ?? "";
            lockMap[row.expertId] = true;
          }
          setExpertScores(scoreMap);
          setExpertScoreLocks(lockMap);
        } catch {
          setExpertScores({});
          setExpertScoreLocks({});
        }
      } else {
        setResult(data.result ?? "");
        setResult2(data.result2 ?? "");
        setResult1Locked(data.result != null);
        setResult2Locked(data.result2 != null);
      }
    } catch (err) {
      addToast(err.message, "error");
      setStudent(null);
    }
  };

  const resetOrder = () => {
    setOrderNo("");
    setOrderLocked(false);
    setStudent(null);
    setResult("");
    setResult2("");
    setExpertScores({});
    setExpertScoreLocks({});
    setResult1Locked(false);
    setResult2Locked(false);
  };

  const showSuccess = (callback) => {
    setSuccessModal(true);
    setSuccessCallback(() => callback);
  };

  const saveField = async (field, value) => {
    if (value === "" || value === null || value === undefined) {
      addToast("Zəhmət olmasa bal daxil edin", "info");
      return false;
    }
    try {
      const body = field === "result"
        ? {
            subjectId: selectedSubject.id,
            buildingCode: selectedBuilding.code,
            examDate: selectedDate,
            value: Number(value),
          }
        : null;

      const res = await fetch(`http://localhost:5000/students/${student.id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Yadda saxlanılmadı");
      }
      return true;
    } catch (err) {
      addToast(err.message, "error");
      return false;
    }
  };

  // section=3 — bütün ekspert ballarını eyni anda yadda saxla
  const saveAllExpertScores = async () => {
    if (examExperts.length === 0) {
      addToast("Bu imtahana heç bir ekspert təyin olunmayıb", "info");
      return;
    }
    const missing = examExperts.filter(
      e => expertScores[e.id] === undefined || expertScores[e.id] === "" || expertScores[e.id] === null
    );
    if (missing.length > 0) {
      addToast(`Bütün ekspertlərin balı daxil edilməlidir (${missing.length} boş qalıb)`, "info");
      return;
    }

    try {
      const requests = examExperts.map(e =>
        fetch(`http://localhost:5000/students/${student.id}/section3-result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examId: selectedExam.id,
            expertId: e.id,
            subjectId: selectedSubject.id,
            score: Number(expertScores[e.id]),
          }),
        })
      );
      const responses = await Promise.all(requests);
      for (const r of responses) {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.message || "Bəzi ballar yadda saxlanmadı");
        }
      }
      const newLocks = {};
      for (const e of examExperts) newLocks[e.id] = true;
      setExpertScoreLocks(newLocks);
      showSuccess(() => resetOrder());
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleSaveBal1 = async () => {
    const ok = await saveField("result", result);
    if (!ok) return;
    setResult1Locked(true);
    if (isSubject4) showSuccess(() => {});
    else showSuccess(() => resetOrder());
  };

  const handleUnlock = (setLocked) => {
    openUnlock("result", () => setLocked(false));
  };

  const handleUnlockExpert = (expertId) => {
    openUnlock("result", () => {
      setExpertScoreLocks(prev => ({ ...prev, [expertId]: false }));
    });
  };

  const handleExpertScoreChange = (expertId, value) => {
    setExpertScores(prev => ({ ...prev, [expertId]: value }));
  };

  const expertFullName = (e) =>
    e ? [e.surname, e.name, e.middlename].filter(Boolean).join(" ") : "";

  // Orta bal (yalnız UI)
  const avgInfo = (() => {
    if (!isSection3 || examExperts.length === 0) return null;
    const nums = examExperts
      .map(e => expertScores[e.id])
      .filter(v => v !== undefined && v !== "" && v !== null && !isNaN(Number(v)))
      .map(Number);
    if (nums.length === 0) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    return { avg: sum / nums.length, count: nums.length, total: examExperts.length, sum };
  })();

  const allExpertScoresSaved =
    isSection3 &&
    examExperts.length > 0 &&
    examExperts.every(e => expertScoreLocks[e.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl backdrop-blur-lg bg-white/20 border border-white/30 rounded-3xl shadow-2xl p-10 text-white">

        <div className="flex flex-wrap gap-2 mb-6">
          {selectedSection && (
            <div className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-center">
              <p className="text-xs text-white/60 mb-0.5">Bölmə</p>
              <p className="font-bold truncate">{selectedSection.name}</p>
            </div>
          )}
          <div className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-center">
            <p className="text-xs text-white/60 mb-0.5">Fənn</p>
            <p className="font-bold truncate">{selectedSubject?.Name}</p>
          </div>
          <div className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-center">
            <p className="text-xs text-white/60 mb-0.5">Bina</p>
            <p className="font-bold truncate">{selectedBuilding?.name}</p>
          </div>
          <div className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-center">
            <p className="text-xs text-white/60 mb-0.5">Tarix</p>
            <p className="font-bold">{selectedDate}</p>
          </div>
        </div>

        {isSection3 && selectedExam && (
          <div className="mb-6 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-center">
            <p className="text-xs text-white/60 mb-0.5">İmtahan</p>
            <p className="font-bold">{selectedExam.Name} ({examExperts.length} ekspert)</p>
          </div>
        )}

        <p className="text-center text-white/70 mb-6 text-sm">Abituriyentin sıra nömrəsini daxil edin</p>

        {!orderLocked ? (
          <div className="flex gap-3 mb-8">
            <input
              type="number"
              placeholder="Sıra nömrəsi"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchStudent()}
              className="flex-1 px-5 py-4 rounded-2xl bg-white/80 text-black text-lg"
            />
            <button onClick={fetchStudent} className="px-8 py-4 rounded-2xl bg-black text-white text-lg font-semibold">
              Aç
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-8 px-5 py-4 rounded-2xl bg-white/10 border border-white/20">
            <span className="flex-1 text-white text-lg">Sıra № <span className="font-bold">{orderNo}</span></span>
            <button onClick={resetOrder} className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm transition-colors">
              Dəyiş
            </button>
          </div>
        )}

        {student && (
          <div className="bg-white rounded-3xl p-8 text-black shadow-xl">
            <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                {student.photo ? (
                  <img src={student.photo} alt="foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Foto yoxdur</div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {student.name} {student.surname} {student.middleName}
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p className="text-sm text-gray-500">İş nömrəsi <span className="text-gray-800 font-medium">{student.Is_no}</span></p>
                  <p className="text-sm text-gray-500">Doğum tarixi <span className="text-gray-800 font-medium">{student.birth_date}</span></p>
                  <p className="text-sm text-gray-500">Komissiya № <span className="text-gray-800 font-medium">{student.commissionNo}</span></p>
                  <p className="text-sm text-gray-500">Sıra № <span className="text-gray-800 font-medium">{student.orderNo}</span></p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Nəticə</p>

              {isSection3 ? (
                examExperts.length === 0 ? (
                  <p className="text-sm text-gray-500 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                    Bu imtahana heç bir ekspert təyin olunmayıb
                  </p>
                ) : (
                  <>
                    {examExperts.map((e) => (
                      <BalInput
                        key={e.id}
                        label={`Bal — ${expertFullName(e)}`}
                        value={expertScores[e.id] ?? ""}
                        onChange={(v) => handleExpertScoreChange(e.id, v)}
                        locked={!!expertScoreLocks[e.id]}
                        onUnlock={() => handleUnlockExpert(e.id)}
                        hideSaveButton
                      />
                    ))}

                    {/* Orta bal göstəricisi */}
                    {avgInfo && (
                      <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-widest">Orta bal</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {avgInfo.count}/{avgInfo.total} ekspert · cəm: {avgInfo.sum.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-3xl font-bold text-indigo-600">{avgInfo.avg.toFixed(2)}</p>
                      </div>
                    )}

                    {!allExpertScoresSaved && (
                      <button
                        onClick={saveAllExpertScores}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity"
                      >
                        Bütün balları yadda saxla
                      </button>
                    )}
                  </>
                )
              ) : (
                <>
                  <BalInput
                    label="Bal 1"
                    value={result}
                    onChange={setResult}
                    locked={result1Locked}
                    onUnlock={() => handleUnlock(setResult1Locked)}
                    onSave={handleSaveBal1}
                    saveLabel="Bal 1-i yadda saxla"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {successModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl px-10 py-8 shadow-2xl text-center flex flex-col items-center gap-4 w-80">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Nəticə qeydə alındı</h2>
            <p className="text-sm text-gray-400">Növbəti abituriyent üçün davam edə bilərsiniz</p>
            <button
              onClick={() => {
                setSuccessModal(false);
                if (successCallback) successCallback();
                setSuccessCallback(null);
              }}
              className="mt-2 w-full py-3 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {UnlockModal}
    </div>
  );
}

function BalInput({ label, value, onChange, locked, onUnlock, onSave, saveLabel, hideSaveButton }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-600">{label}</label>
        {locked && (
          <button
            onClick={onUnlock}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            🔒 Dəyiş
          </button>
        )}
      </div>
      <input
        type="number"
        step="0.1"
        placeholder="0.0"
        value={value}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-lg disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
      />
      {!locked && !hideSaveButton && onSave && (
        <button
          onClick={onSave}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {saveLabel}
        </button>
      )}
      {locked && value !== "" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-700 font-medium">Qeydə alındı — {value}</span>
        </div>
      )}
    </div>
  );
}

export default MainPage;