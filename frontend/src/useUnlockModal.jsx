import { useState } from "react";
import { checkAuth } from "./AuthContext";
import { useToast } from "./Toast";

export function useUnlockModal() {
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [modalTarget, setModalTarget] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);

  const openUnlock = (target, onSuccess) => {
    setModalTarget(target);
    setPasswordInput("");
    setPasswordError("");
    setOnSuccessCallback(() => onSuccess);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!passwordInput) return;
    setLoading(true);
    const ok = await checkAuth("unlock", passwordInput);
    setLoading(false);
    if (ok) {
      setShowModal(false);
      if (onSuccessCallback) onSuccessCallback(modalTarget);
    } else {
      setPasswordError("Parol yanlışdır");
      setPasswordInput("");
    }
  };

  const UnlockModal = showModal ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 w-96 shadow-2xl text-black">
        <h2 className="text-xl font-bold mb-1">Kilidi Aç</h2>
        <p className="text-sm text-gray-400 mb-5">Dəyişiklik etmək üçün parolu daxil edin</p>
        <input
          type="password"
          placeholder="Parol"
          value={passwordInput}
          onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl mb-2 focus:outline-none focus:border-indigo-400 transition-colors"
          autoFocus
        />
        {passwordError && (
          <p className="text-red-500 text-sm mb-3">{passwordError}</p>
        )}
        <div className="flex gap-3 mt-3">
          <button
            onClick={handleSubmit}
            disabled={loading || !passwordInput}
            className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Yoxlanılır..." : "Təsdiqlə"}
          </button>
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
          >
            Ləğv et
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { openUnlock, UnlockModal };
}