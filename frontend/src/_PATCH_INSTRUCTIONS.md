// frontend/src/_PATCH_INSTRUCTIONS.md
//
// ════════════════════════════════════════════════════════════
//  FRONTEND-DƏ EDİLMƏLİ DƏYİŞİKLİKLƏR (BÜTÜN .jsx FAYLLARI)
// ════════════════════════════════════════════════════════════
//
//  Bütün src/*.jsx fayllarında bu addımları et:
//
//  1) Faylın başında import əlavə et:
//
//        import { API_BASE } from "./api";
//
//     (Əgər fayl src/ qovluğundan başqa yerdədirsə, yolu uyğunlaşdır:
//      src/components/X.jsx → import { API_BASE } from "../api";)
//
//  2) Find & Replace (regex VAR olmadan, ADİ TEXT replace):
//
//        Tap:        http://localhost:5000
//        Əvəz et:    ${API_BASE}
//
//     ⚠️ DİQQƏT: Bütün yerlərdə artıq template-literal işlədilir
//        (backtick `...` ilə). Adi string varsa, onu da
//        backtick-ə çevirmək lazımdır.
//
//  ━━━━━━ NÜMUNƏ ━━━━━━
//
//  ƏVVƏL:
//      fetch("http://localhost:5000/sections")
//      fetch(`http://localhost:5000/students/${id}/photo`)
//
//  SONRA:
//      fetch(`${API_BASE}/sections`)
//      fetch(`${API_BASE}/students/${id}/photo`)
//
//  ━━━━━━━━━━━━━━━━━━━━
//
//  Əgər bütün dəyişiklikləri əl ilə etmək istəmirsənsə,
//  layihənin kökündə bu skripti işə sal (Git Bash / Linux / macOS):
//
//      cd frontend/src
//      grep -rl "http://localhost:5000" . | xargs sed -i \
//          -e 's|"http://localhost:5000|\`${API_BASE}|g' \
//          -e "s|'http://localhost:5000|\`\${API_BASE}|g" \
//          -e 's|http://localhost:5000|${API_BASE}|g'
//
//  Sonra hər .jsx faylının başına api import-unu əl ilə əlavə et.
//
//  Windows PowerShell variantı:
//      Get-ChildItem -Recurse -Include *.jsx | ForEach-Object {
//          (Get-Content $_.FullName) `
//              -replace 'http://localhost:5000', '${API_BASE}' `
//              | Set-Content $_.FullName
//      }
//
