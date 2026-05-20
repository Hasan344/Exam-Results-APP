// frontend/src/api.js
// Mərkəzi API base URL - bütün fetch çağırışları bunu istifadə etməlidir.
//
// İşləmə məntiqi:
//  • Development (vite dev server): VITE_API_URL .env-dən gəlir, yoxsa ${API_BASE}
//    (vite.config.js-də proxy də var, ona görə relative path da işləyir)
//  • Production (Electron / build): boş string — bütün sorğular eyni origin-ə gedir
//    (backend həm API, həm də static frontend-i serve edir, eyni port)
//
// İstifadəsi:
//   import { API_BASE, apiUrl } from "./api";
//   fetch(`${API_BASE}/students/...`)         // və ya
//   fetch(apiUrl("/students/..."))            // ikisi də işləyir

export const API_BASE =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? `${API_BASE}` : "");

export function apiUrl(path) {
  if (!path) return API_BASE;
  // path "/" ilə başlamırsa əlavə edirik
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}
