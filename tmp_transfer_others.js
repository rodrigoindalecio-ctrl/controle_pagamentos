import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function transferOthers() {
    console.log('--- TRANSFERINDO PAGAMENTOS ---');

    // 1. Rebecca Venturini Silva (ID 144)
    // Multa de R$ 950 encontrada no ID 1930
    const { error: e1 } = await supabase
        .from('payments')
        .update({
            bride_id: 144,
            description: 'Multa Rescisão (Rebecca Venturini - ID 144)'
        })
        .eq('id', 1930);

    if (!e1) {
        const newBalance = 1050 - 950; // Restam 100
        await supabase.from('brides').update({ balance: newBalance }).eq('id', 144);
        console.log('Rebecca (ID 144): Pagamento de R$ 950 vinculado. Novo saldo: R$ 100,00');
    } else {
        console.error('Erro Rebecca:', e1.message);
    }

    // 2. Daiane Ferreira Santos (ID 150)
    // Sinal de R$ 250 encontrado no ID 1657 (data 01/07/2024)
    const { error: e2 } = await supabase
        .from('payments')
        .update({
            bride_id: 150,
            description: 'Assessoria - Sinal (Daiane Ferreira - ID 150)'
        })
        .eq('id', 1657);

    if (!e2) {
        const newBalance = 2950 - 250; // 2700
        await supabase.from('brides').update({ balance: newBalance }).eq('id', 150);
        console.log('Daiane (ID 150): Pagamento de R$ 250 vinculado. Novo saldo: R$ 2.700,00');
    } else {
        console.error('Erro Daiane:', e2.message);
    }
}

transferOthers();
