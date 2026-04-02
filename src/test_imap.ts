import imaps from 'imap-simple';
import dotenv from 'dotenv';
import path from 'path';

// Carrega o .env da pasta raiz
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testConnection() {
  console.log('--- TESTE DE CONEXÃO CRM ---');
  console.log('Host:', process.env.IMAP_HOST);
  console.log('User:', process.env.IMAP_USER);
  
  const config = {
    imap: {
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASS,
      host: process.env.IMAP_HOST,
      port: Number(process.env.IMAP_PORT) || 993,
      tls: true,
      authTimeout: 5000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };

  try {
    console.log('Tentando conectar...');
    const connection = await imaps.connect(config);
    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
    
    await connection.openBox('INBOX');
    console.log('✅ CAIXA DE ENTRADA ABERTA!');
    
    const searchCriteria = [['ALL']];
    const fetchOptions = { bodies: ['HEADER.FIELDS (FROM)'], struct: true };
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    console.log(`✅ TOTAL DE EMAILS ENCONTRADOS: ${messages.length}`);
    
    connection.end();
    console.log('Teste finalizado com sucesso.');
  } catch (err: any) {
    console.error('❌ FALHA NA CONEXÃO:', err.message);
    if (String(err.message).includes('LOGIN')) {
        console.log('Sugestão: Verifique se o e-mail e a senha no arquivo .env estão corretos.');
    }
  }
}

testConnection();
