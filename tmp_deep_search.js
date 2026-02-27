import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepSearch() {
    console.log('--- BUSCA 1: Valor 170 em 24/10/2024 ---');
    const { data: q1 } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_date', '2024-10-24')
        .eq('amount_paid', 170);
    console.log('Encontrados (exato):', q1);

    console.log('\n--- BUSCA 2: Valor 150 em 05/12/2024 ---');
    const { data: q2 } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_date', '2024-12-05')
        .eq('amount_paid', 150);
    console.log('Encontrados (exato):', q2);

    console.log('\n--- BUSCA 3: Apenas valores (170 e 150) em qualquer data de Out/Dez 2024 ---');
    const { data: q3 } = await supabase
        .from('payments')
        .select('*')
        .in('amount_paid', [150, 170])
        .gte('payment_date', '2024-10-01')
        .lte('payment_date', '2024-12-31');
    console.log('Encontrados (valor + período):', q3);

    console.log('\n--- BUSCA 4: Tudo em 24/10/2024 e 05/12/2024 ---');
    const { data: q4 } = await supabase
        .from('payments')
        .select('*')
        .in('payment_date', ['2024-10-24', '2024-12-05']);
    console.log('Encontrados (apenas datas):', q4);
}

deepSearch();
