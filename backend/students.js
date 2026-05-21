const express = require("express");
const router = express.Router();
const db = require("./database");

router.get("/", (req, res) => {
  db.all("SELECT * FROM students ORDER BY orderNo", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

router.get("/exam-dates", (req, res) => {
  db.all(
    "SELECT DISTINCT exam_date FROM students WHERE exam_date IS NOT NULL ORDER BY exam_date",
    [],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows.map(r => r.exam_date));
    }
  );
});

router.get("/order/:orderNo", (req, res) => {
  const { orderNo } = req.params;
  const { buildingCode, examDate } = req.query;

  db.get(
    "SELECT * FROM students WHERE orderNo = ? AND building_id = ? AND exam_date = ?",
    [orderNo, buildingCode, examDate],
    (err, row) => {
      if (err) return res.status(500).json(err);
      if (!row)
        return res.status(404).json({ message: "Bu bina və tarixdə tələbə tapılmadı" });
      res.json(row);
    }
  );
});

// Nəticələr siyahısı:
// section != 3 olanlar üçün students.result sütunu.
// section == 3 olanlar üçün StudentResults cədvəlindəki ekspert balları.
router.get("/results", (req, res) => {
  const { buildingCode, examDate, subjectId, examId } = req.query;

  let query = `
    SELECT
      s.id, s.name, s.middleName, s.surname,
      s.result, s.result2,
      s.result_appeal, s.result_appeal2,
      s.subject_id, s.orderNo,
      sub.sectionId
    FROM students s
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    WHERE 1=1
  `;
  const params = [];

  if (buildingCode) { query += " AND s.building_id = ?"; params.push(buildingCode); }
  if (examDate)     { query += " AND s.exam_date = ?";   params.push(examDate); }

  query += " ORDER BY s.orderNo";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json(err);

    if (!examId) return res.json(rows);

    const section3Ids = rows.filter(r => r.sectionId === 3).map(r => r.id);
    if (section3Ids.length === 0) return res.json(rows);

    const placeholders = section3Ids.map(() => "?").join(",");
    db.all(
      `SELECT sr.studentId, sr.score, sr.expertId,
              e.name AS expertName, e.surname AS expertSurname, e.middlename AS expertMiddlename
       FROM StudentResults sr
       JOIN Experts e ON e.id = sr.expertId
       WHERE sr.examId = ? AND sr.studentId IN (${placeholders})`,
      [examId, ...section3Ids],
      (err2, scoreRows) => {
        if (err2) return res.status(500).json({ message: err2.message });
        const byStudent = {};
        for (const sr of scoreRows) {
          if (!byStudent[sr.studentId]) byStudent[sr.studentId] = [];
          byStudent[sr.studentId].push(sr);
        }
        const enriched = rows.map(r => ({
          ...r,
          expertScores: r.sectionId === 3 ? (byStudent[r.id] || []) : undefined,
        }));
        res.json(enriched);
      }
    );
  });
});

router.get("/buildings", (req, res) => {
  db.all("SELECT * FROM buildings ORDER BY code", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// Bal saxla — exercise_id ilə (köhnə subjectId parametri də qəbul edilir — geriyə uyğunluq)
router.post("/:id/result", (req, res) => {
  const { id } = req.params;
  const { exerciseId, subjectId, buildingCode, examDate, value, field } = req.body;
  const usedExerciseId = exerciseId ?? subjectId; // köhnə kod uyğunluğu

  const targetField = field === "result2" ? "result2" : "result";

  const query = `UPDATE students SET ${targetField} = ?, subject_id = ?, building_id = ?, exam_date = ? WHERE id = ?`;
  const params = [value, usedExerciseId, buildingCode, examDate, id];

  db.run(query, params, function (err) {
    if (err) return res.status(500).json(err);
    if (this.changes === 0) return res.status(404).json({ message: "Tələbə tapılmadı" });
    res.json({ message: "Kaydedildi ✔" });
  });
});

// ───────────────────── section = 3 flow ─────────────────────

router.get("/:id/section3-results", (req, res) => {
  const { id } = req.params;
  const { examId } = req.query;
  if (!examId) return res.status(400).json({ message: "examId tələb olunur" });

  db.all(
    `SELECT sr.*, e.name AS expertName, e.surname AS expertSurname, e.middlename AS expertMiddlename
     FROM StudentResults sr
     JOIN Experts e ON e.id = sr.expertId
     WHERE sr.studentId = ? AND sr.examId = ?
     ORDER BY e.surname, e.name`,
    [id, examId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
});

// section=3 üçün bal saxla — exerciseId ilə (köhnə subjectId da qəbul edilir)
router.post("/:id/section3-result", (req, res) => {
  const { id } = req.params;
  const { examId, expertId, score, exerciseId, subjectId } = req.body;
  const usedExerciseId = exerciseId ?? subjectId;

  if (!examId || !expertId || score === undefined || score === null) {
    return res.status(400).json({ message: "examId, expertId və score tələb olunur" });
  }
  if (!usedExerciseId) {
    return res.status(400).json({ message: "exerciseId tələb olunur" });
  }

  // Exercise-in section=3 olduğunu yoxla (exercise cədvəlindən, fallback subjects)
  db.get("SELECT sectionId FROM exercises WHERE id = ?", [usedExerciseId], (err, ex) => {
    if (err || !ex) {
      // Fallback: köhnə subjects cədvəli
      db.get("SELECT sectionId FROM subjects WHERE id = ?", [usedExerciseId], (err2, sub) => {
        if (err2) return res.status(500).json({ message: err2.message });
        if (!sub) return res.status(404).json({ message: "Exercise tapılmadı" });
        if (sub.sectionId !== 3) {
          return res.status(400).json({ message: "Ekspert balları yalnız section=3 üçün qeydə alınır" });
        }
        doUpsert();
      });
      return;
    }
    if (ex.sectionId !== 3) {
      return res.status(400).json({ message: "Ekspert balları yalnız section=3 üçün qeydə alınır" });
    }
    doUpsert();
  });

  function doUpsert() {
    db.get(
      "SELECT id FROM ExamExperts WHERE ExamId = ? AND ExpertId = ?",
      [examId, expertId],
      (err, ee) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!ee) return res.status(400).json({ message: "Bu ekspert həmin imtahana təyin olunmayıb" });

        db.run(
          `INSERT INTO StudentResults (studentId, examId, expertId, score)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(studentId, examId, expertId)
           DO UPDATE SET score = excluded.score, updatedAt = CURRENT_TIMESTAMP`,
          [id, examId, expertId, Number(score)],
          function (err) {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Qeydə alındı ✔" });
          }
        );
      }
    );
  }
});

// ─────────────────── Foto endpoint ───────────────────
const path = require("path");
const fs = require("fs");

const PHOTOS_DIR = process.env.PHOTOS_DIR || path.join(__dirname, "photos");

router.get("/:id/photo", (req, res) => {
  const { id } = req.params;
  db.get("SELECT photo_path FROM students WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row || !row.photo_path) {
      return res.status(404).json({ message: "Foto yoxdur" });
    }

    let filePath = row.photo_path;
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(PHOTOS_DIR, filePath);
    }

    const resolved = path.resolve(filePath);
    const allowedRoot = path.resolve(PHOTOS_DIR);
    if (!resolved.startsWith(allowedRoot)) {
      return res.status(400).json({ message: "Keçərsiz yol" });
    }

    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ message: "Fayl tapılmadı" });
    }

    res.setHeader("Cache-Control", "public, max-age=3600");
    res.sendFile(resolved);
  });
});

module.exports = router;