import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepSearch() {
    console.log('--- BUSCANDO VALORES ESPECÍFICOS ---');

    // Rebecca: Procura por 1050 ou o que falta (1050 - 950 = 100)
    const { data: r1 } = await supabase.from('payments').select('*').in('amount_paid', [1050, 100]).gte('payment_date', '2024-01-01');
    console.log('Pagamentos de 1050 ou 100:', r1);

    // Daiane: Valor da multa 2950 ou valores comuns em 01/07 (inclusão)
    const { data: d1 } = await supabase.from('payments').select('*').eq('amount_paid', 2950);
    console.log('Pagamentos de 2950:', d1);

    // Busca por "Rebecca" ou "Daiane" na descrição sem case sensitive mais amplo
    const { data: rNames } = await supabase.from('payments').select('*').ilike('description', '%Rebeca%'); // Tentativa sem os dois 'c'
    console.log('Pagamentos com "Rebeca" (1 c):', rNames);

    const { data: dNames } = await supabase.from('payments').select('*').ilike('description', '%Daiana%');
    console.log('Pagamentos com "Daiana":', dNames);

    // Listar tudo de ID 58 em Julho e Setembro 2024 (Datas da Daiane)
    const { data: dDates } = await supabase.from('payments').select('*').eq('bride_id', 58).gte('payment_date', '2024-07-01').lte('payment_date', '2024-09-30');
    console.log('Pagamentos ID 58 (Jul-Set 2024):', dDates);
}

deepSearch();
