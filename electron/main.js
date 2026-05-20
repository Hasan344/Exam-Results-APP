// electron/main.js
//
// Electron əsas prosesi:
//   1) Backend Express server-ini child process kimi başladır
//   2) Server hazır olanı gözləyir (port 5000 dinləyənə qədər)
//   3) BrowserWindow açıb http://localhost:5000 yükləyir
//   4) App bağlananda backend-i də öldürür

const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { fork, spawn } = require("child_process");
const net = require("net");

// ─────────── Path resolve ───────────
// Development: __dirname = .../electron, backend = ../backend
// Production (asar):
//   • app.asar/electron/main.js
//   • app.asar.unpacked/backend/... (extraResources və asarUnpack ilə)

const IS_DEV = !app.isPackaged;
const PORT = Number(process.env.PORT || 5000);

function resolveBackendEntry() {
  if (IS_DEV) {
    return path.join(__dirname, "..", "backend", "server.js");
  }
  // Packaged: backend qovluğu asar-dan kənardadır (asarUnpack)
  const candidates = [
    path.join(process.resourcesPath, "app.asar.unpacked", "backend", "server.js"),
    path.join(process.resourcesPath, "backend", "server.js"),
    path.join(__dirname, "..", "backend", "server.js"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// ─────────── User data DB path ───────────
function getUserDbPath() {
  const userDataDir = app.getPath("userData");
  return path.join(userDataDir, "database.db");
}

// ─────────── Port-un hazır olmasını gözlə ───────────
function waitForPort(port, host = "127.0.0.1", timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const sock = new net.Socket();
      sock.setTimeout(500);
      sock.once("connect", () => {
        sock.destroy();
        resolve();
      });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) {
          return reject(new Error(`Port ${port} ${timeoutMs}ms ərzində açılmadı`));
        }
        setTimeout(tryConnect, 300);
      });
      sock.once("timeout", () => {
        sock.destroy();
        setTimeout(tryConnect, 300);
      });
      sock.connect(port, host);
    };
    tryConnect();
  });
}

// ─────────── Backend prosesi ───────────
let backendProcess = null;

function startBackend() {
  const entry = resolveBackendEntry();
  if (!entry) {
    dialog.showErrorBox(
      "Server tapılmadı",
      "backend/server.js paketdə tapılmadı. Quraşdırma korlanmış ola bilər."
    );
    app.quit();
    return null;
  }

  console.log("🚀 Backend başladılır:", entry);

  // fork() Node.js child yaradır, Electron-un öz Node-undan istifadə edir
  backendProcess = fork(entry, [], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(PORT),
      DB_PATH: getUserDbPath(),
      ELECTRON_RUN_AS_NODE: "1", // Electron child-ı Node kimi qaçırsın
    },
    cwd: path.dirname(entry),
    silent: false,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  backendProcess.stdout?.on("data", (d) => console.log("[backend]", d.toString().trim()));
  backendProcess.stderr?.on("data", (d) => console.error("[backend ERR]", d.toString().trim()));
  backendProcess.on("exit", (code) => {
    console.log(`[backend] çıxdı kod=${code}`);
    backendProcess = null;
  });

  return backendProcess;
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    try { backendProcess.kill(); } catch (_) {}
    backendProcess = null;
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

  // Menu sadələşdir (lazımsa tam sil)
  Menu.setApplicationMenu(null);

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}/`).catch((err) => {
    console.error("loadURL xətası:", err);
    dialog.showErrorBox("Yükləmə xətası", err.message);
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

// ─────────── App lifecycle ───────────
app.whenReady().then(async () => {
  startBackend();

  try {
    await waitForPort(PORT);
  } catch (err) {
    dialog.showErrorBox("Server başlamadı", err.message);
    app.quit();
    return;
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", stopBackend);
app.on("quit", stopBackend);

// Tək instance — eyni anda iki dəfə açılmasın
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
