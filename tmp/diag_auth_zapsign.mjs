import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkUserMetadataAndTest() {
    console.log("--- DIAGNÓSTICO DE IDENTIDADE E TOKEN ---");

    // 1. Buscar o usuário pelo e-mail (ajuste para o seu e-mail se necessário)
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
        console.error("Erro ao listar usuários:", authError.message);
        return;
    }

    // Filtrar pelo usuário que tem o token nas configurações
    const userWithToken = users.find(u => u.user_metadata?.app_settings?.zapsignToken);

    if (!userWithToken) {
        console.log("ERRO: Nenhum usuário encontrado com 'zapsignToken' configurado no user_metadata.");
        console.log("Usuários encontrados:", users.map(u => ({ email: u.email, hasSettings: !!u.user_metadata?.app_settings })));
        return;
    }

    const settings = userWithToken.user_metadata.app_settings;
    console.log(`Usuário identificado: ${userWithToken.email}`);
    console.log(`Token encontrado: ${settings.zapsignToken.substring(0, 5)}...`);
    console.log(`Modo Sandbox: ${settings.isSandbox}`);

    // 2. Tentar disparar um mini-teste de API real com esse token
    const baseUrl = settings.isSandbox ? "https://sandbox.api.zapsign.com.br/api/v1" : "https://api.zapsign.com.br/api/v1";
    
    console.log("Chamando ZapSign para validar o token...");
    
    try {
        const payload = {
            name: "TESTE TÉCNICO DE CONEXÃO",
            markdown_text: "Este é um teste automático de conexão do sistema.",
            signers: [{ name: "Teste", email: "teste@exemplo.com", auth_mode: "signature" }],
            lang: "pt-br"
        };

        const response = await fetch(`${baseUrl}/docs/?api_token=${settings.zapsignToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Resposta Completa da ZapSign:", JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log("✅ CONEXÃO ESTABELECIDA COM SUCESSO!");
            console.log("ID do Documento Criado:", result.open_id);
        } else {
            console.error("❌ ERRO NA API DO ZAPSIGN:");
            console.error(JSON.stringify(result, null, 2));
        }
    } catch (err) {
        console.error("❌ ERRO DE REDE:", err.message);
    }
}

checkUserMetadataAndTest();
