import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const backupService = {
    async generateBackupData() {
        console.log('[BACKUP] Iniciando coleta de dados para backup...');
        
        // 1. Busca todos os usuários para pegar as configurações (metadata)
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        
        // 2. Busca dados das tabelas principais
        const [brides, payments, expenses, templates] = await Promise.all([
            supabaseAdmin.from('brides').select('*'),
            supabaseAdmin.from('payments').select('*'),
            supabaseAdmin.from('expenses').select('*'),
            supabaseAdmin.from('contract_templates').select('*')
        ]);

        return {
            exportDate: new Date().toISOString(),
            usersSettings: users.map(u => ({ email: u.email, settings: u.user_metadata?.app_settings })),
            data: {
                brides: brides.data || [],
                payments: payments.data || [],
                expenses: expenses.data || [],
                templates: templates.data || []
            }
        };
    },

    async sendBackupEmail(targetEmail: string) {
        try {
            const backupData = await this.generateBackupData();
            const fileName = `backup_wedding_premium_${new Date().toISOString().split('T')[0]}.json`;
            
            const host = process.env.IMAP_HOST?.replace('imap', 'smtp') || 'smtp.hostinger.com';
            
            const transporter = nodemailer.createTransport({
                host: host,
                port: 465,
                secure: true,
                auth: {
                    user: process.env.IMAP_USER,
                    pass: process.env.IMAP_PASS
                },
                tls: { rejectUnauthorized: false }
            });

            const mailOptions = {
                from: `"Sistema Gestão Premium" <${process.env.IMAP_USER}>`,
                to: targetEmail,
                subject: `📌 Backup Semanal Automático - ${new Date().toLocaleDateString('pt-BR')}`,
                text: `Olá Rodrigo,\n\nSegue em anexo o backup completo do seu sistema realizado em ${new Date().toLocaleString('pt-BR')}.\n\nEste arquivo contém todos os seus clientes, pagamentos, despesas e configurações.\n\nAtenciosamente,\nEquipe Gestão Premium`,
                attachments: [
                    {
                        filename: fileName,
                        content: JSON.stringify(backupData, null, 2)
                    }
                ]
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('[BACKUP] E-mail enviado com sucesso:', info.messageId);
            return true;
        } catch (error) {
            console.error('[BACKUP ERROR]', error);
            throw error;
        }
    },

    initScheduledBackup() {
        // Agenda para toda Segunda-feira às 08:00 AM (Fallback Vercel/Servidor Ligado)
        cron.schedule('0 8 * * 1', async () => {
            console.log('[CRON] Iniciando backup semanal agendado...');
            try {
                await this.sendBackupEmail('rodrigoindalecio@hotmail.com');
                await this.updateLastBackupDate();
            } catch (err) {
                console.error('[CRON BACKUP ERROR]', err);
            }
        });
        
        console.log('[CRON] Agendador de backup semanal ativado (Segundas às 08h).');
    },

    async updateLastBackupDate() {
        try {
            const now = new Date().toISOString();
            const { error } = await supabaseAdmin
                .from('system_configs')
                .upsert({ 
                    key: 'last_backup_at', 
                    value: JSON.stringify(now),
                    updated_at: now
                });
            
            if (error) throw error;
            console.log('[BACKUP] Data do último backup atualizada no BD:', now);
        } catch (err) {
            console.error('[BACKUP UPDATE ERROR]', err);
        }
    },

    async checkAndRunLazyBackup() {
        try {
            // Busca a data do último backup na tabela system_configs
            const { data, error } = await supabaseAdmin
                .from('system_configs')
                .select('value')
                .eq('key', 'last_backup_at')
                .single();

            if (error && error.code !== 'PGRST116') { // Ignora se não encontrar (primeira vez)
                console.error('[LAZY BACKUP FETCH ERROR]', error);
                return;
            }

            const lastBackup = data?.value; // O value já vem como string ISO (JSON parseado pelo SDK)
            const now = new Date();

            if (!lastBackup) {
                console.log('[LAZY BACKUP] Nenhum registro no BD. Rodando primeiro backup...');
                await this.sendBackupEmail('rodrigoindalecio@hotmail.com');
                await this.updateLastBackupDate();
                return;
            }

            const lastDate = new Date(JSON.parse(lastBackup));
            const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays >= 7) {
                console.log(`[LAZY BACKUP] Fazem ${diffDays} dias desde o último backup no BD. Rodando agora...`);
                await this.sendBackupEmail('rodrigoindalecio@hotmail.com');
                await this.updateLastBackupDate();
            }
        } catch (err) {
            console.error('[LAZY BACKUP ERROR]', err);
        }
    }
};
