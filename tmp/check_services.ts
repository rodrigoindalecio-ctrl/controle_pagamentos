import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/rodri/Desktop/App RSVP site/Controle_Pagamentos/controle_pagamentos_app1/controle_pagamentos/.env' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('--- Relatório de Tipos de Serviço ---');
    const { data: brides, error } = await supabase.from('brides').select('service_type');

    if (error) {
        console.error('Erro:', error);
        return;
    }

    const counts: Record<string, number> = {};
    brides.forEach(b => {
        const t = b.service_type || 'NULL';
        counts[t] = (counts[t] || 0) + 1;
    });

    console.log(JSON.stringify(counts, null, 2));

    // Procura por variações de "Assessoria do dia" (case insensitive)
    const target = "Assessoria do dia";
    let fixCount = 0;

    const { data: toFix, error: fetchError } = await supabase
        .from('brides')
        .select('id, service_type, name');

    if (fetchError) return;

    for (const bride of toFix) {
        const st = bride.service_type || "";
        // Se for "Assessoria do dia" com QUALQUER variação de maiúsculas/minúsculas, 
        // mas não exatamente "Assessoria do dia"
        if (st.toLowerCase() === target.toLowerCase() && st !== target) {
            console.log(`Corrigindo [${bride.name}]: "${st}" -> "${target}"`);
            await supabase.from('brides').update({ service_type: target }).eq('id', bride.id);
            fixCount++;
        }
    }

    console.log(`--- Total de correções: ${fixCount} ---`);
}

run();
