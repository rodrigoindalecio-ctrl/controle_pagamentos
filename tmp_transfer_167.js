import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function transferPayments() {
    console.log('Transferindo pagamentos para Natália Regina (ID 167)...');

    // 1. Atualizar descrições e IDs dos pagamentos
    const updates = [
        { id: 1736, desc: 'Assessoria (Natália Regina - ID 167)' },
        { id: 1761, desc: 'Assessoria (Natália Regina - ID 167)' },
        { id: 1819, desc: 'Multa Rescisão (Natália Regina - ID 167)' }
    ];

    for (const item of updates) {
        const { error } = await supabase
            .from('payments')
            .update({
                bride_id: 167,
                description: item.desc
            })
            .eq('id', item.id);

        if (error) console.error(`Erro ao atualizar pagamento ${item.id}:`, error.message);
        else console.log(`Pagamento ${item.id} transferido com sucesso.`);
    }

    // 2. Recalcular saldo da noiva 167
    const totalPaid = 170 + 150 + 391; // 711
    const fineAmount = 1345;
    const newBalance = fineAmount - totalPaid;

    const { error: bError } = await supabase
        .from('brides')
        .update({ balance: newBalance })
        .eq('id', 167);

    if (bError) console.error('Erro ao atualizar saldo da noiva:', bError.message);
    else console.log(`Saldo da Natália (ID 167) atualizado para R$ ${newBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
}

transferPayments();
