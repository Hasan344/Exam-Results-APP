// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// ─────────── Konfiqurasiya ───────────
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === "production";

// Frontend build qovluğu tapmaq üçün bir neçə yol sınayırıq:
//   1) process.resourcesPath/frontend/dist  ← Electron paketinin extraResources yeri
//   2) __dirname/../frontend/dist           ← Dev modu (layihə kökü)
function resolveFrontendDist() {
  const candidates = [];
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, "frontend", "dist"));
  }
  candidates.push(path.resolve(__dirname, "..", "frontend", "dist"));

  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "index.html"))) {
      console.log("📦 Frontend dist tapıldı:", c);
      return c;
    }
  }
  console.warn("⚠️ Frontend dist tapılmadı. Axtarılan yollar:", candidates);
  return null;
}

const FRONTEND_PATH = resolveFrontendDist();

// ─────────── Middleware ───────────
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// API health-check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, mode: IS_PROD ? "production" : "development" });
});

// ─────────── ROUTES ───────────
const subjectsRoutes = require("./subjects");
const studentsRoutes = require("./students");
const appealRoutes   = require("./appeal");
const authRoutes     = require("./auth");
const sectionsRoutes = require("./sections");
const expertsRoutes  = require("./experts");
const examsRoutes    = require("./exams");
const importsRoutes  = require("./imports");

app.use("/subjects", subjectsRoutes);
app.use("/students", studentsRoutes);
app.use("/appeal",   appealRoutes);
app.use("/auth",     authRoutes);
app.use("/sections", sectionsRoutes);
app.use("/experts",  expertsRoutes);
app.use("/exams",    examsRoutes);
app.use("/imports",  importsRoutes);

// ─────────── Static Frontend ───────────
if (FRONTEND_PATH) {
  app.use(express.static(FRONTEND_PATH));

  // SPA fallback (yalnız API olmayan yollar üçün)
  app.get(/^(?!\/api\/|\/subjects|\/students|\/sections|\/appeal|\/auth|\/experts|\/exams|\/imports).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, "index.html"));
  });
}

// ─────────── Xəta middleware ───────────
app.use((err, req, res, next) => {
  console.error("Server xətası:", err);
  res.status(500).json({ message: err.message || "Daxili server xətası" });
});

// ─────────── Server başlat ───────────
const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 Server ${PORT} portunda işləyir: http://localhost:${PORT}`);
});

server.on("error", (err) => {
  console.error("Server.listen xətası:", err);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT",  () => server.close(() => process.exit(0)));

module.exports = server;
