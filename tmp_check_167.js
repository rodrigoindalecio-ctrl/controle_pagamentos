import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBride() {
    const { data, error } = await supabase
        .from('brides')
        .select('*')
        .eq('id', 167)
        .single();

    if (error) {
        console.error('Cliente 167 não encontrado ou erro:', error.message);
        return;
    }
    console.log('Cliente 167 encontrado:', data);

    const { data: payments, error: pError } = await supabase
        .from('payments')
        .select('*')
        .eq('bride_id', 167)
        .order('payment_date', { ascending: true });

    if (pError) console.error(pError);
    console.log('Pagamentos vinculados ao ID 167:', payments);
}

checkBride();
