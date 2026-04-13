
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkSettings() {
    const { data: company, error: companyError } = await supabase.from("company_settings").select("*").limit(1).single();
    const { data: accounts, error: accountsError } = await supabase.from("zapsign_accounts").select("*");

    console.log("--- COMPANY SETTINGS ---");
    if (companyError) console.log("Error or No settings found:", companyError.message);
    else console.log(JSON.stringify(company, null, 2));

    console.log("\n--- ZAPSIGN ACCOUNTS ---");
    if (accountsError) console.log("Error fetching accounts:", accountsError.message);
    else console.log(JSON.stringify(accounts, null, 2));
}

checkSettings();
