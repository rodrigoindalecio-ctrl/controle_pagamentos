
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkTableStructure() {
    // Try to insert a dummy row or just select to see columns
    const { data, error } = await supabase.from("zapsign_accounts").select("*").limit(1);
    
    if (error) {
        console.error("Error fetching table info:", error);
        return;
    }
    
    // If table is empty, we can't see keys this way easily. 
    // We can use the rpc to get column info if we have one, or just try a dry-run insert.
    console.log("Table exists. Current data count:", data.length);
}

checkTableStructure();
