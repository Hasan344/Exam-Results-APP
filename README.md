# Exam Results — Desktop App (Electron paketi)

Bu sənəd layihəni **client maşınlarda quraşdırıla bilən desktop tətbiq** kimi
build etmək üçün addımları izah edir. Tətbiq açılanda öz daxili web server-i
(Node.js + Express + SQLite) qaldırır və browser əvəzinə öz pəncərəsində
React arayüzünü göstərir.

> Qeyd: Node.js layihəsində `.dll` faylı yoxdur. Electron paketi əvəzinə
> `.exe` + ona bağlı `*.dll` faylları (V8, ICU, GPU və s.) qaytarır.
> Bu, .NET-də DLL paketinin tam ekvivalentidir.

---

## 1. Qovluq strukturu (dəyişikliklərdən sonra)

```
exam-results/
├── package.json            ← YENİ (root, Electron + electron-builder)
├── electron/
│   └── main.js             ← YENİ (Electron main process)
├── build/
│   └── README.txt          ← (icon-ları bura qoy: icon.ico/icns/png)
├── backend/
│   ├── server.js           ← DƏYİŞDİ (static serve + SPA fallback)
│   ├── database.js         ← DƏYİŞDİ (production-da userData yolu)
│   ├── package.json        ← olduğu kimi
│   ├── subjects.js, students.js, ... (qalanlar olduğu kimi)
│   └── photos/             ← runtime-da yaranır
└── frontend/
    ├── vite.config.js      ← DƏYİŞDİ (base: "./", dev proxy)
    ├── package.json        ← olduğu kimi
    ├── .env.example        ← YENİ
    ├── migrate-api-urls.js ← YENİ (bir dəfəlik istifadə üçün)
    └── src/
        ├── api.js          ← YENİ (mərkəzi API_BASE)
        ├── _PATCH_INSTRUCTIONS.md
        ├── App.jsx, MainPage.jsx, ... (dəyişdiriləcək — aşağıya bax)
        └── ...
```

---

## 2. İlk dəfə quraşdırma (təkrarsız addımlar)

### 2.1 Frontend kodda dəyişikliyi tətbiq et

Bütün `frontend/src/**/*.jsx` fayllarında `http://localhost:5000` hardcoded URL-ləri
`${API_BASE}` ilə əvəz etmək lazımdır.

**Avtomatik üsul (tövsiyə olunur):**

```bash
cd frontend
node migrate-api-urls.js
```

Bu skript:
- Bütün `.js`/`.jsx` fayllarında URL-ləri əvəz edir
- Hər dəyişdirilmiş faylın başına `import { API_BASE } from "./api";` əlavə edir
- Adi quote-ları (`"`, `'`) backtick-ə çevirir (yalnız ehtiyac olan sətirlərdə)

İşə salandan sonra skripti silə bilərsən:
```bash
rm migrate-api-urls.js
```

**Əl ilə üsul:** `frontend/src/_PATCH_INSTRUCTIONS.md` faylını oxu.

### 2.2 Root dependency-ləri quraşdır

Layihənin **kökündə** (yəni `frontend/` və `backend/` ilə eyni səviyyədə):

```bash
npm install
```

Bu, Electron, electron-builder və köməkçi alətləri yükləyir.

### 2.3 Frontend dependency-ləri

```bash
cd frontend
npm install
```

### 2.4 Backend dependency-ləri

```bash
cd backend
npm install
```

### 2.5 sqlite3 native binary-ni Electron üçün yenidən kompilyasiya et

⚠️ **Çox vacib addım** — yoxsa paketlənmiş app sqlite3-ü tapa bilməz.

Root-da:

```bash
npx electron-rebuild -f -w sqlite3 -m ./backend
```

Və ya:

```bash
npm run rebuild:sqlite
```

---

## 3. Development modu (test üçün)

İki ayrı terminalda işə sal:

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 — Frontend (vite dev server, HMR ilə):**
```bash
cd frontend
npm run dev
```

Brauzerdə `http://localhost:5173` açılır. Backend `http://localhost:5000`-da işləyir, vite proxy yönləndirir.

**Electron dev (istəyə görə):** Üçüncü terminalda:
```bash
npm run dev:electron
```

---

## 4. Production build — `.exe` yaratmaq

```bash
npm run dist:win
```

Bu komanda:
1. `frontend/dist/`-i `vite build` ilə yaradır
2. `backend/`-i hazırlayır
3. Hər şeyi Electron paketinə yığır
4. `release/` qovluğunda iki fayl yaradır:
   - `ExamResults-Setup-1.0.0.exe` — NSIS installer (Next-Next-Finish)
   - `ExamResults-Setup-1.0.0.exe` (portable) — installer-siz versiya

Client maşına yalnız **installer .exe** faylını ötür. Heç bir əlavə şey lazım deyil.

### Build qovluğunda nə olacaq?

```
release/
├── ExamResults-Setup-1.0.0.exe       ← Client-ə bunu ver
├── win-unpacked/                      ← (Açılmış halı — debug üçün)
│   ├── ExamResults.exe                ← Əsas executable
│   ├── *.dll                          ← Electron runtime DLL-ləri
│   │   (ffmpeg.dll, libEGL.dll, libGLESv2.dll, vk_swiftshader.dll, ...)
│   ├── resources/
│   │   ├── app.asar                   ← electron/main.js və package.json
│   │   └── app.asar.unpacked/
│   │       └── backend/               ← server.js, sqlite3 native binary
│   └── locales/
└── builder-effective-config.yaml
```

**Beləliklə "DLL faylları ilə client-də açılsın" tələbi tam yerinə yetirilir.**

---

## 5. Client maşında quraşdırma

1. `ExamResults-Setup-1.0.0.exe`-ni client-ə göndər
2. Client iki dəfə klikləyir → installer açılır → "Next" → "Install"
3. Masaüstündə "Exam Results" qısayolu yaranır
4. App açılır, daxili browser pəncərəsində React UI görünür

Database (`database.db`) ilk açılışda `%APPDATA%\ExamResults\database.db` yoluna kopyalanır.
Bu fayl yazıla biləndir, yenilənmələrdə itmir.

---

## 6. Lazımi əlavə qeydlər

### Foto/upload-ları paketləməyə daxil etmək

`backend/photos/` qovluğu vardırsa və bütün şəkilləri bundle etmək istəyirsənsə,
package.json-da `extraResources` artıq buna icazə verir. Amma çox böyük şəkil
yığını üçün **userData qovluğunda** saxlamaq daha düzgündür — bunun üçün
`backend/students.js`-də `PHOTOS_DIR`-i belə dəyişməlisən:

```js
const PHOTOS_DIR = process.env.PHOTOS_DIR
  ? process.env.PHOTOS_DIR
  : path.join(__dirname, "photos");
```

Və `electron/main.js`-də `startBackend()` env-ə əlavə et:
```js
PHOTOS_DIR: path.join(app.getPath("userData"), "photos"),
```

### Default admin parolu və ya seed data

Əgər `database.db` seed (boş başlamır) olunmalıdırsa, onu `backend/database.db`
faylı kimi commit et — `database.js` onu ilk açılışda `userData`-ya kopyalayacaq.

### Avtomatik update

Hələlik daxil edilməyib. Lazım olsa `electron-updater` əlavə edə bilərik.

---

## 7. Tələblər və versiyalar

- Node.js 20.x və ya 22.x (Electron 33 üçün)
- Windows 10/11 üçün build → Windows maşında və ya WSL2-də
- macOS .dmg üçün build → yalnız macOS maşında (Apple imzalama)
- Linux AppImage / deb → istənilən OS-də mümkündür

---

## 8. Tez-tez yaranan problemlər

| Problem | Həlli |
|---|---|
| `sqlite3 ERR_DLOPEN_FAILED` paketdə | `npm run rebuild:sqlite` işə sal və yenidən paketlə |
| Boş pəncərə açılır | DevTools-da yoxla (Ctrl+Shift+I) — adətən `vite.config.js`-də `base` problemidir |
| `fetch failed http://localhost:5000` | Hardcoded URL qalıb — `migrate-api-urls.js` skriptini yenidən işə sal |
| `port 5000 already in use` | Başqa app o portu tutub. `electron/main.js`-də `PORT = 5001` et və backend `server.js`-də də uyğun et |
| Installer Windows Defender tərəfindən bloklanır | Code signing sertifikat lazımdır (production üçün). Lokal istifadədə "More info → Run anyway" kifayətdir |

---

## 9. Sənin nə etməli olacağın

1. ✅ Bu repo-nun root-una bu sənəddəki bütün YENİ/DƏYİŞDİRİLMİŞ faylları yerləşdir
2. ✅ `cd frontend && node migrate-api-urls.js` — frontend kodu avtomatik yenilə
3. ✅ Root-da `npm install`
4. ✅ `cd frontend && npm install`
5. ✅ `cd backend && npm install`
6. ✅ Root-da `npm run rebuild:sqlite`
7. ✅ Root-da `npm run dist:win` — release/ qovluğunda installer yaranır
8. ✅ Installer-i client-ə göndər
