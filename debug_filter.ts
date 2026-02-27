
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || ""
);

async function debugFilter() {
    const targetYear = 2026;
    const queryMonth = 'all';
    const targetMonth = null;

    const isSelectedPeriod = (dateStr: string) => {
        if (!dateStr) return false;
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length < 2) return false;
        const yearMatch = parseInt(parts[0]) === targetYear;
        if (queryMonth === 'all') return yearMatch;
        const monthMatch = (parseInt(parts[1]) - 1) === targetMonth;
        return yearMatch && monthMatch;
    };

    const { data: brides } = await supabase.from("brides").select("*");

    if (!brides) return;

    const canceledBrides = brides.filter(b => (b.status || '').toLowerCase() === 'cancelado');
    console.log("Total Canceled Brides:", canceledBrides.length);

    const canceledInPeriod = canceledBrides.filter(b => {
        const res = isSelectedPeriod(b.event_date);
        console.log(`- ${b.name}: Event Date: ${b.event_date}, Year: ${b.event_date?.split('-')[0]}, isSelected: ${res}`);
        return res;
    });

    console.log("Canceled in 2026:", canceledInPeriod.length);
}

debugFilter();
