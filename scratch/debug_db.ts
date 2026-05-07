import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function debug() {
    console.log("--- TESTANDO QUERY /api/contracts ---");
    const { data, error } = await supabaseAdmin
        .from("contracts")
        .select(`id, bride_id, template_id, status, created_at`)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("ERRO na query:", JSON.stringify(error));
        return;
    }

    console.log("Total retornado:", data.length);
    const florinda = data.filter(c => String(c.bride_id) === "293");
    console.log(`Contratos da Florinda (ID 293): ${florinda.length}`);
    florinda.forEach(c => {
        console.log(`  -> contrato ID: ${c.id}, status: ${c.status}, bride_id: ${c.bride_id}`);
    });

    console.log("\n--- TESTANDO COM JOIN brides(name) ---");
    const { data: withJoin, error: joinError } = await supabaseAdmin
        .from("contracts")
        .select(`id, bride_id, template_id, status, created_at, brides(name)`)
        .order("created_at", { ascending: false })
        .limit(3);
    
    if (joinError) {
        console.error("ERRO no join:", JSON.stringify(joinError));
        console.log(">>> Join com brides(name) está quebrando! Deve ser removido.");
    } else {
        console.log("Join OK. Amostra:", JSON.stringify(withJoin?.slice(0,2)));
    }
}

debug();
