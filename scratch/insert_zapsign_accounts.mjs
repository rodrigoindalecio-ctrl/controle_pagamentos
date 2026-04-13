
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const accounts = [
    {
        name: "ZapSign Produção 01",
        api_key: "99a83122-6182-4304-87ea-d02058a94d9c25bc2da6-99cf-4dfc-91fb-1acea9b25142",
        active: true,
        monthly_limit: 3,
        monthly_used: 0
    },
    {
        name: "ZapSign Produção 02",
        api_key: "99a83122-6182-4304-87ea-d02058a94d9c25bc2da6-99cf-4dfc-91fb-1acea9b25142", // User provided same as account 1
        active: true,
        monthly_limit: 3,
        monthly_used: 0
    },
    {
        name: "ZapSign Produção 03",
        api_key: "0acf3c95-d1c7-4cdc-9331-111071daaeb6e719b169-e460-42b5-b343-83e6fcf0ec39",
        active: true,
        monthly_limit: 3,
        monthly_used: 0
    }
];

async function insertAccounts() {
    console.log("Inserindo contas no ZapSign...");
    
    // First, clear existing (optional but safer since user wants to start production)
    // await supabase.from("zapsign_accounts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const { data, error } = await supabase.from("zapsign_accounts").insert(accounts).select();
    
    if (error) {
        console.error("Erro ao inserir contas:", error.message);
    } else {
        console.log("Contas inseridas com sucesso:", data.length);
    }
}

insertAccounts();
