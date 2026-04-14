const express = require("express");
const router = express.Router();
const db = require("./database");

// tüm öğrenciler
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
      name, middleName, surname,
      result, result2,
      result_appeal, result_appeal2,
      subject_id, orderNo
    FROM students
    WHERE 1=1
  `;
  const params = [];

  if (buildingCode) { query += " AND building_id = ?"; params.push(buildingCode); }
  if (examDate)     { query += " AND exam_date = ?";   params.push(examDate); }
  if (subjectId)    { query += " AND subject_id = ?";  params.push(subjectId); }

  query += " ORDER BY orderNo";

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

router.post("/:id/result", (req, res) => {
  const { id } = req.params;
  const { subjectId, buildingCode, examDate, result, result2 } = req.body;

  let query = "";
  let params = [];

  if (subjectId === 4) {
    if (result && !result2) {
      query = "UPDATE students SET result = ?, subject_id = ?, building_id = ?, exam_date = ? WHERE id = ?";
      params = [result, subjectId, buildingCode, examDate, id];
    } else {
      query = "UPDATE students SET result2 = ?, subject_id = ?, building_id = ?, exam_date = ? WHERE id = ?";
      params = [result2, subjectId, buildingCode, examDate, id];
    }
  } else {
    query = "UPDATE students SET result = ?, subject_id = ?, building_id = ?, exam_date = ? WHERE id = ?";
    params = [result, subjectId, buildingCode, examDate, id];
  }

  db.run(query, params, function (err) {
    if (err) return res.status(500).json(err);
    res.json({ message: "Kaydedildi ✔" });
  });
});

module.exports = router;