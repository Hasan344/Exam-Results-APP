// backend/database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// ─────────── DB yolunu seç ───────────
//
// Development: backend/database.db (köhnə davranış)
// Production (Electron):
//   • Windows: %APPDATA%/<AppName>/database.db
//   • macOS:   ~/Library/Application Support/<AppName>/database.db
//   • Linux:   ~/.config/<AppName>/database.db
//
// Səbəb: Electron-un asar paketi yalnız oxumaq üçündür; DB yazıla bilməz.
// Ona görə user data qovluğunda yerləşdiririk.

function resolveDbPath() {
  // Electron main process bunu DB_PATH env-ə qoyacaq
  if (process.env.DB_PATH) {
    const dir = path.dirname(process.env.DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // İlk dəfə yaradılırsa, paketdəki seed DB-ni kopyala
    if (!fs.existsSync(process.env.DB_PATH)) {
      const seed = path.join(__dirname, "database.db");
      if (fs.existsSync(seed)) {
        fs.copyFileSync(seed, process.env.DB_PATH);
        console.log("📦 Seed DB kopyalandı:", process.env.DB_PATH);
      }
    }
    return process.env.DB_PATH;
  }

  // Development: layihə kökündə
  return path.join(__dirname, "database.db");
}

const DB_PATH = resolveDbPath();
console.log("🗄️  SQLite path:", DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("DB bağlantı xətası:", err.message);
  } else {
    console.log("SQLite bağlandı ✔");
  }
});

module.exports = db;
