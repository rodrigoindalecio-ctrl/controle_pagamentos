import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPayments() {
    const { data } = await supabase.from('payments').select('id, bride_id, status, amount_paid').eq('bride_id', 167);
    console.log('Pagamentos ID 167:', data);
}

checkPayments();
