import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getPayments() {
    const { data, error } = await supabase
        .from('payments')
        .select('payment_date, amount_paid, description')
        .eq('bride_id', 167)
        .order('payment_date', { ascending: true });

    if (error) {
        console.error('Erro:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('Nenhum pagamento encontrado para o ID 167.');
        return;
    }

    console.log('Pagamentos do Cliente 167 (Natália Regina Nunes Santos):');
    console.log('----------------------------------------------------');
    data.forEach(p => {
        // Handling possible types of amount_paid
        const amount = typeof p.amount_paid === 'number' ? p.amount_paid : parseFloat(String(p.amount_paid).replace(/[R$\s]/g, '').replace(',', '.')) || 0;
        console.log(`${p.payment_date} - R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${p.description}`);
    });
}

getPayments();
