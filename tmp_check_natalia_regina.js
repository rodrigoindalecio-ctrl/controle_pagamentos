import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPayments() {
    console.log('Buscando especificamente por "Natália Regina"...');
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .ilike('description', '%Natália Regina%')
        .order('payment_date', { ascending: true });

    if (error) {
        console.error('Erro:', error);
        return;
    }

    if (data.length === 0) {
        console.log('Nenhum pagamento com "Natália Regina" na descrição.');
    } else {
        data.forEach(p => {
            console.log(`${p.payment_date} - R$ ${p.amount_paid} - ${p.description}`);
        });
    }
}

checkPayments();
