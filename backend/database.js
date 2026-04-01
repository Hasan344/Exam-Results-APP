const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("DB bağlantı hatası:", err.message);
  } else {
    console.log("SQLite bağlandı ✔");
  }
});

module.exports = db;
