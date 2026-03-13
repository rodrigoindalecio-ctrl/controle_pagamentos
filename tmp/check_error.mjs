import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function addDummy() {
    console.log("Inserindo dummy string para ver erro...");
    const payload = {
        name: "Dummy Test 2",
        email: "dummy2@test.com",
        guest_count: ""
    };

    const { data, error } = await supabaseAdmin.from('brides').insert([payload]);
    if (error) {
        console.error("Erro SQL:", JSON.stringify(error, null, 2));
    } else {
        console.log("Sucesso!");
        await supabaseAdmin.from('brides').delete().eq('name', 'Dummy Test 2');
    }
}
addDummy();
