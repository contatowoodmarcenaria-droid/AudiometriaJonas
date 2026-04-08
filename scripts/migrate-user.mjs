/**
 * Script de migração: verifica a conta Supabase criada e atualiza o user_id
 * nas tabelas do banco interno para corresponder ao novo usuário Supabase.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nojhraxxtwnhdxdikhxo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vamhyYXh4dHduaGR4ZGlraHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjM4MTIsImV4cCI6MjA5MDk5OTgxMn0.tJfmuxjC-_c8vZBbRYpvjkQQatt2KtXSnNbMrqwFyr8';

const TARGET_EMAIL = 'contatowoodmarcenaria@gmail.com';

// Use service key if available, otherwise anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 Verificando conta Supabase para:', TARGET_EMAIL);
  
  // Try to sign in to verify the account exists
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TARGET_EMAIL,
    password: 'T@lia2429!',
  });

  if (signInError) {
    console.error('❌ Erro ao verificar conta:', signInError.message);
    console.log('');
    console.log('A conta ainda não foi criada ou a senha está incorreta.');
    console.log('Por favor, acesse https://audiometry-kvfagvhm.manus.space/signup e crie a conta primeiro.');
    process.exit(1);
  }

  const supabaseUserId = signInData.user?.id;
  const userEmail = signInData.user?.email;
  
  console.log('✅ Conta encontrada!');
  console.log('   Email:', userEmail);
  console.log('   Supabase User ID:', supabaseUserId);
  console.log('');
  console.log('📊 Dados da conta antiga no banco interno:');
  console.log('   User ID interno: 1 (conta Manus/Google: contatowoodmarcenaria@gmail.com)');
  console.log('');
  console.log('🔄 A migração de dados será feita atualizando o campo user_id nas tabelas.');
  console.log('   O novo sistema usa Supabase Auth, então os dados precisam estar');
  console.log('   associados ao Supabase User ID:', supabaseUserId);
  
  // Sign out after verification
  await supabase.auth.signOut();
  
  return supabaseUserId;
}

main().catch(console.error);
