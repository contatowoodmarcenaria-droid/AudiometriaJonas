import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { config } from "dotenv";

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

const sql = `ALTER TABLE \`colaboradores\` ADD \`codigo\` varchar(16)`;

try {
  await conn.execute(sql);
  console.log("✅ Migration applied: added `codigo` column to colaboradores");
} catch (err) {
  if (err.code === "ER_DUP_FIELDNAME") {
    console.log("⚠️  Column `codigo` already exists, skipping.");
  } else {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

await conn.end();
