import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || ""
);

async function check() {
    console.log("Checking Supabase URL:", process.env.SUPABASE_URL);
    
    const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .order("payment_date", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching payments:", error);
        return;
    }

    console.log("Latest payments in Supabase:");
    payments.forEach(p => {
        console.log(`${p.payment_date} - ${p.amount_paid} - ${p.description}`);
    });

    const { data: brides, error: bError } = await supabase
        .from("brides")
        .select("id, name")
        .limit(5);
        
    if (bError) {
        console.error("Error fetching brides:", bError);
    } else {
        console.log("\nSample brides in Supabase:");
        brides.forEach(b => {
            console.log(`ID: ${b.id} - ${b.name}`);
        });
    }
}

check();
