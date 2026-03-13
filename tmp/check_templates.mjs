
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTemplates() {
  const { data, error } = await supabase.from('contract_templates').select('*')
  if (error) {
    console.error('Error fetching templates:', error)
    return
  }
  data.forEach(t => {
    console.log(`ID: ${t.id}, Name: ${t.name}`)
    console.log('END_OF_TEMPLATE:')
    console.log(t.template_text?.substring(t.template_text.length - 200))
    console.log('---')
  })
}

checkTemplates()
