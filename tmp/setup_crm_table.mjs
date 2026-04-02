import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function setup() {
  console.log('--- Iniciando criação da tabela marketing_leads ---');

  // Supabase REST API doesn't support easy SQL CREATE TABLE, but we can try to use RPC or just assume it's created via manual SQL on their console.
  // HOWEVER, I can try to insert a test lead to see if the table exists or to provide the SQL script for the user.
  
  const sql = `
    CREATE TABLE IF NOT EXISTS marketing_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      whatsapp TEXT UNIQUE NOT NULL,
      event_date DATE,
      email TEXT,
      status TEXT DEFAULT 'captured',
      last_msg_at TIMESTAMPTZ,
      msg_count INT DEFAULT 0,
      is_test BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Habilitar RLS (opcional para admin)
    ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;
    
    -- Política para todos
    CREATE POLICY "Permitir tudo para admin" ON marketing_leads FOR ALL 
    TO authenticated USING (true) WITH CHECK (true);
  `;

  console.log('SQL para execução no console do Supabase:');
  console.log(sql);

  // Tentativa de verificar se já existe
  const { error } = await supabase.from('marketing_leads').select('count').limit(1);
  if (error && error.code === '42P01') {
    console.log('Tabela não existe. Por favor, execute o SQL acima no console SQL do Supabase.');
  } else if (!error) {
    console.log('Tabela marketing_leads já existe.');
  } else {
    console.error('Erro ao verificar tabela:', error);
  }
  
  // Inserir o lead de teste do Rodrigo se não existir
  const testNumber = '5511981667932';
  const { data: existing } = await supabase.from('marketing_leads').select('*').eq('whatsapp', testNumber).single();
  
  if (!existing && !error) {
    console.log('Inserindo lead de teste para o Rodrigo...');
    const { error: insError } = await supabase.from('marketing_leads').insert([
      { name: 'Rodrigo (Teste)', whatsapp: testNumber, is_test: true, status: 'captured' }
    ]);
    if (insError) console.error('Erro ao inserir lead de teste:', insError);
    else console.log('Lead de teste inserido com sucesso!');
  }
}

setup();
