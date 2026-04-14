const express = require("express");
const router = express.Router();
const db = require("./database");

// Bütün section-ları gətir
router.get("/", (req, res) => {
  db.all("SELECT * FROM Sections ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// Section-a aid subject-ləri gətir
router.get("/:sectionId/subjects", (req, res) => {
  const { sectionId } = req.params;
  db.all(
    "SELECT * FROM subjects WHERE sectionId = ? ORDER BY id",
    [sectionId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

module.exports = router;
