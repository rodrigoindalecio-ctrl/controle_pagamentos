import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function searchClient() {
    console.log('Buscando por Natália no cadastro de Clientes...');
    const { data: brides, error: bError } = await supabase
        .from('brides')
        .select('id, name')
        .ilike('name', '%Natália%');

    if (bError) console.error(bError);
    console.log('Clientes encontrados:', brides);

    console.log('\nBuscando por Natália na descrição de Pagamentos...');
    const { data: payments, error: pError } = await supabase
        .from('payments')
        .select('bride_id, description, amount_paid, payment_date')
        .ilike('description', '%Natália%');

    if (pError) console.error(pError);
    console.log('Pagamentos encontrados:', payments);
}

searchClient();
