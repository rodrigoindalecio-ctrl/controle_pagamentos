import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function testZapSignIntegration() {
    console.log("--- TESTANDO CONEXÃO ZAPSIGN ---");

    // 1. Tentar pegar o token das configurações do usuário admin
    const { data: users, error: userError } = await supabase.from("profiles").select("*").limit(1);
    
    // Como o token está no user_metadata do auth.users, vamos tentar de outra forma
    // Vou usar um ID de contrato existente para simular o processo real
    const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("*, brides(*)")
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (contractError || !contract) {
        console.error("ERRO: Nenhum contrato encontrado para testar.");
        return;
    }

    console.log(`Contrato alvo: ${contract.id} (${contract.brides.name})`);

    // Pegar a conta padrão se não houver configurações de usuário
    const { data: accounts } = await supabase.from("zapsign_accounts").select("*");
    console.log(`Contas globais cadastradas: ${accounts?.length || 0}`);

    // Simular o sendToZapSign
    const apiToken = accounts?.[0]?.api_key;
    if (!apiToken) {
        console.error("ERRO: Nenhum API Token configurado nas contas globais.");
        return;
    }

    const isSandbox = true;
    const baseUrl = isSandbox ? "https://sandbox.api.zapsign.com.br/api/v1" : "https://api.zapsign.com.br/api/v1";

    console.log(`Testando API em modo ${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'}...`);

    const payload = {
        name: `TESTE TÉCNICO - ${contract.brides.name}`,
        markdown_text: contract.generated_text,
        signers: [
            {
                name: "Vanessa Bidinotti (Teste)",
                email: "vanessabidinotti@hotmail.com", 
                auth_mode: "signature",
                order: 1
            },
            {
                name: contract.brides.name,
                email: contract.brides.email || "rodrigo@exemplo.com",
                auth_mode: "signature",
                order: 2
            }
        ],
        lang: "pt-br"
    };

    try {
        const response = await fetch(`${baseUrl}/docs/?api_token=${apiToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log("SUCESSO! ZapSign respondeu corretamente.");
            console.log("Document ID:", result.open_id);
            console.log("Link Admin:", result.signers.find(s => s.order === 1)?.sign_url);
        } else {
            console.error("ERRO NA API DO ZAPSIGN:");
            console.error(JSON.stringify(result, null, 2));
        }
    } catch (err) {
        console.error("ERRO DE REDE/FETCH:", err.message);
    }
}

testZapSignIntegration();
