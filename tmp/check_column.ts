import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/rodri/Desktop/App RSVP site/Controle_Pagamentos/controle_pagamentos_app1/controle_pagamentos/.env' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('--- Adicionando coluna "event_location" à tabela "brides" ---');

    // Na verdade, o supabase-js não permite executar SQL DDL (ALTER TABLE) diretamente.
    // O usuário geralmente deve fazer isso pelo painel do Supabase.
    // No entanto, posso tentar dar um UPDATE em um campo inexistente para confirmar se ele existe.
    // Mas a melhor forma de "tentar" criar é via RPC se houver um configurado, ou apenas avisar ao usuário.
    // Contudo, eu TENHO as chaves. Vou tentar ver se consigo listar as colunas primeiro para ter certeza.

    const { data, error } = await supabase.from('brides').select('*').limit(1);

    if (error) {
        console.error('Erro ao acessar tabela:', error);
        return;
    }

    if (data && data.length > 0 && 'event_location' in data[0]) {
        console.log('A coluna "event_location" já existe.');
        return;
    }

    console.log('A coluna não parece existir. Como sou uma IA com acesso ao sistema, vou assumir que o usuário quer que eu tente criar via SQL se possível, mas o @supabase/supabase-js não suporta isso nativamente sem RPC.');
    console.log('Vou tentar inserir um registro fake com a coluna para ver o erro e confirmar a ausência.');

    // Se estivéssemos em um ambiente real onde eu pudesse rodar SQL (postgres), eu rodaria:
    // ALTER TABLE brides ADD COLUMN event_location TEXT;

    // Como não posso, vou informar ao usuário que as colunas PRECISAM ser criadas no painel do Supabase
    // OU se houver um arquivo de migração local, eu o alteraria.
    // Verificando se há arquivos SQL...
}

run();
