import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL não encontrado');
  process.exit(1);
}

console.log('Conectando ao banco de dados...');
const conn = await mysql.createConnection(dbUrl);

// Verificar colunas existentes na tabela users
const [cols] = await conn.execute("SHOW COLUMNS FROM `users`") as any;
const existingCols = cols.map((c: any) => c.Field);
console.log('Colunas existentes na tabela users:', existingCols.join(', '));

// Colunas que precisam existir
const needed = [
  { name: 'specialty', sql: "ALTER TABLE `users` ADD `specialty` varchar(128)" },
  { name: 'crfa', sql: "ALTER TABLE `users` ADD `crfa` varchar(32)" },
  { name: 'phone', sql: "ALTER TABLE `users` ADD `phone` varchar(20)" },
  { name: 'nomeCompleto', sql: "ALTER TABLE `users` ADD `nomeCompleto` varchar(256)" },
  { name: 'tituloLaudo', sql: "ALTER TABLE `users` ADD `tituloLaudo` varchar(256)" },
  { name: 'assinaturaUrl', sql: "ALTER TABLE `users` ADD `assinaturaUrl` text" },
];

for (const col of needed) {
  if (!existingCols.includes(col.name)) {
    console.log(`Adicionando coluna: ${col.name}`);
    await conn.execute(col.sql);
    console.log(`  ✓ ${col.name} adicionada com sucesso`);
  } else {
    console.log(`  ✓ ${col.name} já existe`);
  }
}

// Verificar tabelas necessárias
const [tables] = await conn.execute("SHOW TABLES") as any;
const tableNames = tables.map((t: any) => Object.values(t)[0] as string);
console.log('\nTabelas existentes:', tableNames.join(', '));

const neededTables = ['exames_audiometricos', 'pareceres_modelo', 'configuracoes_laudo'];
for (const t of neededTables) {
  if (!tableNames.includes(t)) {
    console.log(`AVISO: Tabela ${t} NÃO existe!`);
  } else {
    console.log(`  ✓ Tabela ${t} existe`);
  }
}

await conn.end();
console.log('\n✓ Concluído!');
