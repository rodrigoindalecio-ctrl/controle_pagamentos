import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalSearch() {
    console.log('--- BUSCANDO FERREIRA SANTOS ---');
    const { data: p } = await supabase.from('payments').select('*').ilike('description', '%Ferreira Santos%');
    console.log('Pagamentos com "Ferreira Santos":', p);

    console.log('\n--- BUSCANDO VENTURINI ---');
    const { data: p2 } = await supabase.from('payments').select('*').ilike('description', '%Venturini%');
    console.log('Pagamentos com "Venturini":', p2);

    console.log('\n--- BUSCANDO DAIANE (sem sobrenome) NO ID 58 EM SET/2024 ---');
    const { data: p3 } = await supabase.from('payments').select('*').eq('bride_id', 58).gte('payment_date', '2024-09-01').lte('payment_date', '2024-09-10');
    console.log('Pagamentos ID 58:', p3);
}

finalSearch();
