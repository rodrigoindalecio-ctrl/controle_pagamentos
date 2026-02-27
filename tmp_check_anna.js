import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAnna() {
    console.log('--- BUSCANDO ANNA LAIS ---');
    const { data: b } = await supabase
        .from('brides')
        .select('*')
        .ilike('name', '%Anna Lais%')
        .single();

    if (!b) {
        console.log('Anna Lais não encontrada.');
        return;
    }
    console.log('Cadastro:', b);

    const { data: p } = await supabase
        .from('payments')
        .select('*')
        .eq('bride_id', b.id);

    const totalPaid = p.reduce((sum, item) => sum + (item.amount_paid || 0), 0);
    console.log(`Total Pago (Surgindo de pagamentos): R$ ${totalPaid}`);
    console.log(`Cálculo Correto: ${b.contract_value} - ${totalPaid} = ${b.contract_value - totalPaid}`);
    console.log(`Saldo no BD: ${b.balance}`);
}

checkAnna();
