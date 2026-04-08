/**
 * Script de migração: transfere todos os dados do userId=1 (conta Manus/Google)
 * para o novo userId criado pelo login Supabase.
 * 
 * O script:
 * 1. Faz login com Supabase para obter o UUID
 * 2. Verifica se o usuário já existe no banco interno com openId = "supabase_<uuid>"
 * 3. Se não existir, cria o usuário no banco interno via login simulado
 * 4. Migra todos os dados (empresas, colaboradores, exames, pareceres, configurações)
 */

import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';

const SUPABASE_URL = 'https://nojhraxxtwnhdxdikhxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vamhyYXh4dHduaGR4ZGlraHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjM4MTIsImV4cCI6MjA5MDk5OTgxMn0.tJfmuxjC-_c8vZBbRYpvjkQQatt2KtXSnNbMrqwFyr8';
const TARGET_EMAIL = 'contatowoodmarcenaria@gmail.com';
const OLD_USER_ID = 1; // userId da conta antiga (Manus/Google)

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🚀 Iniciando migração de dados...\n');

  // 1. Login no Supabase para obter o UUID
  console.log('1️⃣  Autenticando no Supabase...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TARGET_EMAIL,
    password: 'T@lia2429!',
  });

  if (signInError || !signInData.user) {
    console.error('❌ Erro ao autenticar:', signInError?.message);
    process.exit(1);
  }

  const supabaseUUID = signInData.user.id;
  const openId = `supabase_${supabaseUUID}`;
  console.log('   ✅ Autenticado! Supabase UUID:', supabaseUUID);
  console.log('   OpenId no sistema:', openId);

  // 2. Conectar ao banco MySQL interno
  console.log('\n2️⃣  Conectando ao banco de dados interno...');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL não encontrada');
    process.exit(1);
  }

  const connection = await mysql.createConnection(dbUrl);
  console.log('   ✅ Conectado!');

  try {
    // 3. Verificar se o usuário já existe no banco interno
    console.log('\n3️⃣  Verificando usuário no banco interno...');
    const [existingRows] = await connection.execute(
      'SELECT id, name, email FROM users WHERE openId = ?',
      [openId]
    );
    
    let newUserId;
    
    if (existingRows.length > 0) {
      newUserId = existingRows[0].id;
      console.log(`   ✅ Usuário já existe! userId=${newUserId}`);
    } else {
      // Criar o usuário no banco interno
      console.log('   ⚠️  Usuário não existe ainda. Criando...');
      
      // Buscar dados do usuário antigo para copiar nome e perfil
      const [oldUserRows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [OLD_USER_ID]
      );
      
      const oldUser = oldUserRows[0];
      
      const [insertResult] = await connection.execute(
        `INSERT INTO users (openId, name, email, loginMethod, role, specialty, crfa, phone, 
         nomeCompleto, tituloLaudo, assinaturaUrl, lastSignedIn) 
         VALUES (?, ?, ?, 'email', ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          openId,
          oldUser?.name || 'Woord Marcenaria',
          TARGET_EMAIL,
          oldUser?.role || 'admin',
          oldUser?.specialty || 'Fonoaudiologia Ocupacional',
          oldUser?.crfa || '',
          oldUser?.phone || '',
          oldUser?.nomeCompleto || null,
          oldUser?.tituloLaudo || null,
          oldUser?.assinaturaUrl || null,
        ]
      );
      
      newUserId = insertResult.insertId;
      console.log(`   ✅ Usuário criado! userId=${newUserId}`);
    }

    // 4. Migrar dados
    console.log(`\n4️⃣  Migrando dados de userId=${OLD_USER_ID} para userId=${newUserId}...`);

    if (newUserId === OLD_USER_ID) {
      console.log('   ⚠️  Os userIds são iguais, nenhuma migração necessária!');
      await connection.end();
      await supabase.auth.signOut();
      return;
    }

    // Contar registros antes
    const [empresasCount] = await connection.execute('SELECT COUNT(*) as c FROM empresas WHERE userId = ?', [OLD_USER_ID]);
    const [colaboradoresCount] = await connection.execute('SELECT COUNT(*) as c FROM colaboradores WHERE userId = ?', [OLD_USER_ID]);
    const [examesCount] = await connection.execute('SELECT COUNT(*) as c FROM exames_audiometricos WHERE userId = ?', [OLD_USER_ID]);
    const [pareceresCount] = await connection.execute('SELECT COUNT(*) as c FROM pareceres_modelo WHERE userId = ?', [OLD_USER_ID]);
    const [configCount] = await connection.execute('SELECT COUNT(*) as c FROM configuracoes_laudo WHERE userId = ?', [OLD_USER_ID]);
    const [alertasCount] = await connection.execute('SELECT COUNT(*) as c FROM alertas WHERE userId = ?', [OLD_USER_ID]);

    console.log(`   📊 Registros a migrar:`);
    console.log(`      Empresas: ${empresasCount[0].c}`);
    console.log(`      Colaboradores: ${colaboradoresCount[0].c}`);
    console.log(`      Exames: ${examesCount[0].c}`);
    console.log(`      Pareceres modelo: ${pareceresCount[0].c}`);
    console.log(`      Configurações laudo: ${configCount[0].c}`);
    console.log(`      Alertas: ${alertasCount[0].c}`);

    // Migrar empresas
    if (empresasCount[0].c > 0) {
      await connection.execute('UPDATE empresas SET userId = ? WHERE userId = ?', [newUserId, OLD_USER_ID]);
      console.log(`   ✅ Empresas migradas: ${empresasCount[0].c}`);
    }

    // Migrar colaboradores
    if (colaboradoresCount[0].c > 0) {
      await connection.execute('UPDATE colaboradores SET userId = ? WHERE userId = ?', [newUserId, OLD_USER_ID]);
      console.log(`   ✅ Colaboradores migrados: ${colaboradoresCount[0].c}`);
    }

    // Migrar exames audiométricos
    if (examesCount[0].c > 0) {
      await connection.execute('UPDATE exames_audiometricos SET userId = ? WHERE userId = ?', [newUserId, OLD_USER_ID]);
      console.log(`   ✅ Exames migrados: ${examesCount[0].c}`);
    }

    // Migrar pareceres modelo
    if (pareceresCount[0].c > 0) {
      await connection.execute('UPDATE pareceres_modelo SET userId = ? WHERE userId = ?', [newUserId, OLD_USER_ID]);
      console.log(`   ✅ Pareceres modelo migrados: ${pareceresCount[0].c}`);
    }

    // Migrar configurações de laudo
    if (configCount[0].c > 0) {
      // Verificar se já existe configuração para o novo userId
      const [existingConfig] = await connection.execute('SELECT id FROM configuracoes_laudo WHERE userId = ?', [newUserId]);
      if (existingConfig.length === 0) {
        await connection.execute('UPDATE configuracoes_laudo SET userId = ? WHERE userId = ?', [newUserId, OLD_USER_ID]);
        console.log(`   ✅ Configurações de laudo migradas: ${configCount[0].c}`);
      } else {
        console.log(`   ⚠️  Configurações de laudo já existem para o novo userId, pulando...`);
      }
    }

    // Migrar alertas
    if (alertasCount[0].c > 0) {
      await connection.execute('UPDATE alertas SET userId = ? WHERE userId = ?', [newUserId, OLD_USER_ID]);
      console.log(`   ✅ Alertas migrados: ${alertasCount[0].c}`);
    }

    console.log('\n🎉 Migração concluída com sucesso!');
    console.log(`   Todos os dados foram transferidos para userId=${newUserId}`);
    console.log(`   Você pode fazer login com: ${TARGET_EMAIL}`);

  } finally {
    await connection.end();
    await supabase.auth.signOut();
  }
}

main().catch(console.error);
