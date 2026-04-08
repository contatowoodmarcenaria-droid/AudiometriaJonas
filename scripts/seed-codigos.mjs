import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Buscar colaboradores sem código
const [rows] = await conn.execute(
  "SELECT id, userId FROM colaboradores WHERE codigo IS NULL ORDER BY userId, id"
);
console.log("Colaboradores sem código:", rows.length);

// Agrupar por userId
const byUser = {};
for (const row of rows) {
  if (!byUser[row.userId]) byUser[row.userId] = [];
  byUser[row.userId].push(row.id);
}

for (const [userId, ids] of Object.entries(byUser)) {
  // Buscar o maior número já existente para este usuário
  const [existing] = await conn.execute(
    "SELECT codigo FROM colaboradores WHERE userId = ? AND codigo IS NOT NULL ORDER BY codigo DESC LIMIT 1",
    [userId]
  );
  let seq = 1;
  if (existing.length > 0 && existing[0].codigo) {
    const num = parseInt(existing[0].codigo.replace("COL-", ""), 10);
    if (!Number.isNaN(num)) seq = num + 1;
  }
  for (const id of ids) {
    const codigo = "COL-" + String(seq).padStart(4, "0");
    await conn.execute("UPDATE colaboradores SET codigo = ? WHERE id = ?", [codigo, id]);
    console.log("Set id=" + id + " -> " + codigo);
    seq++;
  }
}

await conn.end();
console.log("Done!");
