import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBride155() {
    const { data: b } = await supabase.from('brides').select('*').eq('id', 155).single();
    console.log('Noiva ID 155:', b);

    const { data: b144 } = await supabase.from('brides').select('*').eq('id', 144).single();
    console.log('Noiva ID 144 (Rebecca):', b144);

    const { data: b150 } = await supabase.from('brides').select('*').eq('id', 150).single();
    console.log('Noiva ID 150 (Daiane):', b150);
}

checkBride155();
