import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega o .env da raiz do projeto
dotenv.config({ path: 'c:/Users/rodri/Desktop/App RSVP site/Controle_Pagamentos/controle_pagamentos_app1/controle_pagamentos/.env' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('Iniciando verificação do banco de dados...');
    const { data: brides, error } = await supabase.from('brides').select('id, service_type, name');

    if (error) {
        console.error('Erro ao buscar clientes:', error);
        return;
    }

    let updatedCount = 0;
    for (const bride of brides) {
        if (bride.service_type === 'Assessoria do Dia') {
            const { error: updateError } = await supabase
                .from('brides')
                .update({ service_type: 'Assessoria do dia' })
                .eq('id', bride.id);

            if (updateError) {
                console.error(`Erro ao atualizar cliente ${bride.name} (ID: ${bride.id}):`, updateError);
            } else {
                console.log(`Atualizado: ${bride.name} | "Assessoria do Dia" -> "Assessoria do dia"`);
                updatedCount++;
            }
        }
    }

    // Também vamos padronizar as configurações do usuário (user_metadata) se necessário
    console.log('Verificando metadados de usuários...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.warn('Não foi possível listar usuários (pode ser falta de permissão service_role):', authError);
    } else {
        for (const user of users) {
            const metadata = user.user_metadata || {};
            if (metadata.settings && metadata.settings.services) {
                let changed = false;
                const newServices = metadata.settings.services.map((s: string) => {
                    if (s === 'Assessoria do Dia') {
                        changed = true;
                        return 'Assessoria do dia';
                    }
                    return s;
                });

                if (changed) {
                    const newSettings = { ...metadata.settings, services: newServices };
                    const { error: upError } = await supabase.auth.admin.updateUserById(user.id, {
                        user_metadata: { ...metadata, settings: newSettings }
                    });
                    if (upError) {
                        console.error(`Erro ao atualizar configurações do usuário ${user.email}:`, upError);
                    } else {
                        console.log(`Configurações padronizadas para o usuário: ${user.email}`);
                    }
                }
            }
        }
    }

    console.log(`\nFinalizado. Total de clientes atualizados: ${updatedCount}`);
}

run();
