// hash-passwords.js
// Bir dəfəlik işlət: node hash-passwords.js
// Bütün auth_table şifrələrini bcrypt ilə hash-ləyir

const bcrypt = require("bcrypt");
const db = require("./database");

const SALT_ROUNDS = 12;

db.all("SELECT id, name, password FROM auth_table", [], async (err, rows) => {
  if (err) { console.error("DB xətası:", err); process.exit(1); }

  for (const row of rows) {
    // Artıq hash-lənibsə keç ($2b$ ilə başlayır)
    if (row.password.startsWith("$2b$") || row.password.startsWith("$2a$")) {
      console.log(`[SKIP] ${row.name} — artıq hash-lənib`);
      continue;
    }

    const hashed = await bcrypt.hash(row.password, SALT_ROUNDS);
    await new Promise((res, rej) => {
      db.run("UPDATE auth_table SET password = ? WHERE id = ?", [hashed, row.id], (e) => {
        if (e) rej(e); else res();
      });
    });
    console.log(`[OK]   ${row.name} — hash-ləndi`);
  }

  console.log("\nHazır. Bu faylı silə bilərsiniz.");
  db.close();
});
