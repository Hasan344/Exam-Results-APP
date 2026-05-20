// hash-passwords.js
// Bir dəfəlik işlət: node hash-passwords.js
// Bütün auth_table şifrələrini bcryptjs ilə hash-ləyir
//
// MÜHÜM: bcryptjs $2a$ prefiksi yaradır (bcrypt $2b$ yaradırdı).
// Hər iki prefiks bcrypt.compare ilə uyğun gəlir, ona görə əvvəlki
// hash-lənmiş parollar yenidən işləməyə davam edir.

const bcrypt = require("bcryptjs");
const db = require("./database");

const SALT_ROUNDS = 12;

db.all("SELECT id, name, password FROM auth_table", [], async (err, rows) => {
  if (err) { console.error("DB xətası:", err); process.exit(1); }

  for (const row of rows) {
    // Artıq hash-lənibsə keç ($2a$ və ya $2b$ ilə başlayır)
    if (row.password.startsWith("$2a$") || row.password.startsWith("$2b$")) {
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
