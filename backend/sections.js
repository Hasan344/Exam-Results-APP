const express = require("express");
const router = express.Router();
const db = require("./database");

router.get("/", (req, res) => {
  db.all("SELECT * FROM Sections ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows || []);
  });
});

// Helper: hansı cədvəlin mövcud olduğunu tap (exercises / exercise / subjects)
function detectExerciseTable(cb) {
  db.all(
    `SELECT name FROM sqlite_master
     WHERE type='table' AND name IN ('exercises','exercise','subjects')`,
    [],
    (err, rows) => {
      if (err) return cb(err);
      const names = (rows || []).map(r => r.name);
      if (names.includes("exercises")) return cb(null, "exercises");
      if (names.includes("exercise"))  return cb(null, "exercise");
      if (names.includes("subjects"))  return cb(null, "subjects");
      cb(null, null);
    }
  );
}

// Helper: cədvəlin sütun adlarını qaytar
function getColumns(table, cb) {
  db.all(`PRAGMA table_info(${table})`, [], (err, cols) => {
    if (err) return cb(err);
    cb(null, (cols || []).map(c => c.name));
  });
}

// GET /sections/:sectionId/exercises
// Tabloyu və sütun adlarını avtomatik aşkar edir
router.get("/:sectionId/exercises", (req, res) => {
  const { sectionId } = req.params;

  detectExerciseTable((err, table) => {
    if (err)    return res.status(500).json({ message: err.message });
    if (!table) return res.json([]); // heç bir uyğun cədvəl yoxdur

    getColumns(table, (err2, cols) => {
      if (err2) return res.status(500).json({ message: err2.message });

      // section bağlantı sütununu tap (sectionId / section_id / SectionId)
      const sectionCol = cols.find(c =>
        c.toLowerCase() === "sectionid" || c.toLowerCase() === "section_id"
      );

      // name sütunu (name / Name)
      const nameCol = cols.find(c => c.toLowerCase() === "name");

      if (!sectionCol || !nameCol) {
        // sütunlar gözlənilməz formatdadır — bütün sətirləri qaytar
        return db.all(`SELECT * FROM ${table}`, [], (err3, rows) => {
          if (err3) return res.status(500).json({ message: err3.message });
          res.json(rows || []);
        });
      }

      // Hər iki halda frontend "name" lower-case gözləyir → alias
      const selectName = nameCol === "name" ? "name" : `${nameCol} AS name`;
      const codeCol = cols.find(c => c.toLowerCase() === "code");
      const selectCode = codeCol ? `, ${codeCol} AS code` : "";

      const sql = `
        SELECT id, ${selectName}${selectCode}, ${sectionCol} AS sectionId
        FROM ${table}
        WHERE ${sectionCol} = ?
        ORDER BY id
      `;
      db.all(sql, [sectionId], (err3, rows) => {
        if (err3) {
          console.error("[sections/:id/exercises] SQL xətası:", err3.message, "| SQL:", sql);
          return res.status(500).json({ message: err3.message });
        }
        res.json(rows || []);
      });
    });
  });
});

// Köhnə subjects endpoint — geriyə uyğunluq
router.get("/:sectionId/subjects", (req, res) => {
  const { sectionId } = req.params;
  db.all(
    "SELECT * FROM subjects WHERE sectionId = ? ORDER BY id",
    [sectionId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows || []);
    }
  );
});

module.exports = router;