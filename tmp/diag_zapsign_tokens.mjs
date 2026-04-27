import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testTokens() {
    const { data: accounts } = await supabase.from('zapsign_accounts').select('*');
    if (!accounts) return console.log("No accounts found");

    for (const acc of accounts) {
        console.log(`\nTesting account: ${acc.name}`);
        const token = acc.api_key.trim();
        
        // Test Production URL
        const prodRes = await fetch(`https://api.zapsign.com.br/api/v1/docs?api_token=${token}`);
        const prodData = await prodRes.json();
        console.log(`Production URL Status: ${prodRes.status}`);
        console.log(`Production Data:`, prodData.error || prodData.detail || "OK");

        // Test Sandbox URL
        const sandRes = await fetch(`https://sandbox.api.zapsign.com.br/api/v1/docs?api_token=${token}`);
        const sandData = await sandRes.json();
        console.log(`Sandbox URL Status: ${sandRes.status}`);
        console.log(`Sandbox Data:`, sandData.error || sandData.detail || "OK");
    }
}

testTokens();
