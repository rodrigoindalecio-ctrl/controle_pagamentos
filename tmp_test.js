import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || ""
);

async function run() {
    const { data, error } = await supabase.from('brides').select('id, name, event_date, status');
    if (error) { console.error(error); return; }

    const activeBrides = data.filter(b => (b.status || '').toLowerCase().trim() === 'ativa');
    console.log("Total Ativas:", activeBrides.length);

    // Logic from backend
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
    const targetMonth = 1; // 0-based, so this is FEVEREIRO

    const isSelectedPeriod = (d) => {
        const parsed = parseDateRobust(d);
        if (!parsed) return false;
        return parsed.y === targetYear && (parsed.m - 1) === targetMonth;
    };

    const febBrides = activeBrides.filter(b => isSelectedPeriod(b.event_date));
    console.log("Fevereiro Brides:", JSON.stringify(febBrides, null, 2));
}

run();
