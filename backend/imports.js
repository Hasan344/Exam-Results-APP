// backend/imports.js
//
// Excel (xlsx/xls) və CSV fayllarından mass import:
//   POST /imports/exams         → Exams       (Name, Date)
//   POST /imports/experts       → Experts     (name, surname, middlename)
//   POST /imports/exam-experts  → ExamExperts (ExamId, ExpertId)
//
// Hər endpoint multipart/form-data ilə tək "file" sahəsi gözləyir.
// Excel sütun başlıqları SQLite cədvəl sütunları ilə eyni olmalıdır
// (böyük/kiçik hərfə həssas deyil, boşluqlar trim olunur).

const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const router = express.Router();
const db = require("./database");

// Faylı diskə yazmadan yaddaşda saxla
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─────────────────── köməkçi funksiyalar ───────────────────

// Excel / CSV bufferini obyekt massivinə çevir
function parseWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) throw new Error("Faylda iş vərəqi tapılmadı");
  const ws = wb.Sheets[firstSheet];
  // defval: "" → boş xanalar da gəlsin, keçici boşluqlar olmasın
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
  return rows;
}

// Sütun adlarını normallaşdır: case-insensitive və trim
// verilən row-un key-lərini lowercase → trim versiyaya uyğunlaşdırır
function pickField(row, ...candidates) {
  const lookup = {};
  for (const k of Object.keys(row)) {
    lookup[String(k).trim().toLowerCase()] = k;
  }
  for (const c of candidates) {
    const key = lookup[String(c).trim().toLowerCase()];
    if (key !== undefined) {
      const val = row[key];
      if (val === null || val === undefined) return "";
      return String(val).trim();
    }
  }
  return "";
}

// Datanı YYYY-MM-DD formatına çevir (Excel date, string və s. qəbul edir)
function normalizeDate(raw) {
  if (!raw) return "";
  // Əgər artıq Date obyektidirsə
  if (raw instanceof Date && !isNaN(raw)) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, "0");
    const d = String(raw.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(raw).trim();
  // Onsuz da YYYY-MM-DD-dirsə
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD.MM.YYYY və ya DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = "20" + y;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Fallback: Date parse
  const parsed = new Date(s);
  if (!isNaN(parsed)) {
    const y = parsed.getFullYear();
    const mo = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  return s; // dəyişdirə bilmədik — olduğu kimi qaytar
}

// Serialized (bir-bir növbə ilə) Promise-ləri icra et
async function runSerial(items, fn) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    try {
      results.push({ index: i, ok: true, data: await fn(items[i], i) });
    } catch (err) {
      results.push({
        index: i,
        ok: false,
        error: err?.message || String(err),
      });
    }
  }
  return results;
}

// db.run-un promise versiyası
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// ─────────────────── POST /imports/exams ───────────────────
// Gözlənilən sütunlar: Name, Date
router.post("/exams", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Fayl yüklənməyib" });

  let rows;
  try {
    rows = parseWorkbook(req.file.buffer);
  } catch (err) {
    return res.status(400).json({ message: "Faylı oxumaq mümkün olmadı: " + err.message });
  }

  if (rows.length === 0) {
    return res.status(400).json({ message: "Faylda məlumat yoxdur" });
  }

  const results = await runSerial(rows, async (row, idx) => {
    const Name = pickField(row, "Name", "Ad", "ExamName");
    const rawDate = pickField(row, "Date", "Tarix", "ExamDate");
    const Date = normalizeDate(rawDate);

    if (!Name) throw new Error(`Sətir ${idx + 2}: "Name" sütunu boşdur`);
    if (!Date) throw new Error(`Sətir ${idx + 2}: "Date" sütunu boşdur`);

    const r = await dbRun(
      "INSERT INTO Exams (Name, Date) VALUES (?, ?)",
      [Name, Date]
    );
    return { id: r.lastID, Name, Date };
  });

  const inserted = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  res.json({
    message: `${inserted} imtahan əlavə edildi${failed.length ? `, ${failed.length} xəta` : ""}`,
    inserted,
    failed: failed.length,
    errors: failed.map(f => f.error),
  });
});

// ─────────────────── POST /imports/experts ───────────────────
// Gözlənilən sütunlar: name, surname, middlename
router.post("/experts", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Fayl yüklənməyib" });

  let rows;
  try {
    rows = parseWorkbook(req.file.buffer);
  } catch (err) {
    return res.status(400).json({ message: "Faylı oxumaq mümkün olmadı: " + err.message });
  }

  if (rows.length === 0) {
    return res.status(400).json({ message: "Faylda məlumat yoxdur" });
  }

  const results = await runSerial(rows, async (row, idx) => {
    const name = pickField(row, "name", "Ad");
    const surname = pickField(row, "surname", "Soyad");
    const middlename = pickField(row, "middlename", "middleName", "Ata adı", "AtaAdi");

    if (!name) throw new Error(`Sətir ${idx + 2}: "name" sütunu boşdur`);
    if (!surname) throw new Error(`Sətir ${idx + 2}: "surname" sütunu boşdur`);

    const r = await dbRun(
      "INSERT INTO Experts (name, surname, middlename) VALUES (?, ?, ?)",
      [name, surname, middlename || null]
    );
    return { id: r.lastID, name, surname, middlename };
  });

  const inserted = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  res.json({
    message: `${inserted} ekspert əlavə edildi${failed.length ? `, ${failed.length} xəta` : ""}`,
    inserted,
    failed: failed.length,
    errors: failed.map(f => f.error),
  });
});

// ─────────────────── POST /imports/exam-experts ───────────────────
// Gözlənilən sütunlar: ExamId, ExpertId
// (dublikatlar 409 deyil, xəta olaraq yığılır; INSERT OR IGNORE istifadə etmirik
// ki, istifadəçi hansı sətirlərin ötürüldüyünü bilsin)
router.post("/exam-experts", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Fayl yüklənməyib" });

  let rows;
  try {
    rows = parseWorkbook(req.file.buffer);
  } catch (err) {
    return res.status(400).json({ message: "Faylı oxumaq mümkün olmadı: " + err.message });
  }

  if (rows.length === 0) {
    return res.status(400).json({ message: "Faylda məlumat yoxdur" });
  }

  const results = await runSerial(rows, async (row, idx) => {
    const ExamIdStr = pickField(row, "ExamId", "ImtahanId", "exam_id");
    const ExpertIdStr = pickField(row, "ExpertId", "EkspertId", "expert_id");

    if (!ExamIdStr) throw new Error(`Sətir ${idx + 2}: "ExamId" boşdur`);
    if (!ExpertIdStr) throw new Error(`Sətir ${idx + 2}: "ExpertId" boşdur`);

    const ExamId = Number(ExamIdStr);
    const ExpertId = Number(ExpertIdStr);
    if (!Number.isInteger(ExamId) || ExamId <= 0) {
      throw new Error(`Sətir ${idx + 2}: ExamId düzgün tam ədəd deyil`);
    }
    if (!Number.isInteger(ExpertId) || ExpertId <= 0) {
      throw new Error(`Sətir ${idx + 2}: ExpertId düzgün tam ədəd deyil`);
    }

    // Foreign key validasiyası
    const exam = await dbGet("SELECT id FROM Exams WHERE id = ?", [ExamId]);
    if (!exam) throw new Error(`Sətir ${idx + 2}: ExamId=${ExamId} mövcud deyil`);

    const expert = await dbGet("SELECT id FROM Experts WHERE id = ?", [ExpertId]);
    if (!expert) throw new Error(`Sətir ${idx + 2}: ExpertId=${ExpertId} mövcud deyil`);

    // Dublikat?
    const exists = await dbGet(
      "SELECT id FROM ExamExperts WHERE ExamId = ? AND ExpertId = ?",
      [ExamId, ExpertId]
    );
    if (exists) {
      throw new Error(`Sətir ${idx + 2}: bu bağlantı artıq mövcuddur (ExamId=${ExamId}, ExpertId=${ExpertId})`);
    }

    const r = await dbRun(
      "INSERT INTO ExamExperts (ExamId, ExpertId) VALUES (?, ?)",
      [ExamId, ExpertId]
    );
    return { id: r.lastID, ExamId, ExpertId };
  });

  const inserted = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  res.json({
    message: `${inserted} bağlantı əlavə edildi${failed.length ? `, ${failed.length} xəta` : ""}`,
    inserted,
    failed: failed.length,
    errors: failed.map(f => f.error),
  });
});

module.exports = router;
