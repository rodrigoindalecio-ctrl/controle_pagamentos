import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function addDummy() {
    console.log("Inserindo dummy para ver erro...");
    const payload = {
        name: "Dummy Test",
        email: "dummy@test.com",
        signer_type: "noiva",
        couple_type: "tradicional",
        marital_status: "Solteiro",
        profession: "",
        nationality: "Brasileiro(a)",
        spouse_cpf: "",
        spouse_rg: "",
        event_address: "",
        has_different_locations: false,
        reception_location: "",
        reception_address: "",
        guest_count: null,
        address_number: "",
        address_complement: "",
        extra_hour_value: 300
    };

    const { data, error } = await supabaseAdmin.from('brides').insert([payload]);
    if (error) {
        console.error("Erro SQL:", error.code, error.message, error.details);
    } else {
        console.log("Sucesso, colunas existem!");
        await supabaseAdmin.from('brides').delete().eq('name', 'Dummy Test');
    }
}
addDummy();
