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
      s.result,
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

    // section=3 olan tələbələr üçün ekspert ballarını əlavə et
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

// section != 3 flow — tək result sütunu
router.post("/:id/result", (req, res) => {
  const { id } = req.params;
  const { subjectId, buildingCode, examDate, value } = req.body;

  const query = `UPDATE students SET result = ?, subject_id = ?, building_id = ?, exam_date = ? WHERE id = ?`;
  const params = [value, subjectId, buildingCode, examDate, id];

  db.run(query, params, function (err) {
    if (err) return res.status(500).json(err);
    if (this.changes === 0) return res.status(404).json({ message: "Tələbə tapılmadı" });
    res.json({ message: "Kaydedildi ✔" });
  });
});

// ───────────────────── section = 3 flow ─────────────────────

// Bir tələbənin bir imtahandakı bütün ekspert balları
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

// section=3 üçün bal yadda saxla (upsert).
// Validasiya: subject section=3 olmalıdır, və (examId, expertId) ExamExperts-də olmalıdır.
router.post("/:id/section3-result", (req, res) => {
  const { id } = req.params;
  const { examId, expertId, score, subjectId } = req.body;

  if (!examId || !expertId || score === undefined || score === null) {
    return res.status(400).json({ message: "examId, expertId və score tələb olunur" });
  }
  if (!subjectId) {
    return res.status(400).json({ message: "subjectId tələb olunur" });
  }

  // Subject-in section=3 olduğunu təsdiq et
  db.get("SELECT sectionId FROM subjects WHERE id = ?", [subjectId], (err, sub) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!sub) return res.status(404).json({ message: "Fənn tapılmadı" });
    if (sub.sectionId !== 3) {
      return res.status(400).json({ message: "Ekspert balları yalnız section=3 üçün qeydə alınır" });
    }

    // Ekspert bu imtahana təyin olunubmu?
    db.get(
      "SELECT id FROM ExamExperts WHERE ExamId = ? AND ExpertId = ?",
      [examId, expertId],
      (err, ee) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!ee) return res.status(400).json({ message: "Bu ekspert həmin imtahana təyin olunmayıb" });

        // Upsert
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
  });
});

module.exports = router;
