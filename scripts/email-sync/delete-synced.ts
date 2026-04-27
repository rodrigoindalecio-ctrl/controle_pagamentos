import { promises as fs } from 'fs';
import path from 'path';
import { getGraphClient } from './auth.js';
import { OUTPUT_DIR } from './config.js';
import { log } from './utils.js';

async function findMetadataFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return findMetadataFiles(res);
      } else if (entry.name === 'metadados.json') {
        return [res];
      }
      return [];
    })
  );
  return files.flat();
}

export async function deleteSyncedEmails(): Promise<void> {
  log('info', '══════════════════════════════════════════════');
  log('info', '   Limpeza de Emails — Microsoft Graph API');
  log('info', '══════════════════════════════════════════════');
  log('warn', '⚠️ AVISO: Isso moverá os emails que já foram baixados para a Lixeira.');
  console.log('');

  const metadataFiles = await findMetadataFiles(OUTPUT_DIR);

  if (metadataFiles.length === 0) {
    log('info', 'Nenhum email baixado foi encontrado na pasta local para excluir.');
    return;
  }

  log('info', `Encontrados ${metadataFiles.length} emails copiados localmente.`);
  log('info', '🔑 Autenticando com Microsoft Graph...');
  
  const client = await getGraphClient();
  let deletedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < metadataFiles.length; i++) {
    const filePath = metadataFiles[i];
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const meta = JSON.parse(content);

      if (!meta.id) {
        log('warn', `Email sem ID no arquivo: ${filePath}`);
        continue;
      }

      // Chama a Microsoft Graph API para mover o email para a Lixeira (Soft Delete)
      await client.api(`/me/messages/${meta.id}`).delete();
      deletedCount++;
      
      log('ok', `[${deletedCount}/${metadataFiles.length}] Excluído com sucesso na nuvem: "${meta.assunto}"`);
    } catch (err) {
      const errMsg = (err as Error).message;
      // Trata erro caso já tenha sido deletado antes
      if (errMsg.includes('ItemNotFound') || errMsg.includes('ErrorItemNotFound')) {
        log('warn', `Email já não existe na nuvem (pulando)`);
      } else {
        errorCount++;
        log('error', `Erro ao excluir: ${errMsg}`);
      }
    }

    // Pausa para evitar rate-limit da API (máx de requests por segundo na MS)
    await new Promise(r => setTimeout(r, 200));
  }

  log('ok', '══════════════════════════════════════════════');
  log('ok', `   LIMPEZA CONCLUÍDA!`);
  log('ok', `   ${deletedCount} email(s) apagado(s) da caixa principal.`);
  if (errorCount > 0) log('error', `   ${errorCount} falha(s) (verifique os logs acima).`);
  log('ok', '══════════════════════════════════════════════');
}
