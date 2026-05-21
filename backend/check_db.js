// backend/check_db.js
// İşlət: node check_db.js
//
// DB-də hansı cədvəllərin və sütunların olduğunu yoxlayır.
// `exercises` cədvəli ilə bağlı problemləri tapmaq üçün.

const db = require("./database");

db.serialize(() => {
  console.log("\n═══ DB-də olan bütün cədvəllər ═══");
  db.all(
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
    [],
    (err, tables) => {
      if (err) { console.error("Xəta:", err.message); db.close(); return; }

      console.log(tables.map(t => "  • " + t.name).join("\n"));

      // exercise-əlaqəli cədvəllərin sütunlarını göstər
      const targets = tables
        .map(t => t.name)
        .filter(n => ["exercises", "exercise", "subjects"].includes(n));

      if (targets.length === 0) {
        console.log("\n⚠️  exercises / exercise / subjects cədvəllərinin heç biri tapılmadı!");
        db.close();
        return;
      }

      let done = 0;
      targets.forEach(table => {
        db.all(`PRAGMA table_info(${table})`, [], (err, cols) => {
          console.log(`\n═══ "${table}" cədvəlinin sütunları ═══`);
          if (err) {
            console.error("  Xəta:", err.message);
          } else {
            cols.forEach(c => console.log(`  • ${c.name} (${c.type})`));
          }

          // İlk 3 sətri göstər
          db.all(`SELECT * FROM ${table} LIMIT 3`, [], (err2, rows) => {
            console.log(`\n  İlk 3 sətir:`);
            if (err2) {
              console.error("  Xəta:", err2.message);
            } else if (rows.length === 0) {
              console.log("  (boş)");
            } else {
              console.log("  " + JSON.stringify(rows, null, 2).replace(/\n/g, "\n  "));
            }

            done++;
            if (done === targets.length) db.close();
          });
        });
      });
    }
  );
});