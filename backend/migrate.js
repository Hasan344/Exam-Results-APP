// Bir dəfə işlət: node migrate.js
// Experts / Exams / ExamExperts tabloları zatən yaradılmış olmalıdır.
// Bu migration StudentResults tablosunu yaradır.
//
// QEYD: students.result2 / result3 sütunları silinmir —
// section != 3 olan amma 2-ci balı olan fənnlər (məs. subject 4) hələ də onları istifadə edir.
// section = 3 üçün bütün ekspert balları yalnız StudentResults-də saxlanılır.

const db = require("../.claude/worktrees/condescending-carson-518c9a/backend/database");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS StudentResults (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      examId    INTEGER NOT NULL,
      expertId  INTEGER NOT NULL,
      score     REAL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(studentId, examId, expertId),
      FOREIGN KEY(studentId) REFERENCES students(id),
      FOREIGN KEY(examId)    REFERENCES Exams(id),
      FOREIGN KEY(expertId)  REFERENCES Experts(id)
    )
  `, (err) => {
    if (err) console.error("StudentResults yaradılma xətası:", err.message);
    else console.log("StudentResults hazırdır ✔");
    db.close();
  });
});
