import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function searchByDate() {
    console.log('Buscando pagamentos com "16/11/2025"...');
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .ilike('description', '%16/11/2025%')
        .order('payment_date', { ascending: true });

    if (error) console.error(error);
    data.forEach(p => console.log(`${p.payment_date} - R$ ${p.amount_paid} - ${p.description} (Bride ID: ${p.bride_id})`));
}

searchByDate();
