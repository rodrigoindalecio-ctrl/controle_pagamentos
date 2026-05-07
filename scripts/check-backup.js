import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkBackups() {
    console.log(`\n--- BUSCANDO BACKUP NA TABELA company_settings ---\n`);

    const { data, error } = await supabaseAdmin
        .from("company_settings")
        .select("*")
        .limit(1);
    
    if (error) {
        console.error("Erro ao buscar tabela:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("Tabela company_settings está vazia.");
        return;
    }

    const company = data[0];
    console.log("DADOS ENCONTRADOS:");
    console.log(JSON.stringify(company, null, 2));
    console.log("\n-------------------------------------------\n");
}

checkBackups();
