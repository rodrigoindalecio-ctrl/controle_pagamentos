
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || ""
);

async function checkCancellations() {
    const { data, error } = await supabase
        .from("brides")
        .select("*")
        .ilike("status", "cancelado");

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Canceled Brides found:", data.length);
    data.forEach(b => {
        console.log(`- ${b.name}: Event Date: ${b.event_date}, Status: ${b.status}`);
    });
}

checkCancellations();
