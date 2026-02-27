import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncBalances() {
    console.log('--- INICIANDO AUDITORIA GLOBAL DE SALDOS (v2) ---');

    // 1. Buscar noivas
    const { data: brides } = await supabase.from('brides').select('id, name, contract_value, balance');

    // 2. Buscar TODOS os pagamentos
    const { data: payments } = await supabase.from('payments').select('*');

    console.log(`Verificando ${brides.length} clientes e ${payments.length} pagamentos...`);

    let fixCount = 0;

    for (const bride of brides) {
        // Filtrar pagamentos da noiva que estão como "Pago"
        const bridePayments = payments.filter(p =>
            p.bride_id === bride.id &&
            (p.status || 'Pago').trim().toLowerCase() === 'pago'
        );

        const totalPaid = bridePayments.reduce((sum, p) => {
            const val = typeof p.amount_paid === 'number' ? p.amount_paid : parseFloat(String(p.amount_paid).replace(/[R$\s]/g, '').replace(',', '.')) || 0;
            return sum + val;
        }, 0);

        const correctBalance = Math.max(0, (bride.contract_value || 0) - totalPaid);
        const currentBalance = bride.balance || 0;

        if (Math.abs(correctBalance - currentBalance) > 0.01) {
            console.log(`[AJUSTE] ID ${bride.id} - ${bride.name}:`);
            console.log(`   Contrato: R$ ${bride.contract_value.toFixed(2)} | Total Pago: R$ ${totalPaid.toFixed(2)}`);
            console.log(`   Saldo Atual: R$ ${currentBalance.toFixed(2)} -> Novo Saldo: R$ ${correctBalance.toFixed(2)}`);

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
