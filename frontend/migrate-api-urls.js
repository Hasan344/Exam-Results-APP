// frontend/migrate-api-urls.js
//
// Bu skript src/ qovluğundakı bütün .js və .jsx fayllarında:
//   1) "http://localhost:5000" → "${API_BASE}" əvəzini edir
//   2) Hər dəyişdirilmiş faylın başına api import-u əlavə edir
//   3) Adi quote-ları (`"`, `'`) backtick-ə çevirir (yalnız o sətirlərdə)
//
// İstifadə:
//   cd frontend
//   node migrate-api-urls.js
//
// Skripti bir dəfə işə salandan sonra silə bilərsən.

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "src");
const TARGET = "http://localhost:5000";
const REPLACEMENT = "${API_BASE}";

function walk(dir, exts = [".js", ".jsx"]) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function rewriteLine(line) {
  if (!line.includes(TARGET)) return line;

  // Sətrdəki bütün `"...localhost:5000..."` və `'...localhost:5000...'`-ləri
  // backtick-li template literal-a çeviririk, sonra TARGET-i ${API_BASE} ilə əvəz edirik.
  // Sadə yanaşma: əgər URL-i tam ehtiva edən quoted-string varsa, quote-ları
  // backtick-ə dəyişirik. Backtick artıq varsa, sadəcə əvəz edirik.

  // Addım 1: əgər artıq backtick içindədirsə, sadə string replace
  // Addım 2: əks halda quote-ları backtick-ə çevir

  let result = line;

  // Single quoted strings with the URL
  result = result.replace(/'([^']*http:\/\/localhost:5000[^']*)'/g, (_, inner) => "`" + inner + "`");
  // Double quoted strings with the URL
  result = result.replace(/"([^"]*http:\/\/localhost:5000[^"]*)"/g, (_, inner) => "`" + inner + "`");

  // İndi bütün TARGET-ləri əvəz et
  result = result.split(TARGET).join(REPLACEMENT);

  return result;
}

function processFile(file) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes(TARGET)) return false;

  const lines = src.split(/\r?\n/);
  const newLines = lines.map(rewriteLine);

  let body = newLines.join("\n");

  // api import əlavə et (yoxdursa)
  if (!/from\s+['"`]\.\/api['"`]/.test(body) && !/from\s+['"`]\.\.\/api['"`]/.test(body)) {
    // src/-ə nəzərən nisbi yolu hesabla
    const rel = path.relative(path.dirname(file), SRC_DIR);
    const importPath = rel === "" ? "./api" : path.posix.join(rel.replace(/\\/g, "/"), "api").replace(/^([^.])/, "./$1");
    // İlk import-dan sonra və ya faylın başına yerləşdir
    const importStmt = `import { API_BASE } from "${importPath.startsWith(".") ? importPath : "./" + importPath}";`;

    // Mövcud son import-dan sonra əlavə et
    const importRegex = /^(import\s.+?;)\s*$/gm;
    let lastImportEnd = -1;
    let m;
    while ((m = importRegex.exec(body)) !== null) {
      lastImportEnd = m.index + m[0].length;
    }
    if (lastImportEnd >= 0) {
      body = body.slice(0, lastImportEnd) + "\n" + importStmt + body.slice(lastImportEnd);
    } else {
      body = importStmt + "\n" + body;
    }
  }

  fs.writeFileSync(file, body, "utf8");
  return true;
}

const files = walk(SRC_DIR);
let changed = 0;
for (const f of files) {
  if (processFile(f)) {
    console.log("✔ Yenilendi:", path.relative(SRC_DIR, f));
    changed++;
  }
}
console.log(`\nCəmi ${changed} fayl dəyişdirildi.`);
console.log("İndi bu skripti silə bilərsən: rm migrate-api-urls.js");
