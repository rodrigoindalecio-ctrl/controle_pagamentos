
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const SIGNATURE_BLOCK = `

{{cidade_hoje}}, {{data_hoje}}.

________________________________________
{{cliente_nome}}

________________________________________
{{empresa_representante}}
{{empresa_nome}}
CNPJ: {{empresa_cnpj}}`;

async function updateTemplates() {
  const { data, error } = await supabase.from('contract_templates').select('*')
  if (error) {
    console.error('Error fetching templates:', error)
    return
  }

  for (const template of data) {
    if (template.template_text) {
      console.log(`Updating template signature: ${template.name}`)
      
      // Procura pelo padrão de data antigo para substituir pelo bloco completo
      const oldEndingRegex = /Guarulhos, {{data_hoje}}\.?/i;
      
      let newText;
      if (oldEndingRegex.test(template.template_text)) {
          newText = template.template_text.replace(oldEndingRegex, SIGNATURE_BLOCK.trim());
      } else {
          // Se não achar o padrão, apenas anexa ao final
          newText = template.template_text.trim() + SIGNATURE_BLOCK;
      }

      const { error: updateError } = await supabase
        .from('contract_templates')
        .update({ template_text: newText })
        .eq('id', template.id)
      
      if (updateError) {
        console.error(`Error updating template ${template.name}:`, updateError)
      } else {
        console.log(`Template ${template.name} signature block updated successfully!`)
      }
    }
  }
}

updateTemplates()
