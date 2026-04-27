# 📧 Módulo: Email Sync — Backup do Hotmail via Microsoft Graph

Script autônomo para varrer sua conta Hotmail/Outlook e baixar **todas as conversas e anexos** trocados com os contatos especificados, salvando tudo de forma organizada para posterior upload ao Google Drive.

> ⚠️ **Por que não IMAP?** A Microsoft bloqueou a autenticação básica via IMAP para contas `@hotmail.com` e `@outlook.com` em 2023. Este módulo usa a **Microsoft Graph API** com OAuth2, que é o método oficial e suportado atualmente.

---

## 📁 Arquivos do Módulo

```
scripts/email-sync/
  ├── index.ts     → Ponto de entrada
  ├── syncer.ts    → Lógica de varredura e salvamento (Microsoft Graph API)
  ├── auth.ts      → Autenticação OAuth2 via Device Code Flow
  ├── config.ts    → Configurações (contatos-alvo, Azure etc.)
  └── utils.ts     → Utilitários (log, I/O de arquivos)
```

---

## ⚙️ Configuração — Passo a Passo

### Passo 1: Registrar o App no Azure (gratuito, ~3 minutos)

1. Acesse **https://portal.azure.com** com sua conta Microsoft
2. Procure e clique em **"Microsoft Entra ID"** (antes chamado Azure Active Directory)
3. No menu lateral, clique em **"Registros de aplicativo"** → **"Novo registro"**
4. Preencha:
   - **Nome**: `Email Backup Script` (qualquer nome)
   - **Tipos de conta suportados**: selecione **"Contas em qualquer diretório organizacional e contas pessoais Microsoft"**
   - **URI de Redirecionamento**: deixe em branco
5. Clique em **Registrar**
6. Copie o valor **"ID do aplicativo (cliente)"** que aparece na tela — é um GUID como `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Passo 2: Configurar Permissões do App

1. Na tela do app registrado, clique em **"Permissões de API"** → **"Adicionar uma permissão"**
2. Escolha **"Microsoft Graph"** → **"Permissões delegadas"**
3. Adicione:
   - `Mail.Read`
   - `User.Read`
4. Clique em **"Adicionar permissões"**

> ✅ Permissões delegadas não precisam de aprovação de administrador para uso pessoal.

### Passo 3: Preencher o `.env`

Abra o arquivo `.env` na raiz do projeto e substitua o valor:

```env
AZURE_CLIENT_ID="cole-aqui-o-id-do-app-copiado-no-passo-1"
```

---

## ▶️ Como Executar

```bash
npm run email:sync
```

### O que acontece:

1. **Primeira execução**: O script exibe uma mensagem como esta no terminal:
   ```
   Para fazer login, acesse: https://microsoft.com/devicelogin
   Insira o código: ABCD-1234
   ```
2. Abra `https://microsoft.com/devicelogin` no **navegador**, insira o código e **faça login com sua conta Hotmail**
3. Autorize as permissões solicitadas (ler emails)
4. Volte ao terminal — o script continua automaticamente
5. **Execuções seguintes**: O token fica salvo em `.msal-token-cache.json` — **sem precisar logar novamente** por até 60 dias

---

## 📂 Estrutura de Saída

```
email_backups/
  pedro.bbs2@gmail.com/
    Inbox/
      2024-03-15_10-30-00 -- Assunto do Email/
        metadados.json       ← de, para, cc, data, prévia
        mensagem.html        ← corpo formatado
        mensagem.txt         ← texto puro
        anexos/
          documento.pdf
    Sent Items/
      2024-03-16_09-00-00 -- Re: Assunto/
        ...
  pedro.debarros@diadema.sp.gov.br/
    ...
  eduardobom@sabesp.com.br/
    ...
```

---

## 🔒 Segurança

| Arquivo | Protegido no Git? |
|---|---|
| `.env` (contém Client ID) | ✅ Sim |
| `.msal-token-cache.json` (token OAuth) | ✅ Sim (via `.gitignore`) |
| `email_backups/` (seus emails) | ✅ Sim |

---

## 🐛 Solução de Problemas

| Erro | Causa | Solução |
|---|---|---|
| `AZURE_CLIENT_ID não configurado` | Faltou preencher o .env | Seguir o Passo 3 acima |
| `AADSTS70011` | Permissão não adicionada no App | Verificar Passo 2 |
| `AADSTS700016` | Client ID inválido | Verificar o ID copiado no Passo 1 |
| `Graph API error 403` | App sem permissão de leitura | Adicionar `Mail.Read` nas permissões |
| Token expirado | Normal após ~60 dias | Rodar de novo e reautorizar |
