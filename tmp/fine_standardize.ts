import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/rodri/Desktop/App RSVP site/Controle_Pagamentos/controle_pagamentos_app1/controle_pagamentos/.env' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('--- Fazendo Varredura Fina de Padronização ---');
    const { data: brides, error } = await supabase.from('brides').select('id, service_type, name');

    if (error) {
        console.error('Erro:', error);
        return;
    }

    let fixCount = 0;

    for (const bride of brides) {
        let st = bride.service_type || "";
        let original = st;

        // 1. Troca qualquer "Assessoria do Dia" (com D maiúsculo) por "Assessoria do dia"
        if (st.includes("Assessoria do Dia")) {
            st = st.replace(/Assessoria do Dia/g, "Assessoria do dia");
        }

        // 2. Padroniza "só festa" vs "Só festa" (Case sensitive check)
        // Se contém a variação com 's' minúsculo
        if (st.includes("- só Festa")) {
            st = st.replace("- só Festa", "- Só festa");
        }
        if (st.includes("- só festa")) {
            st = st.replace("- só festa", "- Só festa");
        }

        if (st !== original) {
            console.log(`Padronizando [${bride.name}]: "${original}" -> "${st}"`);
            await supabase.from('brides').update({ service_type: st }).eq('id', bride.id);
            fixCount++;
        }
    }

    console.log(`\nFim da varredura. Total de ajustes finos: ${fixCount}`);
}

run();
