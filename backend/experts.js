const express = require("express");
const router = express.Router();
const db = require("../.claude/worktrees/condescending-carson-518c9a/backend/database");

// Bütün ekspertləri gətir
router.get("/", (req, res) => {
  db.all("SELECT * FROM Experts ORDER BY surname, name", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// Yeni ekspert əlavə et
router.post("/", (req, res) => {
  const { name, surname, middlename } = req.body;
  if (!name || !surname) return res.status(400).json({ message: "name və surname tələb olunur" });
  db.run(
    "INSERT INTO Experts (name, surname, middlename) VALUES (?, ?, ?)",
    [name, surname, middlename || null],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ id: this.lastID, name, surname, middlename });
    }
  );
});

// Ekspert yenilə
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, surname, middlename } = req.body;
  db.run(
    "UPDATE Experts SET name = ?, surname = ?, middlename = ? WHERE id = ?",
    [name, surname, middlename || null, id],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: "Ekspert tapılmadı" });
      res.json({ message: "Yeniləndi ✔" });
    }
  );
});

// Ekspert sil
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM Experts WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Ekspert tapılmadı" });
    res.json({ message: "Silindi ✔" });
  });
});

module.exports = router;
