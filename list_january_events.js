import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || ""
);

async function run() {
    const { data: brides, error } = await supabase.from('brides').select('id, name, event_date, contract_value, status');
    if (error) { console.error(error); return; }

    const parseDateRobust = (d) => {
        if (!d) return null;
        const s = String(d).split('T')[0];
        const parts = s.includes('-') ? s.split('-') : s.split('/');
        if (parts.length < 2) return null;

        let y = parseInt(parts[0]);
        let m = parseInt(parts[1]);

        if (y < 1000) { // Format is DD/MM/YYYY
            y = parseInt(parts[2]);
            m = parseInt(parts[1]);
        }
        return { y, m };
    };

    const targetYear = 2026;
    const targetMonth = 1; // Janeiro

    const jan2026Events = brides.filter(b => {
        const parsed = parseDateRobust(b.event_date);
        return parsed && parsed.y === targetYear && parsed.m === targetMonth;
    });

    console.log("--- EVENTOS DE JANEIRO/2026 ---");
    jan2026Events.forEach(b => {
        console.log(`Cliente: ${b.name.padEnd(30)} | Data: ${b.event_date} | Valor: R$ ${Number(b.contract_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Status: ${b.status}`);
    });

    const totalValue = jan2026Events.reduce((sum, b) => sum + (Number(b.contract_value) || 0), 0);
    const average = jan2026Events.length > 0 ? totalValue / jan2026Events.length : 0;

    console.log("--------------------------------");
    console.log(`Total de Eventos: ${jan2026Events.length}`);
    console.log(`Soma dos Valores: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`Ticket Médio (Jan): R$ ${average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
}

run();
