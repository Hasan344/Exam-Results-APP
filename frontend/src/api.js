// frontend/src/api.js
export const API_BASE =
  import.meta.env.VITE_API_URL ?? "";

export function apiUrl(path) {
  if (!path) return API_BASE;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}