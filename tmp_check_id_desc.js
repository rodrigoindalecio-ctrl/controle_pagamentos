import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkID() {
    console.log('Buscando pagamentos com "167" na descrição...');
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .ilike('description', '%167%');

    if (error) console.error(error);
    data.forEach(p => console.log(`${p.payment_date} - R$ ${p.amount_paid} - ${p.description}`));
}

checkID();
