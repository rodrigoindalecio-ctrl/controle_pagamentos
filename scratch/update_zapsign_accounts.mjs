
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const accounts = [
    {
        name: "Vanessa ZapSign 01",
        api_key: "ebdbf423-4871-435e-8486-48bf8401638708ce0170-f7ab-42de-a29d-6b6019aab450",
        active: true,
        monthly_limit: 3,
        monthly_used: 1
    },
    {
        name: "Vanessa ZapSign 02",
        api_key: "99a83122-6182-4304-87ea-d02058a94d9c25bc2da6-99cf-4dfc-91fb-1acea9b25142",
        active: true,
        monthly_limit: 3,
        monthly_used: 2
    },
    {
        name: "Vanessa ZapSign 03",
        api_key: "0acf3c95-d1c7-4cdc-9331-111071daaeb6e719b169-e460-42b5-b343-83e6fcf0ec39",
        active: true,
        monthly_limit: 3,
        monthly_used: 0
    }
];

async function refreshAccounts() {
    console.log("Limpando e atualizando contas ZapSign...");
    
    // Deleta as contas antigas (que eu acabei de inserir por engano com dados trocados)
    const { error: delError } = await supabase.from("zapsign_accounts").delete().neq("name", "KEEP_ME_IF_ANY");
    
    if (delError) {
        console.error("Erro ao limpar contas:", delError.message);
        return;
    }

    const { data, error } = await supabase.from("zapsign_accounts").insert(accounts).select();
    
    if (error) {
        console.error("Erro ao inserir novas contas:", error.message);
    } else {
        console.log("Contas atualizadas com sucesso:", data.length);
        console.table(data.map(d => ({ name: d.name, limit: d.monthly_limit, used: d.monthly_used })));
    }
}

refreshAccounts();
