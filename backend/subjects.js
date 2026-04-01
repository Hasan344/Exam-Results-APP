const express = require("express");
const router = express.Router();
const db = require("./database");

// tüm dersleri getir
router.get("/", (req, res) => {
  db.all("SELECT * FROM subjects ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

module.exports = router;