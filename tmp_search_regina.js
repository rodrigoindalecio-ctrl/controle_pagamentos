import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function searchRegina() {
    console.log('Buscando por "Regina"...');
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .ilike('description', '%Regina%');

    if (error) console.error(error);
    data.forEach(p => console.log(`${p.payment_date} - R$ ${p.amount_paid} - ${p.description}`));
}

searchRegina();
