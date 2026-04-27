import { DeviceCodeCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js';
import 'isomorphic-fetch';

import { AZURE_CONFIG } from './config.js';
import { log } from './utils.js';

export async function getGraphClient(): Promise<Client> {
  const credential = new DeviceCodeCredential({
    tenantId: 'common',
    clientId: AZURE_CONFIG.clientId,
    userPromptCallback: (info) => {
      const border = '\x1b[33m' + '═'.repeat(56) + '\x1b[0m';
      console.log('');
      console.log(border);
      console.log('\x1b[1m\x1b[36m  AÇÃO NECESSÁRIA — Autorize o acesso ao seu email:\x1b[0m');
      console.log(border);
      console.log(`\n  ${info.message}\n`);
      console.log('  \x1b[90m(O script aguarda automaticamente — não feche o terminal)\x1b[0m');
      console.log(border);
      console.log('');
    },
  });

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: AZURE_CONFIG.scopes,
  });

  const msalClient = Client.initWithMiddleware({
    defaultVersion: 'v1.0',
    debugLogging: false,
    authProvider,
  });

  // Força uma chamada para autenticar imediatamente
  await msalClient.api('/me').select('displayName').get();

  log('ok', `✅ Login concluído! `);

  return msalClient;
}
