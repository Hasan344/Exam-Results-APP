const express = require("express");
const router = express.Router();
const db = require("./database");

router.put("/:orderNo", (req, res) => {
  const { orderNo } = req.params;
  const { resultAppeal, resultAppeal2 } = req.body;

  // Önce öğrencinin subject_id'sini al
  db.get("SELECT subject_id, result_appeal FROM students WHERE orderNo = ?", [orderNo], (err, student) => {
    if (err) return res.status(500).json(err);
    if (!student) return res.status(404).json({ message: "Öğrenci bulunamadı" });

    let query = "";
    let params = [];

    if (student.subject_id === 4) {
      if (!student.result_appeal) {
        // İlk kayıt → sadece result_appeal yaz
        query = "UPDATE students SET result_appeal = ? WHERE orderNo = ?";
        params = [resultAppeal ?? null, orderNo];
      } else {
        // İkinci kayıt → sadece result_appeal2 yaz
        query = "UPDATE students SET result_appeal2 = ? WHERE orderNo = ?";
        params = [resultAppeal2 ?? null, orderNo];
      }
    } else {
      query = "UPDATE students SET result_appeal = ? WHERE orderNo = ?";
      params = [resultAppeal ?? null, orderNo];
    }

    db.run(query, params, function (err) {
      if (err) return res.status(500).json(err);
      res.json({ message: "Appeal kaydedildi ✔" });
    });
  });
});

module.exports = router;