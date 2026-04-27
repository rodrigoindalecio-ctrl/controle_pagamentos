import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const zapsignService = {
    /**
     * Converte um número para valor por extenso em Português (Reais).
     */
    numeroParaExtenso(valor: number) {
        const unidades = ["", "UM", "DOIS", "TRÊS", "QUATRO", "CINCO", "SEIS", "SETE", "OITO", "NOVE"];
        const dezenas10 = ["DEZ", "ONZE", "DOZE", "TREZE", "QUATORZE", "QUINZE", "DEZESSEIS", "DEZESSETE", "DEZOITO", "DEZENOVE"];
        const dezenas = ["", "", "VINTE", "TRINTA", "QUARENTA", "CINQUENTA", "SESSENTA", "SETENTA", "OITENTA", "NOVENTA"];
        const centenas = ["", "CENTO", "DUZENTOS", "TREZENTOS", "QUATROCENTOS", "QUINHENTOS", "SEISCENTOS", "SETECENTOS", "OITOCENTOS", "NOVECENTOS"];

        const escreverAte999 = (n: number) => {
            if (n === 0) return "";
            if (n === 100) return "CEM";
            
            let res = "";
            const c = Math.floor(n / 100);
            const d = Math.floor((n % 100) / 10);
            const u = n % 10;

            if (c > 0) res += centenas[c];
            if (d > 0) {
                if (res !== "") res += " E ";
                if (d === 1) {
                    res += dezenas10[u];
                    return res;
                }
                res += dezenas[d];
            }
            if (u > 0) {
                if (res !== "") res += " E ";
                res += unidades[u];
            }
            return res;
        };

        if (valor === 0) return "ZERO REAIS";
        
        const inteiro = Math.floor(valor);
        const centavos = Math.round((valor - inteiro) * 100);

        let res = "";
        
        // Milhares (até 999.999 para simplificar, mas expansível)
        const milhar = Math.floor(inteiro / 1000);
        const resto = inteiro % 1000;

        if (milhar > 0) {
            if (milhar === 1) res += "MIL";
            else res += escreverAte999(milhar) + " MIL";
        }

        if (resto > 0) {
            if (res !== "") {
                // Regra do "E" entre milhar e centena
                if (resto < 100 || resto % 100 === 0) res += " E ";
                else res += " ";
            }
            res += escreverAte999(resto);
        }

        res += (inteiro === 1) ? " REAL" : " REAIS";

        if (centavos > 0) {
            res += " E " + escreverAte999(centavos) + (centavos === 1 ? " CENTAVO" : " CENTAVOS");
        }

        return res.trim();
    },

    /**
     * Formata uma data YYYY-MM-DD para DD/MM/YYYY sem sofrer com fuso horário.
     */
    formatDateSecure(dateStr: string) {
        if (!dateStr) return '';
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },

    /**
     * Busca a melhor conta ZapSign disponível com base na cota mensal.
     */
    async getBestAccount() {
        const { data: accounts, error } = await supabase
            .from("zapsign_accounts")
            .select("*")
            .eq("active", true)
            .order("monthly_used", { ascending: true });

        if (error || !accounts || accounts.length === 0) {
            throw new Error("Nenhuma conta ZapSign ativa encontrada.");
        }

        // Se houver uma conta com 'sandbox' no nome, prioriza para testes
        const sandboxAccount = accounts.find(acc => acc.name.toLowerCase().includes('sandbox'));
        if (sandboxAccount) return sandboxAccount;

        const availableAccounts = accounts.filter(acc => acc.monthly_used < acc.monthly_limit);
        if (availableAccounts.length === 0) {
            throw new Error("Cota mensal atingida em todas as contas ZapSign.");
        }

        return availableAccounts[0];
    },

    /**
     * Substitui as variáveis {{chave}} pelos dados reais da noiva e da empresa.
     */
    async renderTemplate(templateText: string, brideId: number) {
        const [brideRes, companyRes] = await Promise.all([
            supabase.from("brides").select("*").eq("id", brideId).single(),
            supabase.from("company_settings").select("*").limit(1).single()
        ]);

        if (brideRes.error) throw new Error("Noiva não encontrada.");
        const bride = brideRes.data;
        const company = companyRes.data || {};

        // Lógica de Gênero baseada no signatário e tipo de casal
        const isMale = bride.signer_type === 'noivo' || 
                      (bride.couple_type === 'tradicional' && bride.signer_type === 'noivo') || 
                      (bride.couple_type === 'noivos');

        // Lógica de Horas Totais (Diferença + 3h)
        let totalHoursLabel = "__________";
        if (bride.event_start_time && bride.event_end_time) {
            const [startH, startM] = bride.event_start_time.split(':').map(Number);
            const [endH, endM] = bride.event_end_time.split(':').map(Number);
            
            let diff = (endH + endM/60) - (startH + startM/60);
            if (diff < 0) diff += 24; // Atravessou a meia-noite
            
            const finalHours = Math.ceil(diff + 3);
            totalHoursLabel = `${finalHours} horas`;
        }

        // Função para Valor por Extenso (Simples para Contratos)
        const extenso = (valor: number) => {
            // Como bibliotecas completas são pesadas, usamos um formato prático para contratos
            const formatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
            // Aqui poderíamos adicionar uma lógica de conversão real, mas por hora vamos garantir o formato padrão
            // e adicionar o placeholder ou uma versão simplificada se necessário.
            // Para ser 100% fiel ao pedido, vou adicionar uma lógica de extenso manual básica
            return formatado;
        };

        const numValor = bride.contract_value || 0;
        const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValor);

        const variables: any = {
            // CONTRATANTE
            "{{cliente_nome}}": bride.name,
            "{{cliente_cpf}}": bride.cpf,
            "{{cliente_rg}}": bride.rg,
            "{{cliente_nacionalidade}}": bride.nationality,
            "{{cliente_estado_civil}}": bride.marital_status,
            "{{cliente_profissao}}": bride.profession,
            "{{cliente_nascimento}}": this.formatDateSecure(bride.birth_date),
            "{{cliente_genero_nascido}}": isMale ? 'Nascido' : 'Nascida',
            "{{cliente_genero_domiciliado}}": isMale ? 'domiciliado' : 'domiciliada',
            "{{cliente_endereco}}": `${bride.address}${bride.address_number ? `, nº ${bride.address_number}` : ''}${bride.address_complement ? ` - ${bride.address_complement}` : ''}`,
            "{{cliente_bairro}}": bride.neighborhood,
            "{{cliente_cep}}": bride.zip_code,
            "{{cliente_cidade}}": bride.city,
            "{{cliente_estado}}": bride.state,
            "{{cliente_telefone}}": bride.phone_number,

            // EVENTO
            "{{noivo_nome}}": bride.spouse_name,
            "{{data_evento}}": this.formatDateSecure(bride.event_date),
            "{{local_evento}}": bride.event_location,
            "{{local_endereco}}": bride.event_address,
            "{{endereco_local}}": bride.event_address, // Variável adicional para garantir
            
            // Locais Separados
            "{{local_cerimonia}}": bride.event_location,
            "{{endereco_cerimonia}}": bride.event_address,
            "{{local_recepcao}}": bride.has_different_locations ? bride.reception_location : bride.event_location,
            "{{endereco_recepcao}}": bride.has_different_locations ? bride.reception_address : bride.event_address,

            // Tag Dinâmica de Frase de Local
            "{{descricao_locais}}": bride.has_different_locations 
                ? `Cerimônia: ${bride.event_location} (${bride.event_address}) e recepção se realizará no ${bride.reception_location} (${bride.reception_address}) que se realizarão no mesmo dia`
                : `Cerimônia e recepção que se realizarão no mesmo dia, no endereço: ${bride.event_location} (${bride.event_address})`,

            "{{horario_inicio}}": bride.event_start_time,
            "{{horario_fim}}": bride.event_end_time,
            "{{duracao_evento}}": totalHoursLabel,
            "{{quantidade_convidados}}": bride.guest_count,
            
            // FINANCEIRO
            "{{valor_contrato}}": `${valorFormatado} (${this.numeroParaExtenso(numValor)})`,
            "{{valor_hora_extra}}": new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bride.extra_hour_value || 300),
            "{{prazo_pagamento}}": bride.payment_deadline_days || 20,

            // CONTRATADA
            "{{empresa_nome}}": company.company_name,
            "{{empresa_cnpj}}": company.cnpj,
            "{{empresa_endereco}}": company.address,
            "{{empresa_telefone}}": company.phone || company.company_phone,
            "{{empresa_representante}}": company.representative_name,
            "{{empresa_representante_rg}}": company.representative_rg,
            "{{empresa_representante_cpf}}": company.representative_cpf,
            "{{empresa_pix}}": company.pix_key,
            "{{empresa_banco}}": company.bank_name,
            "{{data_hoje}}": new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
            "{{cidade_hoje}}": company.city || "Guarulhos"
        };

        let rendered = templateText;
        for (const [key, value] of Object.entries(variables)) {
            rendered = rendered.split(key).join(String(value || "__________"));
        }

        // Correção de Gênero Automática
        if (isMale) {
            rendered = rendered.replace(/\bNascida em\b/g, 'Nascido em');
            rendered = rendered.replace(/\bdomiciliada\b/g, 'domiciliado');
        } else {
            rendered = rendered.replace(/\bNascido em\b/g, 'Nascida em');
            rendered = rendered.replace(/\bdomiciliado\b/g, 'domiciliada');
        }

        // Post-processamento para Estilização (Forçando Centralização na ZapSign com Respiro de Linhas)
        let lines = rendered.split('\n');

        if (lines.length > 0 && lines[0].trim().length > 0) {
            // Título: Isolado por linhas em branco para o parser entender a tag <center>
            lines[0] = `\n\n<center>\n\n**${lines[0].trim().toUpperCase()}**\n\n</center>\n\n`;
        }

        // Negrito para Cláusulas e Seções
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Negrito para Seções (linhas curtas em CAIXA ALTA)
            if (line.length > 3 && line.length < 50 && line === line.toUpperCase() && !line.includes('<center>')) {
                lines[i] = `**${line}**`;
            }

            // Negrito para Início de Cláusulas: "Cláusula Xª"
            lines[i] = lines[i].replace(/^(Cláusula \d+[ªº]\.?)/gi, '**$1**');
            
            // Negrito para "Parágrafo ..."
            lines[i] = lines[i].replace(/^(Parágrafo (único|primeiro|segundo|terceiro|quarto|quinto|sexto)\.?)/gi, '**$1**');
        }

        // Centralizar Bloco de Assinaturas (Tudo do final)
        let firstSignatureLineIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line.includes('____') || line.match(/, \d{1,2} de .* de \d{4}/)) {
                firstSignatureLineIndex = i;
                break;
            }
        }

        if (firstSignatureLineIndex !== -1) {
            // Criamos um bloco limpo e centralizado para o final do documento
            let footerBlock = `\n\n<center>\n\n`;
            for (let i = firstSignatureLineIndex; i < lines.length; i++) {
                let line = lines[i].trim();
                if (line !== "") {
                    footerBlock += line + `  \n`; // Quebra de linha Markdown
                }
            }
            footerBlock += `\n\n</center>\n\n`;
            
            // Remove as linhas originais do final e insere o bloco formatado
            lines.splice(firstSignatureLineIndex, lines.length - firstSignatureLineIndex, footerBlock);
        }

        return lines.join('\n');
    },

    /**
     * Envia o documento para a ZapSign.
     */
    async sendToZapSign(contractId: string, signerType: 'noiva' | 'noivo' = 'noiva', userSettings?: { zapsignToken?: string, isSandbox?: boolean }) {
        const { data: contract, error: contractError } = await supabase
            .from("contracts")
            .select("*, brides(*)")
            .eq("id", contractId)
            .single();

        if (contractError || !contract) {
            console.error('[ZapSign] Erro ao buscar contrato:', contractError);
            throw new Error("Contrato não encontrado no banco de dados.");
        }

        console.log(`[ZapSign Debug] Dados do Contrato:`, { 
            id: contract.id, 
            hasBride: !!contract.brides,
            brideEmail: contract.brides?.email,
            bridePhone: contract.brides?.phone_number 
        });

        // Se o Supabase não trouxe a noiva pelo join, tenta buscar manualmente
        if (!contract.brides && contract.bride_id) {
            console.log(`[ZapSign Debug] Join falhou. Buscando noiva ID ${contract.bride_id} manualmente...`);
            const { data: bData } = await supabase.from("brides").select("*").eq("id", contract.bride_id).single();
            contract.brides = bData;
        }

        if (!contract.brides) {
            throw new Error("Não foi possível localizar os dados do cliente para este contrato.");
        }

        let apiToken = "";
        let isSandbox = false;
        let accountId = null;

        if (userSettings?.zapsignToken && userSettings.zapsignToken.trim() !== '') {
            apiToken = userSettings.zapsignToken.trim();
            isSandbox = !!userSettings.isSandbox;
            console.log(`[ZapSign - 2026-04-13] Usando Token Pessoal. Sandbox: ${isSandbox}`);
        } else {
            const account = await this.getBestAccount();
            apiToken = account.api_key.trim();
            // FORÇAR PRODUÇÃO PARA CONTAS CADASTRADAS NO BANCO
            isSandbox = false; 
            accountId = account.id;
            console.log(`[ZapSign - 2026-04-13] Usando Conta Coletiva (${account.name}). URL: PRODUÇÃO`);
        }

        const baseUrl = isSandbox ? "https://sandbox.api.zapsign.com.br/api/v1" : "https://api.zapsign.com.br/api/v1";
        console.log(`[ZapSign] URL Final: ${baseUrl}`);
        console.log(`[ZapSign] Token Prefixo: ${apiToken ? apiToken.substring(0, 8) : 'MISSING'}...`);

        const brideData = Array.isArray(contract.brides) ? contract.brides[0] : contract.brides;
        
        const clientName = signerType === 'noiva' ? brideData.name : (brideData.spouse_name || brideData.name);
        const clientEmail = (brideData.email || "").trim();
        const clientPhone = (brideData.phone_number || "").replace(/\D/g, "");

        console.log(`[ZapSign Debug] Signatário:`, { clientName, clientEmail, clientPhone });

        if (!clientEmail && !clientPhone) {
            throw new Error("E necessario fornecer ao menos o E-mail ou o WhatsApp do cliente para o ZapSign.");
        }

        // Prepara objeto do contratante (Noiva/Noivo)
        const clientSigner: any = {
            name: clientName,
            auth_mode: "signature",
            order: 2
        };

        if (clientEmail) {
            clientSigner.email = clientEmail;
            clientSigner.send_email = true;
        }

        if (clientPhone) {
            clientSigner.phone_number = clientPhone;
            clientSigner.send_automatic_whatsapp = true;
        }

        const payload = {
            name: `Contrato - ${contract.brides.name}`,
            markdown_text: contract.generated_text,
            signers: [
                {
                    name: "Vanessa Bidinotti",
                    email: "contato@vanessabidinotti.com.br",
                    auth_mode: "signature",
                    send_email: true,
                    order: 1
                },
                clientSigner
            ],
            lang: "pt-br"
        };

        console.log(`[ZapSign Request] Enviando para: ${baseUrl}/docs?api_token=${apiToken.substring(0,5)}...`);
        
        const response = await fetch(`${baseUrl}/docs?api_token=${apiToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resText = await response.text();
        console.log(`[ZapSign Response Raw] Status: ${response.status}`, resText.substring(0, 200));

        let result;
        try {
            result = JSON.parse(resText);
        } catch (e) {
            console.error('[ZapSign JSON Parse Error] Resposta não é JSON:', resText);
            throw new Error(`Resposta invalida do servidor ZapSign (Status ${response.status}). Verifique o console do servidor.`);
        }

        if (!response.ok) {
            console.error('[ZapSign API Error]', result);
            const errMsg = result.error || result.detail || result.message || "Erro desconhecido";
            throw new Error(`[Conta: ${accountId || 'Producao'}] ZapSign Erro: ${errMsg}`);
        }

        // Atualiza contrato com os links reais
        await supabase.from("contracts").update({
            zapsign_document_id: result.open_id,
            sign_url_admin: result.signers.find((s: any) => s.order === 1)?.sign_url,
            sign_url_client: result.signers.find((s: any) => s.order === 2)?.sign_url,
            status: 'sent',
            zapsign_account_id: accountId
        }).eq("id", contractId);

        // Incrementa uso da conta (apenas se for conta compartilhada)
        if (accountId) {
            const { data: acc } = await supabase.from("zapsign_accounts").select("monthly_used").eq("id", accountId).single();
            if (acc) {
                await supabase
                    .from("zapsign_accounts")
                    .update({ monthly_used: (acc.monthly_used || 0) + 1 })
                    .eq("id", accountId);
            }
        }

        return {
            ...result,
            sign_url_admin: result.signers?.[0]?.sign_url,
            sign_url_client: result.signers?.[1]?.sign_url
        };
    }
};

