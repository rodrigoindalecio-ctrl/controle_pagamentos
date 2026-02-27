import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function searchClients() {
    console.log('--- BUSCANDO REBECCA (144) ---');
    const { data: p1 } = await supabase.from('payments').select('*').ilike('description', '%Rebecca%');
    console.log('Pagamentos com "Rebecca":', p1);
    const { data: p1date } = await supabase.from('payments').select('*').eq('payment_date', '2024-04-19'); // Inclusão
    console.log('Pagamentos em 19/04/2024:', p1date);
    const { data: p1cancel } = await supabase.from('payments').select('*').eq('payment_date', '2025-08-15'); // Cancelamento
    console.log('Pagamentos em 15/08/2025:', p1cancel);

    console.log('\n--- BUSCANDO DAIANE (150) ---');
    const { data: p2 } = await supabase.from('payments').select('*').ilike('description', '%Daiane%');
    console.log('Pagamentos com "Daiane":', p2);
    const { data: p2date } = await supabase.from('payments').select('*').eq('payment_date', '2024-07-01'); // Inclusão
    console.log('Pagamentos em 01/07/2024:', p2date);
    const { data: p2cancel } = await supabase.from('payments').select('*').eq('payment_date', '2024-09-04'); // Cancelamento
    console.log('Pagamentos em 04/09/2024:', p2cancel);
}

searchClients();
