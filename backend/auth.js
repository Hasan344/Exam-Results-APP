const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("./database");

// POST /auth/login
// body: { name, password }
router.post("/login", (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Ad və parol tələb olunur" });
  }

  db.get(
    "SELECT * FROM auth_table WHERE name = ?",
    [name],
    async (err, row) => {
      if (err) return res.status(500).json({ message: "DB xətası" });
      if (!row) return res.status(401).json({ message: "Ad və ya parol yanlışdır" });

      const match = await bcrypt.compare(password, row.password);
      if (!match) return res.status(401).json({ message: "Ad və ya parol yanlışdır" });

      res.json({ success: true, name: row.name });
    }
  );
});

module.exports = router;