import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || ""
);

async function check() {
    const { data: payments, error } = await supabase
        .from("payments")
        .select("payment_date, amount_paid, description, bride_id")
        .order("payment_date", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching payments:", error);
        return;
    }

    console.log("Latest payments in Supabase:");
    payments.forEach(p => {
        console.log(`${p.payment_date} - R$ ${p.amount_paid} - Bride ID: ${p.bride_id} - ${p.description}`);
    });
}

check();
