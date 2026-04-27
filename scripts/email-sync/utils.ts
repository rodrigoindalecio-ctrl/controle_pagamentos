import { promises as fs } from 'fs';
import path from 'path';

/**
 * Sanitiza uma string para ser usada como nome de pasta/arquivo,
 * removendo caracteres inválidos no Windows e limitando o tamanho.
 */
export function sanitizeName(name: string, maxLength = 80): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Formata uma data para o prefixo de pasta.
 * Exemplo: 2024-03-15_14-30-00
 */
export function formatDateForPath(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d}_${h}-${mi}-${s}`;
}

/**
 * Garante que o diretório exista, criando-o recursivamente se necessário.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Escreve um arquivo de forma segura, ignorando erros de "já existe".
 */
export async function writeFileSafe(
  filePath: string,
  content: string | Buffer
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
}

/**
 * Gera um nome único para a pasta de um email.
 * Formato: YYYY-MM-DD_HH-MM-SS -- Assunto
 */
export function buildEmailFolderName(date: Date, subject: string): string {
  const datePrefix = formatDateForPath(date);
  const safeSubject = sanitizeName(subject || 'sem-assunto', 60);
  return `${datePrefix} -- ${safeSubject}`;
}

/**
 * Log formatado no console com timestamp.
 */
export function log(
  level: 'info' | 'ok' | 'warn' | 'error',
  message: string
): void {
  const colors: Record<string, string> = {
    info: '\x1b[36m',   // Ciano
    ok: '\x1b[32m',     // Verde
    warn: '\x1b[33m',   // Amarelo
    error: '\x1b[31m',  // Vermelho
  };
  const icons: Record<string, string> = {
    info: 'ℹ',
    ok: '✔',
    warn: '⚠',
    error: '✖',
  };
  const reset = '\x1b[0m';
  const time = new Date().toLocaleTimeString('pt-BR');
  console.log(`${colors[level]}${icons[level]} [${time}] ${message}${reset}`);
}
