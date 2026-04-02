import { useState } from "react";
import { useUnlockModal } from "./useUnlockModal";
import { useToast } from "./Toast";

function AppealPage({ config }) {
  const { building: selectedBuilding, date: selectedDate } = config;
  const { addToast } = useToast();

  const [orderNo, setOrderNo] = useState("");
  const [orderLocked, setOrderLocked] = useState(false);
  const [student, setStudent] = useState(null);
  const [appeal1, setAppeal1] = useState("");
  const [appeal2, setAppeal2] = useState("");

  const [appeal1Locked, setAppeal1Locked] = useState(false);
  const [appeal2Locked, setAppeal2Locked] = useState(true);

  const [successModal, setSuccessModal] = useState(false);
  const [successCallback, setSuccessCallback] = useState(null);

  const { openUnlock, UnlockModal } = useUnlockModal();

  const handleUnlockClick = (target) => {
    openUnlock(target, (t) => {
      if (t === "appeal1") setAppeal1Locked(false);
      if (t === "appeal2") setAppeal2Locked(false);
    });
  };

  const showSuccess = (callback) => {
    setSuccessModal(true);
    setSuccessCallback(() => callback);
  };

  const handleSuccessOk = () => {
    setSuccessModal(false);
    if (successCallback) successCallback();
    setSuccessCallback(null);
  };

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
      setAppeal1(data.result_appeal ?? "");
      setAppeal2(data.result_appeal2 ?? "");
      if (data.subject_id === 4) {
        if (data.result_appeal && data.result_appeal2) { setAppeal1Locked(true); setAppeal2Locked(true); }
        else if (data.result_appeal && !data.result_appeal2) { setAppeal1Locked(true); setAppeal2Locked(false); }
        else { setAppeal1Locked(false); setAppeal2Locked(true); }
      } else {
        setAppeal1Locked(!!data.result_appeal);
        setAppeal2Locked(true);
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
    setAppeal1("");
    setAppeal2("");
    setAppeal1Locked(false);
    setAppeal2Locked(true);
  };

  const saveAppeal = async () => {
    if (!student) return;
    try {
      const res = await fetch(`http://localhost:5000/appeal/${student.orderNo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultAppeal: !appeal1Locked ? (appeal1 || null) : null,
          resultAppeal2: appeal1Locked && !appeal2Locked ? (appeal2 || null) : null,
        }),
      });
      if (!res.ok) throw new Error("Nəticə yadda saxlanılmadı");

      if (student.subject_id === 4) {
        if (!appeal1Locked) {
          showSuccess(() => { setAppeal1Locked(true); setAppeal2Locked(false); });
        } else {
          showSuccess(() => resetOrder());
        }
      } else {
        showSuccess(() => resetOrder());
      }
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const isSubject4 = student?.subject_id === 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl backdrop-blur-lg bg-white/20 border border-white/30 rounded-3xl shadow-2xl p-10 text-white">

        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-center">
            <p className="text-xs text-white/60 mb-0.5">Bina</p>
            <p className="font-bold truncate">{selectedBuilding?.name}</p>
          </div>
          <div className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-center">
            <p className="text-xs text-white/60 mb-0.5">Tarix</p>
            <p className="font-bold">{selectedDate}</p>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2">Apellyasiya Sistemi</h1>
        <p className="text-center text-white/70 mb-8 text-sm">Abituriyentin sıra nömrəsini daxil edin</p>

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
                  {student.name} {student.middleName} {student.surname}
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p className="text-sm text-gray-500">Komissiya № <span className="text-gray-800 font-medium">{student.commissionNo}</span></p>
                  <p className="text-sm text-gray-500">Sıra № <span className="text-gray-800 font-medium">{student.orderNo}</span></p>
                  <p className="text-sm text-gray-500">Bal 1 <span className="text-gray-800 font-medium">{student.result ?? "-"}</span></p>
                  {isSubject4 && (
                    <p className="text-sm text-gray-500">Bal 2 <span className="text-gray-800 font-medium">{student.result2 ?? "-"}</span></p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Apellyasiya Nəticəsi</p>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Apellyasiya Bal 1</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={appeal1}
                    disabled={appeal1Locked}
                    onChange={(e) => setAppeal1(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-lg disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                  {appeal1Locked && (
                    <button
                      onClick={() => handleUnlockClick("appeal1")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-yellow-100 transition-colors text-base"
                    >
                      🔒
                    </button>
                  )}
                </div>
              </div>

              {isSubject4 && student.result2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Appeal Bal 2</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={appeal2}
                      disabled={appeal2Locked}
                      onChange={(e) => setAppeal2(e.target.value)}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-lg disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                    {appeal2Locked && appeal1Locked && (
                      <button
                        onClick={() => handleUnlockClick("appeal2")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-yellow-100 transition-colors text-base"
                      >
                        🔒
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={saveAppeal}
                disabled={appeal1Locked && (!isSubject4 || appeal2Locked)}
                className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Yadda saxla
              </button>
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
              onClick={handleSuccessOk}
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

export default AppealPage;