import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPayments() {
    console.log('Buscando pagamentos na descrição contendo Natália...');
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .ilike('description', '%Natália%')
        .order('payment_date', { ascending: true });

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('Resultados encontrados:');
    data.forEach(p => {
        console.log(`ID: ${p.id}, Bride_ID: ${p.bride_id}, Data: ${p.payment_date}, Valor: ${p.amount_paid}, Descrição: ${p.description}`);
    });
}

checkPayments();
