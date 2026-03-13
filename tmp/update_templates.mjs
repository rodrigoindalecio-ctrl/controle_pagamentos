
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const OLD_PHRASE = "Cerimônia e recepção que se realizarão no mesmo dia, no endereço: {{local_evento}}"
const NEW_TAG = "{{descricao_locais}}"

async function updateTemplates() {
  const { data, error } = await supabase.from('contract_templates').select('*')
  if (error) {
    console.error('Error fetching templates:', error)
    return
  }

  for (const template of data) {
    if (template.template_text && template.template_text.includes(OLD_PHRASE)) {
      console.log(`Updating template: ${template.name}`)
      // Substitui a frase toda pela tag dinâmica
      const newText = template.template_text.replace(OLD_PHRASE, NEW_TAG)
      const { error: updateError } = await supabase
        .from('contract_templates')
        .update({ template_text: newText })
        .eq('id', template.id)
      
      if (updateError) {
        console.error(`Error updating template ${template.name}:`, updateError)
      } else {
        console.log(`Template ${template.name} updated successfully!`)
      }
    } else {
      console.log(`Template ${template.name} does not contain the old phrase or already updated.`)
    }
  }
}

updateTemplates()
