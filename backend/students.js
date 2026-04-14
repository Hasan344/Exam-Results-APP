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

router.get("/results", (req, res) => {
  const { buildingCode, examDate, subjectId } = req.query;

  let query = `
    SELECT
      s.name, s.middleName, s.surname,
      s.result, s.result2, s.result3,
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
  if (subjectId)    { query += " AND s.subject_id = ?";  params.push(subjectId); }

  query += " ORDER BY s.orderNo";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

router.get("/buildings", (req, res) => {
  db.all("SELECT * FROM buildings ORDER BY code", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// field: "result" | "result2" | "result3"
// value: number
router.post("/:id/result", (req, res) => {
  const { id } = req.params;
  const { subjectId, buildingCode, examDate, field, value } = req.body;

  const allowed = ["result", "result2", "result3"];
  if (!allowed.includes(field)) {
    return res.status(400).json({ message: "Yanlış sahə adı" });
  }

  const query = `UPDATE students SET ${field} = ?, subject_id = ?, building_id = ?, exam_date = ? WHERE id = ?`;
  const params = [value, subjectId, buildingCode, examDate, id];

  db.run(query, params, function (err) {
    if (err) return res.status(500).json(err);
    if (this.changes === 0) return res.status(404).json({ message: "Tələbə tapılmadı" });
    res.json({ message: "Kaydedildi ✔" });
  });
});

module.exports = router;