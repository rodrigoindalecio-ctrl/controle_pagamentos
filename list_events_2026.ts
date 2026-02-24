
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || ""
);

async function listEvents() {
    const { data, error } = await supabase
        .from('brides')
        .select('event_date, name')
        .eq('status', 'Ativa')
        .gte('event_date', '2026-01-01')
        .lte('event_date', '2026-12-31')
        .order('event_date');

    if (error) {
        console.error(error);
        return;
    }

    console.log("\n--- EVENTOS ATIVOS 2026 ---");
    data.forEach(b => {
        const date = b.event_date ? b.event_date.split('T')[0] : 'S/ Data';
        console.log(`${date} - ${b.name}`);
    });
    console.log("---------------------------\n");
}

listEvents();
