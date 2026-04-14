const express = require("express");
const router = express.Router();
const db = require("./database");

router.put("/:orderNo", (req, res) => {
  const { orderNo } = req.params;
  const { field, value } = req.body;
  // field: "result_appeal" | "result_appeal2"
  // value: number

  const allowed = ["result_appeal", "result_appeal2"];
  if (!allowed.includes(field)) {
    return res.status(400).json({ message: "Yanlış sahə adı" });
  }

  db.run(
    `UPDATE students SET ${field} = ? WHERE orderNo = ?`,
    [value, orderNo],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: "Tələbə tapılmadı" });
      res.json({ message: "Qeydə alındı ✔" });
    }
  );
});

module.exports = router;