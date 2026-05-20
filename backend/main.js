// electron/main.js
//
// Strategiya dəyişdi:
// • Backend artıq AYRI proses kimi fork edilmir (paketləndikdə problem yaradırdı)
// • Express server-i Electron-un öz Node.js prosesində require() ilə qaldırırıq
// • Bu, fork() ilə bağlı path/working-directory problemlərini aradan qaldırır
// • Bütün konsol log-lar həm də userData/app.log faylına yazılır (debug üçün)

const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const net = require("net");

const IS_DEV = !app.isPackaged;
const PORT = Number(process.env.PORT || 5000);

// ─────────── Log fayla yaz ───────────
// Paketlənmiş app-da konsol görünmür, ona görə hər şeyi fayla yazırıq.
// Müştəri "açılmır" deyəndə bu faylı yoxlayırsan: %APPDATA%/ExamResults/app.log
let logStream = null;
function setupLogging() {
  try {
    const logDir = app.getPath("userData");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, "app.log");
    // ⚠️ "w" → hər başlanğıcda təmizlənir. Tarixçə lazımdırsa "a" istifadə et.
    logStream = fs.createWriteStream(logPath, { flags: "w" });

    const wrap = (orig, prefix) => (...args) => {
      const line = `[${new Date().toISOString()}] ${prefix} ${args.map(String).join(" ")}\n`;
      try { logStream.write(line); } catch (_) {}
      orig.apply(console, args);
    };
    console.log   = wrap(console.log,   "INFO ");
    console.warn  = wrap(console.warn,  "WARN ");
    console.error = wrap(console.error, "ERROR");

    console.log("=== App start ===");
    console.log("Log file:", logPath);
    console.log("App version:", app.getVersion());
    console.log("Electron:", process.versions.electron);
    console.log("Node:", process.versions.node);
    console.log("Platform:", process.platform, process.arch);
    console.log("Is dev:", IS_DEV);
    console.log("Resources:", process.resourcesPath);
    console.log("UserData:", app.getPath("userData"));
  } catch (err) {
    // Log faylı yaza bilmiriksə də davam et
    console.error("Logging setup xətası:", err);
  }
}

// Bütün handle olunmayan xətaları tut və göstər
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err.stack || err);
  try {
    dialog.showErrorBox("Gözlənilməz xəta", String(err.stack || err));
  } catch (_) {}
});
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

// ─────────── Backend faylını tap ───────────
function resolveBackendEntry() {
  const candidates = IS_DEV
    ? [path.join(__dirname, "..", "backend", "server.js")]
    : [
        path.join(process.resourcesPath, "app.asar.unpacked", "backend", "server.js"),
        path.join(__dirname, "..", "backend", "server.js"),
      ];
  for (const c of candidates) {
    console.log("Backend axtarış:", c, "→", fs.existsSync(c) ? "TAPILDI" : "yox");
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// ─────────── Port-un hazır olmasını gözlə ───────────
function waitForPort(port, host = "127.0.0.1", timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const sock = new net.Socket();
      sock.setTimeout(500);
      sock.once("connect", () => { sock.destroy(); resolve(); });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) {
          return reject(new Error(`Port ${port} ${timeoutMs}ms ərzində açılmadı`));
        }
        setTimeout(tryConnect, 300);
      });
      sock.once("timeout", () => { sock.destroy(); setTimeout(tryConnect, 300); });
      sock.connect(port, host);
    };
    tryConnect();
  });
}

// ─────────── Backend in-process qaldır ───────────
function startBackend() {
  const entry = resolveBackendEntry();
  if (!entry) {
    const msg = "backend/server.js paketdə tapılmadı.\n\nAxtarılan yollar log faylındadır:\n" + path.join(app.getPath("userData"), "app.log");
    dialog.showErrorBox("Server tapılmadı", msg);
    app.quit();
    return false;
  }

  console.log("🚀 Backend başladılır:", entry);

  // ⚠️ MÜHÜM: backend prosesi DB və photos yollarını burdan oxuyacaq
  process.env.NODE_ENV = "production";
  process.env.PORT = String(PORT);
  process.env.DB_PATH = path.join(app.getPath("userData"), "database.db");
  process.env.PHOTOS_DIR = path.join(app.getPath("userData"), "photos");

  // photos qovluğunu yarat
  if (!fs.existsSync(process.env.PHOTOS_DIR)) {
    fs.mkdirSync(process.env.PHOTOS_DIR, { recursive: true });
  }

  // require() ilə backend-i eyni prosesdə qaldır.
  // server.js artıq app.listen() çağırır, yəni require ilə server qalxır.
  try {
    require(entry);
    console.log("✔ Backend module yükləndi");
    return true;
  } catch (err) {
    console.error("Backend yüklənərkən xəta:", err.stack || err);
    dialog.showErrorBox(
      "Backend yüklənmədi",
      `Xəta: ${err.message}\n\nDetallar log faylındadır:\n${path.join(app.getPath("userData"), "app.log")}`
    );
    app.quit();
    return false;
  }
}

// ─────────── Pəncərə yarat ───────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: "Exam Results",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Səhifə yüklənərkən xəta olsa görə bilək
  mainWindow.webContents.on("did-fail-load", (e, code, desc, url) => {
    console.error(`Səhifə yüklənmədi: ${url} → ${code} ${desc}`);
  });

  const url = `http://127.0.0.1:${PORT}/`;
  console.log("loadURL:", url);
  mainWindow.loadURL(url).catch((err) => {
    console.error("loadURL xətası:", err);
    dialog.showErrorBox("Yükləmə xətası", err.message);
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

// ─────────── App lifecycle ───────────
app.whenReady().then(async () => {
  setupLogging();

  const ok = startBackend();
  if (!ok) return;

  try {
    console.log("Port", PORT, "gözlənilir...");
    await waitForPort(PORT);
    console.log("✔ Port hazırdır");
  } catch (err) {
    console.error(err);
    dialog.showErrorBox(
      "Server başlamadı",
      `${err.message}\n\nLog: ${path.join(app.getPath("userData"), "app.log")}`
    );
    app.quit();
    return;
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Tək instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
