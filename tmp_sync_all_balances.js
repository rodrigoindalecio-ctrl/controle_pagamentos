import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncBalances() {
    console.log('--- INICIANDO SINCRONIZAÇÃO DE SALDOS ---');

    // 1. Buscar todos os clientes
    const { data: brides, error: bError } = await supabase.from('brides').select('id, name, contract_value, balance');
    if (bError) {
        console.error('Erro ao buscar clientes:', bError);
        return;
    }

    // 2. Buscar todos os pagamentos pagos
    const { data: payments, error: pError } = await supabase
        .from('payments')
        .select('bride_id, amount_paid')
        .ilike('status', 'pago');

    if (pError) {
        console.error('Erro ao buscar pagamentos:', pError);
        return;
    }

    console.log(`Auditoria em ${brides.length} clientes...`);

    let fixCount = 0;

    for (const bride of brides) {
        const bridePayments = payments.filter(p => p.bride_id === bride.id);
        const totalPaid = bridePayments.reduce((sum, p) => {
            const val = typeof p.amount_paid === 'number' ? p.amount_paid : parseFloat(String(p.amount_paid).replace(/[R$\s]/g, '').replace(',', '.')) || 0;
            return sum + val;
        }, 0);

        const correctBalance = Math.max(0, (bride.contract_value || 0) - totalPaid);

        // Comparação com tolerância para centavos (devido a imprecisão de float se necessário, mas aqui usaremos arredondamento)
        const diff = Math.abs(correctBalance - (bride.balance || 0));

        if (diff > 0.01) {
            console.log(`[AJUSTE] ${bride.name} (ID: ${bride.id}):`);
            console.log(`   Valor Contrato: ${bride.contract_value}`);
            console.log(`   Total Pago: ${totalPaid}`);
            console.log(`   Saldo Atual: ${bride.balance} -> Novo Saldo: ${correctBalance}`);

            const { error: uError } = await supabase
                .from('brides')
                .update({ balance: correctBalance })
                .eq('id', bride.id);

            if (uError) console.error(`   Erro ao atualizar:`, uError.message);
            else fixCount++;
        }
    }

    console.log('\n--- SINCRONIZAÇÃO CONCLUÍDA ---');
    console.log(`Total de clientes ajustados: ${fixCount}`);
}

syncBalances();
