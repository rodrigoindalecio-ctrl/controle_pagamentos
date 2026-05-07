import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function recoverLocations() {
    console.log(`\n--- RECUPERANDO LOCAIS DE EVENTO DA TABELA DE CLIENTES ---\n`);

    const { data: brides, error } = await supabaseAdmin
        .from("brides")
        .select("event_location")
        .not("event_location", "is", null);
    
    if (error) {
        console.error("Erro ao buscar clientes:", error.message);
        return;
    }

    const locations = new Set();
    brides.forEach(b => {
        const loc = b.event_location.trim();
        if (loc.length > 2 && loc !== "Não definido") {
            locations.add(loc);
        }
    });

    console.log("LOCAIS ENCONTRADOS NO HISTÓRICO:");
    if (locations.size > 0) {
        Array.from(locations).sort().forEach((l, i) => console.log(`${i + 1}. ${l}`));
    } else {
        console.log("(Nenhum local encontrado no histórico de clientes)");
    }

    console.log("\n-------------------------------------------\n");
}

recoverLocations();
