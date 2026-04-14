import { useState } from "react";
import { useUnlockModal } from "./useUnlockModal";
import { useToast } from "./Toast";

function MainPage({ config }) {
  const {
    subject: selectedSubject,
    section: selectedSection,
    building: selectedBuilding,
    date: selectedDate,
  } = config;
  const { addToast } = useToast();

  const isSection3 = selectedSection?.id === 3;
  const isSubject4 = selectedSubject?.id === 4;

  const [orderNo, setOrderNo] = useState("");
  const [orderLocked, setOrderLocked] = useState(false);
  const [student, setStudent] = useState(null);

  // Hər bal üçün ayrı state
  const [result, setResult] = useState("");
  const [result2, setResult2] = useState("");
  const [result3, setResult3] = useState("");

  // Locked: əgər DB-də data varsa true, yoxsa false
  const [result1Locked, setResult1Locked] = useState(false);
  const [result2Locked, setResult2Locked] = useState(false);
  const [result3Locked, setResult3Locked] = useState(false);

  const [successModal, setSuccessModal] = useState(false);
  const [successCallback, setSuccessCallback] = useState(null);

  const { openUnlock, UnlockModal } = useUnlockModal();

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

      // Mövcud datanı doldur
      setResult(data.result ?? "");
      setResult2(data.result2 ?? "");
      setResult3(data.result3 ?? "");

      // Locked: DB-də data varsa locked
      setResult1Locked(data.result != null);
      setResult2Locked(data.result2 != null);
      setResult3Locked(data.result3 != null);
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
    setResult3("");
    setResult1Locked(false);
    setResult2Locked(false);
    setResult3Locked(false);
  };

  const showSuccess = (callback) => {
    setSuccessModal(true);
    setSuccessCallback(() => callback);
  };

  // Hər bal üçün ayrı save funksiyası
  const saveField = async (field, value) => {
    if (value === "" || value === null || value === undefined) {
      addToast("Zəhmət olmasa bal daxil edin", "info");
      return false;
    }
    try {
      const res = await fetch(`http://localhost:5000/students/${student.id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubject.id,
          buildingCode: selectedBuilding.code,
          examDate: selectedDate,
          field,
          value: Number(value),
        }),
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

  const handleSaveBal1 = async () => {
    const ok = await saveField("result", result);
    if (!ok) return;
    setResult1Locked(true);
    if (isSection3 || isSubject4) {
      showSuccess(() => {});
    } else {
      showSuccess(() => resetOrder());
    }
  };

  const handleSaveBal2 = async () => {
    const ok = await saveField("result2", result2);
    if (!ok) return;
    setResult2Locked(true);
    if (isSection3) {
      showSuccess(() => {});
    } else {
      showSuccess(() => resetOrder());
    }
  };

  const handleSaveBal3 = async () => {
    const ok = await saveField("result3", result3);
    if (!ok) return;
    setResult3Locked(true);
    showSuccess(() => resetOrder());
  };

  const handleUnlock = (field, setLocked) => {
    openUnlock(field, () => setLocked(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl backdrop-blur-lg bg-white/20 border border-white/30 rounded-3xl shadow-2xl p-10 text-white">

        {/* Config info */}
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
            {/* Student info */}
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

              {/* BAL 1 — həmişə göstərilir */}
              <BalInput
                label="Bal 1"
                value={result}
                onChange={setResult}
                locked={result1Locked}
                onUnlock={() => handleUnlock("result1", setResult1Locked)}
                onSave={handleSaveBal1}
                saveLabel="Bal 1-i yadda saxla"
              />

              {/* BAL 2 — section3 və ya subject4 */}
              {(isSection3 || isSubject4) && (
                <BalInput
                  label="Bal 2"
                  value={result2}
                  onChange={setResult2}
                  locked={result2Locked}
                  onUnlock={() => handleUnlock("result2", setResult2Locked)}
                  onSave={handleSaveBal2}
                  saveLabel="Bal 2-i yadda saxla"
                />
              )}

              {/* BAL 3 — yalnız section3 */}
              {isSection3 && (
                <BalInput
                  label="Bal 3"
                  value={result3}
                  onChange={setResult3}
                  locked={result3Locked}
                  onUnlock={() => handleUnlock("result3", setResult3Locked)}
                  onSave={handleSaveBal3}
                  saveLabel="Bal 3-ü yadda saxla"
                />
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

// Ayrı komponent — hər bal inputu üçün
function BalInput({ label, value, onChange, locked, onUnlock, onSave, saveLabel }) {
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
      {!locked && (
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