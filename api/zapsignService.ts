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

        return rendered;
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

        if (contractError || !contract) throw new Error("Contrato não encontrado.");

        let apiToken = "";
        let isSandbox = true;
        let accountId = null;

        if (userSettings?.zapsignToken) {
            apiToken = userSettings.zapsignToken;
            isSandbox = userSettings.isSandbox ?? true;
        } else {
            const account = await this.getBestAccount();
            apiToken = account.api_key;
            isSandbox = account.name.toLowerCase().includes('sandbox');
            accountId = account.id;
        }

        const baseUrl = isSandbox ? "https://sandbox.api.zapsign.com.br/api/v1" : "https://api.zapsign.com.br/api/v1";

        const clientName = signerType === 'noiva' ? contract.brides.name : contract.brides.spouse_name;
        const clientEmail = contract.brides.email;

        if (!clientEmail) throw new Error("E-mail do cliente é obrigatório para o ZapSign.");

        const payload = {
            name: `Contrato - ${contract.brides.name}`,
            markdown_text: contract.generated_text,
            signers: [
                {
                    name: "Vanessa Bidinotti",
                    email: "vanessabidinotti@hotmail.com", 
                    auth_mode: "signature",
                    order: 1
                },
                {
                    name: clientName,
                    email: clientEmail,
                    auth_mode: "signature",
                    order: 2
                }
            ],
            lang: "pt-br"
        };

        const response = await fetch(`${baseUrl}/docs/?api_token=${apiToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || "Erro na API da ZapSign");

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

