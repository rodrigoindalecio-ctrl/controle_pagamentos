import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function restoreAll() {
    const email = 'rodrigoindalecio@hotmail.com';
    console.log(`\n--- INICIANDO RESTAURAÇÃO COMPLETA PARA: ${email} ---\n`);

    // 1. Recuperar Parceiros (BV) - Limpeza mais fina
    const { data: pData } = await supabaseAdmin.from("payments").select("description");
    const partnersSet = new Set();
    const commonWords = ['bv', '-', 'noiva', 'lucro', 'recepcionista', 'rsvp', 'hora adicional', 'caixinha', 'distrato', 'quebra de contrato', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '/', '.', 'dia'];
    
    (pData || []).forEach(p => {
        let name = p.description || "";
        if (name.toUpperCase().startsWith("BV ")) name = name.substring(3);
        
        // Remove referências a noivas e datas
        name = name.split(" - ")[0].split(" noiva ")[0].split(" Noiva ")[0].split(" dia ")[0].trim();
        
        if (name.length > 3 && !name.toLowerCase().includes("assessoria") && !name.toLowerCase().includes("parcela") && name.length < 40) {
            partnersSet.add(name);
        }
    });
    const finalPartners = Array.from(partnersSet).sort();

    // 2. Recuperar Locais com Endereço
    const { data: bData } = await supabaseAdmin.from("brides").select("event_location, event_address");
    const locationMap = new Map();
    (bData || []).forEach(b => {
        const name = b.event_location?.trim();
        const addr = b.event_address?.trim();
        if (name && name.length > 3 && name !== "Não definido") {
            if (!locationMap.has(name) || (addr && addr.length > (locationMap.get(name) || "").length)) {
                locationMap.set(name, addr || "");
            }
        }
    });
    const finalLocations = Array.from(locationMap.entries()).map(([name, address]) => ({ name, address }));

    // 3. Buscar metadados atuais para não perder outras coisas (como tokens do Autentique)
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error("Usuário não encontrado");

    const currentSettings = user.user_metadata?.app_settings || {};
    
    // Mesclar os dados recuperados
    const newSettings = {
        ...currentSettings,
        partners: finalPartners,
        locations: finalLocations,
        // Mantemos os serviços padrão ou os que já existem
        services: currentSettings.services || ["Assessoria do dia", "Assessoria Completa", "Assessoria Parcial", "Consultoria"]
    };

    // 4. Salvar no Banco
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, app_settings: newSettings }
    });

    if (updateError) {
        console.error("Erro ao salvar no banco:", updateError.message);
    } else {
        console.log("✅ RESTAURAÇÃO CONCLUÍDA COM SUCESSO!");
        console.log(`- ${finalPartners.length} Parceiros restaurados.`);
        console.log(`- ${finalLocations.length} Locais restaurados (com endereços).`);
    }

    console.log("\n-------------------------------------------\n");
}

restoreAll();
