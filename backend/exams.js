const express = require("express");
const router = express.Router();
const db = require("../.claude/worktrees/condescending-carson-518c9a/backend/database");

// Bütün imtahanları gətir
router.get("/", (req, res) => {
  db.all("SELECT * FROM Exams ORDER BY Date DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// Yeni imtahan
router.post("/", (req, res) => {
  const { Name, Date: date } = req.body;
  if (!Name || !date) return res.status(400).json({ message: "Name və Date tələb olunur" });
  db.run(
    "INSERT INTO Exams (Name, Date) VALUES (?, ?)",
    [Name, date],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ id: this.lastID, Name, Date: date });
    }
  );
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { Name, Date: date } = req.body;
  db.run(
    "UPDATE Exams SET Name = ?, Date = ? WHERE id = ?",
    [Name, date, id],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: "İmtahan tapılmadı" });
      res.json({ message: "Yeniləndi ✔" });
    }
  );
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM Exams WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "İmtahan tapılmadı" });
    res.json({ message: "Silindi ✔" });
  });
});

// Bir imtahana təyin olunmuş ekspertlər
router.get("/:id/experts", (req, res) => {
  const { id } = req.params;
  db.all(
    `SELECT e.*, ee.id AS examExpertId
     FROM ExamExperts ee
     JOIN Experts e ON e.id = ee.ExpertId
     WHERE ee.ExamId = ?
     ORDER BY e.surname, e.name`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
});

// İmtahana ekspert əlavə et
router.post("/:id/experts", (req, res) => {
  const { id } = req.params;
  const { expertId } = req.body;
  if (!expertId) return res.status(400).json({ message: "expertId tələb olunur" });

  db.get(
    "SELECT id FROM ExamExperts WHERE ExamId = ? AND ExpertId = ?",
    [id, expertId],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (row) return res.status(409).json({ message: "Bu ekspert artıq təyin olunub" });

      db.run(
        "INSERT INTO ExamExperts (ExamId, ExpertId) VALUES (?, ?)",
        [id, expertId],
        function (err) {
          if (err) return res.status(500).json({ message: err.message });
          res.json({ id: this.lastID, ExamId: Number(id), ExpertId: expertId });
        }
      );
    }
  );
});

// İmtahandan ekspert sil
router.delete("/:id/experts/:expertId", (req, res) => {
  const { id, expertId } = req.params;
  db.run(
    "DELETE FROM ExamExperts WHERE ExamId = ? AND ExpertId = ?",
    [id, expertId],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: "Təyinat tapılmadı" });
      res.json({ message: "Silindi ✔" });
    }
  );
});

module.exports = router;
