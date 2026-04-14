import { useState } from "react";
import { useUnlockModal } from "./useUnlockModal";
import { useToast } from "./Toast";

function ChangeToggle({ value, onChange, disabled }) {
  return (
    <div className={`flex rounded-xl overflow-hidden border-2 ${disabled ? "border-gray-100" : "border-gray-200"}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
          value === false
            ? "bg-green-500 text-white"
            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
        } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      >
        ✓ Dəyişmədi
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
          value === true
            ? "bg-indigo-500 text-white"
            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
        } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      >
        ✎ Dəyişdi
      </button>
    </div>
  );
}

function AppealPage({ config }) {
  const { building: selectedBuilding, date: selectedDate } = config;
  const { addToast } = useToast();

  const [orderNo, setOrderNo] = useState("");
  const [orderLocked, setOrderLocked] = useState(false);
  const [student, setStudent] = useState(null);

  const [changed1, setChanged1] = useState(null);
  const [appeal1, setAppeal1] = useState("");
  const [appeal1Saved, setAppeal1Saved] = useState(false);

  const [changed2, setChanged2] = useState(null);
  const [appeal2, setAppeal2] = useState("");
  const [appeal2Saved, setAppeal2Saved] = useState(false);

  const [successModal, setSuccessModal] = useState(false);
  const [successCallback, setSuccessCallback] = useState(null);

  const { openUnlock, UnlockModal } = useUnlockModal();

  const isSubject4 = student?.subject_id === 4;

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

      if (data.result_appeal != null) {
        setAppeal1Saved(true);
        setAppeal1(String(data.result_appeal));
        setChanged1(Number(data.result_appeal) !== Number(data.result));
      }
      if (data.result_appeal2 != null) {
        setAppeal2Saved(true);
        setAppeal2(String(data.result_appeal2));
        setChanged2(Number(data.result_appeal2) !== Number(data.result2));
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
    setChanged1(null); setAppeal1(""); setAppeal1Saved(false);
    setChanged2(null); setAppeal2(""); setAppeal2Saved(false);
  };

  const showSuccess = (callback) => {
    setSuccessModal(true);
    setSuccessCallback(() => callback);
  };

  const handleChange1 = (val) => {
    setChanged1(val);
    setAppeal1(val ? "" : String(student.result ?? ""));
  };

  const handleChange2 = (val) => {
    setChanged2(val);
    setAppeal2(val ? "" : String(student.result2 ?? ""));
  };

  // API çağırışı — sadə field/value formatı
  const saveAppealField = async (field, value) => {
    const res = await fetch(`http://localhost:5000/appeal/${student.orderNo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value: Number(value) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Yadda saxlanılmadı");
    }
  };

  const saveBal1 = async () => {
    if (changed1 === null) { addToast("Zəhmət olmasa seçim edin", "info"); return; }
    if (changed1 && !appeal1) { addToast("Yeni bal daxil edin", "info"); return; }
    try {
      await saveAppealField("result_appeal", appeal1);
      setAppeal1Saved(true);
      if (isSubject4 && student.result2 != null && !appeal2Saved) {
        addToast("Bal 1 qeydə alındı. İndi Bal 2-ni seçin.", "success");
      } else {
        showSuccess(() => resetOrder());
      }
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const saveBal2 = async () => {
    if (changed2 === null) { addToast("Zəhmət olmasa seçim edin", "info"); return; }
    if (changed2 && !appeal2) { addToast("Yeni bal daxil edin", "info"); return; }
    try {
      await saveAppealField("result_appeal2", appeal2);
      setAppeal2Saved(true);
      showSuccess(() => resetOrder());
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleUnlockBal1 = () => {
    openUnlock("bal1", () => {
      setAppeal1Saved(false); setChanged1(null); setAppeal1("");
    });
  };

  const handleUnlockBal2 = () => {
    openUnlock("bal2", () => {
      setAppeal2Saved(false); setChanged2(null); setAppeal2("");
    });
  };

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
            {/* Student info */}
            <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                {student.photo ? (
                  <img src={student.photo} alt="foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Foto yoxdur</div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
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

            {/* BAL 1 */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Apellyasiya — Bal 1</p>
                {appeal1Saved && (
                  <button onClick={handleUnlockBal1} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    🔒 Dəyiş
                  </button>
                )}
              </div>

              <ChangeToggle value={changed1} onChange={handleChange1} disabled={appeal1Saved} />

              {changed1 !== null && (
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Apellyasiya balı"
                    value={appeal1}
                    disabled={!changed1 || appeal1Saved}
                    onChange={(e) => setAppeal1(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-lg disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                  {!changed1 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                      Avtomatik
                    </span>
                  )}
                </div>
              )}

              {!appeal1Saved && changed1 !== null && (
                <button onClick={saveBal1} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity">
                  Bal 1-i yadda saxla
                </button>
              )}

              {appeal1Saved && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700 font-medium">
                    Bal 1 qeydə alındı — {appeal1}
                    {!changed1 && <span className="text-green-500 ml-1">(dəyişmədi)</span>}
                  </span>
                </div>
              )}
            </div>

            {/* BAL 2 */}
            {isSubject4 && student.result2 != null && (
              <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Apellyasiya — Bal 2</p>
                  {appeal2Saved && (
                    <button onClick={handleUnlockBal2} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      🔒 Dəyiş
                    </button>
                  )}
                </div>

                <ChangeToggle value={changed2} onChange={handleChange2} disabled={appeal2Saved || !appeal1Saved} />

                {!appeal1Saved && (
                  <p className="text-xs text-gray-400 text-center">Əvvəlcə Bal 1-i yadda saxlayın</p>
                )}

                {changed2 !== null && appeal1Saved && (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Apellyasiya balı"
                      value={appeal2}
                      disabled={!changed2 || appeal2Saved}
                      onChange={(e) => setAppeal2(e.target.value)}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-lg disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                    {!changed2 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                        Avtomatik
                      </span>
                    )}
                  </div>
                )}

                {appeal1Saved && !appeal2Saved && changed2 !== null && (
                  <button onClick={saveBal2} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity">
                    Bal 2-i yadda saxla
                  </button>
                )}

                {appeal2Saved && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-700 font-medium">
                      Bal 2 qeydə alındı — {appeal2}
                      {!changed2 && <span className="text-green-500 ml-1">(dəyişmədi)</span>}
                    </span>
                  </div>
                )}
              </div>
            )}
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

export default AppealPage;