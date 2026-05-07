import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkSettings() {
    const email = 'rodrigoindalecio@hotmail.com';
    console.log(`\n--- BUSCANDO CONFIGURAÇÕES PARA: ${email} ---\n`);

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
        console.error("Erro ao listar usuários:", error.message);
        return;
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
        console.error("Usuário não encontrado!");
        return;
    }

    const settings = user.user_metadata?.app_settings || {};

    console.log("=== PARCEIROS RECORRENTES (BV) ===");
    if (settings.partners && settings.partners.length > 0) {
        settings.partners.forEach((p, i) => console.log(`${i + 1}. ${p}`));
    } else {
        console.log("(Nenhum parceiro encontrado)");
    }

    console.log("\n=== LOCAIS DE EVENTO ===");
    if (settings.locations && settings.locations.length > 0) {
        settings.locations.forEach((l, i) => {
            console.log(`${i + 1}. ${l.name} - ${l.address || 'Sem endereço'}`);
        });
    } else {
        console.log("(Nenhum local encontrado)");
    }

    console.log("\n-------------------------------------------\n");
}

checkSettings();
