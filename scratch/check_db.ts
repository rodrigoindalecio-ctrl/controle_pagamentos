import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkCount() {
    const { count, error } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true });
    
    if (error) console.error("Erro:", error);
    else console.log("Total de Pagamentos no Banco:", count);

    const { count: count39 } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('bride_id', 39);
    
    console.log("Total de Pagamentos para Noiva 39:", count39);
}

checkCount();
