import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function check() {
    console.log("Testing supabaseAdmin...");
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
        console.error("Error listing users:", error);
    } else {
        console.log("Success! Found " + users.length + " users.");
        console.log("First user email: " + users[0]?.email);
    }
}

check();
