import path from 'path';
import fetch from 'node-fetch';
import { simpleParser } from 'mailparser';
import { Client } from '@microsoft/microsoft-graph-client';
import { getGraphClient } from './auth.js';
import { TARGET_CONTACTS, OUTPUT_DIR, PAGE_SIZE } from './config.js';
import { buildEmailFolderName, ensureDir, writeFileSafe, log } from './utils.js';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
interface GraphMessage {
  id: string;
  subject: string;
  receivedDateTime: string;
  from?: { emailAddress: { address: string; name: string } };
  toRecipients?: { emailAddress: { address: string; name: string } }[];
  ccRecipients?: { emailAddress: { address: string; name: string } }[];
  hasAttachments: boolean;
  bodyPreview: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Determina se email é relevante
// ─────────────────────────────────────────────────────────────────────────────
function getRelevantContact(msg: GraphMessage): string | null {
  const addresses = [
    msg.from?.emailAddress?.address ?? '',
    ...(msg.toRecipients ?? []).map((r) => r.emailAddress?.address),
    ...(msg.ccRecipients ?? []).map((r) => r.emailAddress?.address),
  ].filter(Boolean).map((a) => a.toLowerCase().trim());

  for (const contact of TARGET_CONTACTS) {
    if (addresses.includes(contact.toLowerCase())) return contact;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Salva um email no disco
// ─────────────────────────────────────────────────────────────────────────────
async function saveEmailToDisk(
  client: Client,
  msg: GraphMessage,
  contact: string,
  folderLabel: string,
): Promise<void> {
  const emailDate = new Date(msg.receivedDateTime);
  const emailDirName = buildEmailFolderName(emailDate, msg.subject);
  const emailDir = path.join(OUTPUT_DIR, contact, folderLabel, emailDirName);
  await ensureDir(emailDir);

  const meta = {
    id: msg.id,
    assunto: msg.subject,
    de: msg.from?.emailAddress?.address ?? '',
    para: (msg.toRecipients ?? []).map((r) => r.emailAddress?.address).join(', '),
    cc: (msg.ccRecipients ?? []).map((r) => r.emailAddress?.address).join(', '),
    data: msg.receivedDateTime,
    tem_anexos: msg.hasAttachments,
    pasta_origem: folderLabel,
    preview: msg.bodyPreview,
  };
  await writeFileSafe(path.join(emailDir, 'metadados.json'), JSON.stringify(meta, null, 2));

  try {
    const stream = await client.api(`/me/messages/${msg.id}/$value`).get();
    let text = "";
    // Transforma a ReadableStream em Buffer
    if (typeof stream.text === 'function') {
      text = await stream.text();
    } else {
      text = stream.toString();
    }

    const parsed = await simpleParser(text as any);

    if (parsed.html) await writeFileSafe(path.join(emailDir, 'mensagem.html'), parsed.html);
    if (parsed.text) await writeFileSafe(path.join(emailDir, 'mensagem.txt'), parsed.text);

    if (parsed.attachments?.length) {
      const attachDir = path.join(emailDir, 'anexos');
      await ensureDir(attachDir);
      for (const att of parsed.attachments) {
        const fileName = att.filename ?? `anexo_${Date.now()}`;
        await writeFileSafe(path.join(attachDir, fileName), att.content);
        log('ok', `      📎 ${fileName} (${(att.size / 1024).toFixed(1)} KB)`);
      }
    }
  } catch (err) {
    log('warn', `      ⚠ Falha ao baixar conteúdo MIME: ${(err as Error).message}`);
    await writeFileSafe(path.join(emailDir, 'preview.txt'), msg.bodyPreview ?? '');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Processa pasta
// ─────────────────────────────────────────────────────────────────────────────
async function processFolder(
  client: Client,
  folderId: string,
  folderLabel: string,
): Promise<void> {
  log('info', `📂 Varrendo pasta: "${folderLabel}"...`);

  // Graph API lida muito melhor com $search do que $filter complexos para listas.
  const searchQuery = TARGET_CONTACTS.map((email) => `"${email}"`).join(' OR ');

  try {
    let response = await client.api(`/me/mailFolders/${folderId}/messages`)
      .top(PAGE_SIZE)
      .search(searchQuery)
      .select(['id', 'subject', 'receivedDateTime', 'from', 'toRecipients', 'ccRecipients', 'hasAttachments', 'bodyPreview'])
      .get();

    let pageNum = 0;
    let totalSaved = 0;

    while (response && response.value) {
      pageNum++;
      log('info', `   Página ${pageNum}... (${response.value.length} emails)`);

      const messages: GraphMessage[] = response.value;

      for (const msg of messages) {
        const contact = getRelevantContact(msg);
        if (!contact) continue;

        try {
          await saveEmailToDisk(client, msg, contact, folderLabel);
          totalSaved++;
          log('ok', `   [${totalSaved}] "${msg.subject || 'sem assunto'}" → ${contact}`);
        } catch (err) {
          log('error', `   Erro ao salvar "${msg.subject}": ${(err as Error).message}`);
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      if (response['@odata.nextLink']) {
        response = await client.api(response['@odata.nextLink']).get();
      } else {
        break;
      }
    }

    log('ok', `✅ "${folderLabel}" concluída — ${totalSaved} email(s) salvos.`);
  } catch (err) {
    log('error', `Falha ao processar pasta ${folderLabel}: ${(err as Error).message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────
export async function syncEmails(): Promise<void> {
  log('info', '══════════════════════════════════════════════');
  log('info', '   Backup de Emails — Microsoft Graph API');
  log('info', '══════════════════════════════════════════════');
  log('info', `🎯 Contatos: ${TARGET_CONTACTS.join(', ')}`);
  log('info', `📁 Saída: ./${OUTPUT_DIR}`);
  console.log('');

  if (!process.env.AZURE_CLIENT_ID) {
    log('error', 'AZURE_CLIENT_ID não configurado no .env!');
    process.exit(1);
  }

  await ensureDir(OUTPUT_DIR);

  log('info', '🔑 Autenticando com Microsoft Graph...');
  const client = await getGraphClient();

  const standardFolders = [
    { id: 'inbox', name: 'Caixa de Entrada' },
    { id: 'sentitems', name: 'Itens Enviados' },
  ];

  for (const folder of standardFolders) {
    await processFolder(client, folder.id, folder.name);
    console.log('');
  }

  log('ok', '══════════════════════════════════════════════');
  log('ok', `   CONCLUÍDO! Pasta: ./${OUTPUT_DIR}`);
  log('ok', '══════════════════════════════════════════════');
}
