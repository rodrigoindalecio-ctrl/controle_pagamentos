import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDate() {
    console.log('Buscando todos os pagamentos em 2025-03-11...');
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_date', '2025-03-11');

    if (error) console.error(error);
    data.forEach(p => console.log(`ID: ${p.id}, Bride_ID: ${p.bride_id}, R$ ${p.amount_paid}, Desc: ${p.description}`));
}

checkDate();
