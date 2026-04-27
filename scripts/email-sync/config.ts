import 'dotenv/config';

/**
 * Credenciais do App Azure AD registrado para este script.
 * Como é um app pessoal/local, usamos o fluxo de Device Code (sem servidor callback).
 */
export const AZURE_CONFIG = {
  clientId: process.env.AZURE_CLIENT_ID || '',
  // 'common' suporta tanto contas pessoais (hotmail/outlook.com) quanto organizacionais
  authority: 'https://login.microsoftonline.com/common',
  scopes: ['https://graph.microsoft.com/Mail.ReadWrite', 'https://graph.microsoft.com/User.Read'],
};

/** Lista de contatos cujas conversas queremos baixar */
export const TARGET_CONTACTS = [
  'pedro.bbs2@gmail.com',
  'pedro.debarros@diadema.sp.gov.br',
  'eduardobom@sabesp.com.br',
  'cbarduco@sabesp.com.br',
];

/** Onde salvar o cache de autenticação (token) para não precisar logar toda vez */
export const TOKEN_CACHE_FILE = '.msal-token-cache.json';

/** Pasta raiz onde tudo será salvo */
export const OUTPUT_DIR = 'email_backups';

/** Quantos emails buscar por requisição (máx. 999 pela API) */
export const PAGE_SIZE = 50;
