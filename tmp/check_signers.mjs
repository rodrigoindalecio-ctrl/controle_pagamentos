import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkSignersStructure() {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const userWithToken = users.find(u => u.user_metadata?.app_settings?.zapsignToken);
    if (!userWithToken) return;

    const settings = userWithToken.user_metadata.app_settings;
    const baseUrl = settings.isSandbox ? "https://sandbox.api.zapsign.com.br/api/v1" : "https://api.zapsign.com.br/api/v1";
    
    const payload = {
        name: "TESTE ESTRUTURA SIGNATARIOS",
        markdown_text: "Teste",
        signers: [
            { name: "S_ONE", email: "one@test.com", auth_mode: "signature" },
            { name: "S_TWO", email: "two@test.com", auth_mode: "signature" }
        ],
        lang: "pt-br"
    };

    const response = await fetch(`${baseUrl}/docs/?api_token=${settings.zapsignToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("SIGNERS RETURNED:");
    result.signers.forEach((s, idx) => {
        console.log(`Signer ${idx}: name=${s.name}, sign_url=${!!s.sign_url}, keys=${Object.keys(s).join(',')}`);
    });
}

checkSignersStructure();
