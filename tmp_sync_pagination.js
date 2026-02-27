import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncBalances() {
    console.log('--- AUDITORIA COM PAGINAÇÃO ---');

    // 1. Unir todas as noivas
    const { data: brides } = await supabase.from('brides').select('id, name, contract_value, balance');

    // 2. Unir todos os pagamentos em lotes
    let allPayments = [];
    let from = 0;
    let to = 999;
    let finished = false;

    while (!finished) {
        const { data, error } = await supabase.from('payments').select('*').range(from, to);
        if (error) {
            console.error(error);
            break;
        }
        allPayments = allPayments.concat(data);
        if (data.length < 1000) {
            finished = true;
        } else {
            from += 1000;
            to += 1000;
        }
    }

    console.log(`Verificando ${brides.length} clientes e ${allPayments.length} pagamentos...`);

    let fixCount = 0;

    for (const bride of brides) {
        const bridePayments = allPayments.filter(p =>
            p.bride_id === bride.id &&
            (p.status || 'Pago').trim().toLowerCase() === 'pago'
        );

        const totalPaid = bridePayments.reduce((sum, p) => {
            const val = typeof p.amount_paid === 'number' ? p.amount_paid : parseFloat(String(p.amount_paid).replace(/[R$\s]/g, '').replace(',', '.')) || 0;
            return sum + val;
        }, 0);

        const correctBalance = Math.round((Math.max(0, (bride.contract_value || 0) - totalPaid)) * 100) / 100;
        const currentBalance = Math.round((bride.balance || 0) * 100) / 100;

        if (Math.abs(correctBalance - currentBalance) > 0.01) {
            console.log(`[AJUSTE] ID ${bride.id} - ${bride.name}:`);
            console.log(`   Contrato: R$ ${bride.contract_value} | Total Pago: R$ ${totalPaid}`);
            console.log(`   Saldo Atual: R$ ${currentBalance} -> Novo Saldo: R$ ${correctBalance}`);

            await supabase
                .from('brides')
                .update({ balance: correctBalance })
                .eq('id', bride.id);

            fixCount++;
        }
    }

    console.log('\n--- AUDITORIA FINALIZADA ---');
    console.log(`Sucesso: ${fixCount} saldos corrigidos.`);
}

syncBalances();
