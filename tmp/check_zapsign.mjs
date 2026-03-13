
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkZapSignAccounts() {
  const { data, error } = await supabase.from('zapsign_accounts').select('*')
  if (error) {
    console.error('Error fetching accounts:', error)
    return
  }
  console.log('ZAP_ACCOUNTS_START')
  console.log(JSON.stringify(data, null, 2))
  console.log('ZAP_ACCOUNTS_END')
}

checkZapSignAccounts()
