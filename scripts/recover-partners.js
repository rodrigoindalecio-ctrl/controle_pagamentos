import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function recoverPartners() {
    console.log(`\n--- TENTANDO RECUPERAR NOMES DE PARCEIROS PELOS PAGAMENTOS ---\n`);

    const { data: payments, error } = await supabaseAdmin
        .from("payments")
        .select("description")
        .not("description", "is", null);
    
    if (error) {
        console.error("Erro ao buscar pagamentos:", error.message);
        return;
    }

    // Filtrar apenas o que parece ser nome de parceiro (geralmente você coloca o nome no BV)
    const partners = new Set();
    payments.forEach(p => {
        const desc = p.description.trim();
        // Se a descrição for curta e não for "Assessoria", "Parcela", etc, pode ser um parceiro
        if (desc.length > 2 && 
            !desc.toLowerCase().includes("assessoria") && 
            !desc.toLowerCase().includes("parcela") &&
            !desc.toLowerCase().includes("pago") &&
            !desc.toLowerCase().includes("entrada")) {
            partners.add(desc);
        }
    });

    console.log("PARCEIROS ENCONTRADOS NO HISTÓRICO:");
    if (partners.size > 0) {
        Array.from(partners).forEach((p, i) => console.log(`${i + 1}. ${p}`));
    } else {
        console.log("(Nenhum parceiro identificado no histórico de pagamentos)");
    }

    console.log("\n-------------------------------------------\n");
}

recoverPartners();
