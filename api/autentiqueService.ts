import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const autentiqueService = {
    /**
     * Converte um número para valor por extenso em Português (Reais).
     */
    numeroParaExtenso(valor: number) {
        const unidades = ["", "UM", "DOIS", "TRÊS", "QUATRO", "CINCO", "SEIS", "SETE", "OITO", "NOVE"];
        const dezenas10 = ["DEZ", "ONZE", "DOZE", "TREZE", "QUATORZE", "QUINZE", "DEZESSEIS", "DEZESSEIS", "DEZOITO", "DEZENOVE"];
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
        const milhar = Math.floor(inteiro / 1000);
        const resto = inteiro % 1000;
        if (milhar > 0) {
            if (milhar === 1) res += "MIL";
            else res += escreverAte999(milhar) + " MIL";
        }
        if (resto > 0) {
            if (res !== "") {
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

    formatDateSecure(dateStr: string) {
        if (!dateStr) return '';
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },

    /**
     * Renderiza o template substituindo as variáveis.
     * Retorna o texto final formatado para o PDF.
     */
    async renderTemplate(templateText: string, brideId: number) {
        const [brideRes, companyRes] = await Promise.all([
            supabase.from("brides").select("*").eq("id", brideId).single(),
            supabase.from("company_settings").select("*").limit(1).single()
        ]);

        if (brideRes.error) throw new Error("Noiva não encontrada.");
        const bride = brideRes.data;
        const company = companyRes.data || {};

        const isMale = bride.signer_type === 'noivo' || 
                      (bride.couple_type === 'tradicional' && bride.signer_type === 'noivo') || 
                      (bride.couple_type === 'noivos');

        let totalHoursLabel = "__________";
        if (bride.event_start_time && bride.event_end_time) {
            const [startH, startM] = bride.event_start_time.split(':').map(Number);
            const [endH, endM] = bride.event_end_time.split(':').map(Number);
            let diff = (endH + endM/60) - (startH + startM/60);
            if (diff < 0) diff += 24;
            const finalHours = Math.ceil(diff + 3);
            totalHoursLabel = `${finalHours} horas`;
        }

        const numValor = bride.contract_value || 0;
        const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValor);

        const variables: any = {
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
            "{{noivo_nome}}": bride.spouse_name,
            "{{data_evento}}": this.formatDateSecure(bride.event_date),
            "{{local_evento}}": bride.event_location,
            "{{local_endereco}}": bride.event_address,
            "{{horario_inicio}}": bride.event_start_time,
            "{{horario_fim}}": bride.event_end_time,
            "{{duracao_evento}}": totalHoursLabel,
            "{{quantidade_convidados}}": bride.guest_count,
            "{{valor_contrato}}": `${valorFormatado} (${this.numeroParaExtenso(numValor)})`,
            "{{valor_hora_extra}}": new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bride.extra_hour_value || 300),
            "{{prazo_pagamento}}": bride.payment_deadline_days || 20,
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
            "{{cidade_hoje}}": company.city || "Guarulhos",
            "{{descricao_locais}}": bride.has_different_locations 
                ? `Cerimônia em: ${bride.event_location}${bride.event_address ? `, ${bride.event_address}` : ''}. Recepção em: ${bride.reception_location}${bride.reception_address ? `, ${bride.reception_address}` : ''}`
                : `Cerimônia e Recepção em: ${bride.event_location}${bride.event_address ? `, ${bride.event_address}` : ''}`
        };

        let rendered = templateText;
        for (const [key, value] of Object.entries(variables)) {
            rendered = rendered.split(key).join(String(value || "__________"));
        }

        return rendered;
    },

    /**
     * Gera um PDF a partir do texto renderizado.
     * Usa jsPDF para criar o arquivo em formato de buffer.
     */
    async generatePDF(text: string): Promise<Buffer> {
        try {
            // Lazy import para evitar crash no ambiente serverless (jsPDF usa APIs de browser)
            const { jsPDF } = await import('jspdf');

            const cleanText = text
                .replace(/<center>/gi, '')
                .replace(/<\/center>/gi, '\n')
                .replace(/\*\*/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/<br\s*\/?>/gi, '\n');

            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            doc.setFont("helvetica");
            doc.setFontSize(10);

            const lines = doc.splitTextToSize(cleanText, 180);
            let y = 20;
            const pageHeight = doc.internal.pageSize.height;

            lines.forEach((line: string) => {
                if (y > pageHeight - 20) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 15, y);
                y += 5;
            });

            const arrayBuffer = doc.output('arraybuffer');
            return Buffer.from(arrayBuffer);
        } catch (err: any) {
            console.error('[Autentique] Erro na geração do PDF:', err);
            throw new Error(`Falha ao gerar PDF do contrato: ${err.message}`);
        }
    },

    /**
     * Envia o documento para o Autentique via GraphQL API.
     */
    async sendToAutentique(contractId: string, signerType: 'noiva' | 'noivo' = 'noiva', userSettings?: { autentiqueToken?: string, isSandbox?: boolean }) {
        console.log(`[Autentique] Iniciando processo para contrato ${contractId}`);
        
        const { data: contract, error: contractError } = await supabase
            .from("contracts")
            .select("*, brides(*)")
            .eq("id", contractId)
            .single();

        if (contractError || !contract) {
            console.error('[Autentique] Contrato não encontrado no banco');
            throw new Error("Contrato não encontrado.");
        }

        const apiToken = userSettings?.autentiqueToken || process.env.AUTENTIQUE_TOKEN;
        if (!apiToken) {
            console.error('[Autentique] Token de API ausente');
            throw new Error("Token do Autentique não configurado.");
        }

        const isSandbox = userSettings?.isSandbox ?? false;
        const brideData = Array.isArray(contract.brides) ? contract.brides[0] : contract.brides;
        const clientEmail = (brideData.email || "").trim();

        if (!clientEmail) {
            console.error('[Autentique] E-mail do cliente ausente');
            throw new Error("E-mail do cliente é obrigatório para o Autentique.");
        }

        console.log(`[Autentique] Gerando PDF... Sandbox: ${isSandbox}`);
        
        // Gera o PDF
        const pdfBuffer = await this.generatePDF(contract.generated_text);

        const operations = {
            query: `
                mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!, $sandbox: Boolean!) {
                    createDocument(sandbox: $sandbox, document: $document, signers: $signers, file: $file, type: WHATSAPP_FLOW) {
                        id
                        name
                        signatures {
                            public_id
                            name
                            email
                            link {
                                short_link
                            }
                        }
                    }
                }
            `,
            variables: {
                document: {
                    name: `Contrato - ${brideData.name}`
                },
                signers: [
                    {
                        name: "Vanessa Bidinotti",
                        phone: "+5511980105982",
                        delivery_method: "DELIVERY_METHOD_WHATSAPP",
                        action: "SIGN"
                    },
                    {
                        name: brideData.name,
                        action: "SIGN",
                        ...(brideData.phone_number ? {
                            phone: (() => {
                                const clean = brideData.phone_number.replace(/\D/g, '');
                                if (clean.startsWith('55') && (clean.length === 12 || clean.length === 13)) {
                                    return `+${clean}`;
                                }
                                return `+55${clean}`;
                            })(),
                            delivery_method: "DELIVERY_METHOD_WHATSAPP"
                        } : {
                            email: clientEmail,
                            delivery_method: "DELIVERY_METHOD_EMAIL"
                        })
                    }
                ],
                file: null,
                sandbox: isSandbox
            }
        };

        const map = {
            '0': ['variables.file']
        };

        // Lazy import para evitar crash no ambiente serverless
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('operations', JSON.stringify(operations));
        form.append('map', JSON.stringify(map));
        
        // No WhatsApp Flow, enviamos o texto como Markdown (.md) em vez de PDF
        const markdownBuffer = Buffer.from(contract.generated_text);
        form.append('0', markdownBuffer, { filename: 'contrato.md', contentType: 'text/markdown' });

        console.log(`[Autentique] Enviando para a API...`);

        const response = await axios.post('https://api.autentique.com.br/v2/graphql', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${apiToken}`
            }
        });

        if (response.data.errors) {
            console.error('[Autentique API Error]', JSON.stringify(response.data.errors, null, 2));
            throw new Error(`Erro Autentique: ${response.data.errors[0].message}`);
        }

        const result = response.data.data.createDocument;
        console.log(`[Autentique] Documento criado com sucesso: ${result.id}`);

        // Atualiza contrato no Supabase
        const { error: updateError } = await supabase.from("contracts").update({
            autentique_document_id: result.id,
            sign_url_admin: result.signatures[0]?.link?.short_link,
            sign_url_client: result.signatures[1]?.link?.short_link,
            status: 'sent'
        }).eq("id", contractId);

        if (updateError) {
            console.error('[Autentique] Erro ao atualizar banco:', updateError);
            // Mesmo com erro no banco, retornamos o sucesso da API para não frustrar o usuário
        }

        return {
            id: result.id,
            sign_url_admin: result.signatures[0]?.link?.short_link,
            sign_url_client: result.signatures[1]?.link?.short_link
        };
    },

    /**
     * Consulta o status em tempo real do documento no Autentique.
     * Retorna signatários, status de cada um e links.
     */
    async getDocumentStatus(autentiqueDocumentId: string, apiToken: string, isSandbox: boolean = false) {
        const query = `
            query {
                document(id: "${autentiqueDocumentId}") {
                    id
                    name
                    signatures {
                        public_id
                        name
                        email
                        action {
                            name
                        }
                        viewed {
                            created_at
                        }
                        signed {
                            created_at
                        }
                        rejected {
                            created_at
                        }
                        link {
                            short_link
                        }
                    }
                    files {
                        signed
                    }
                }
            }
        `;

        const response = await axios.post(
            'https://api.autentique.com.br/v2/graphql',
            { query },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                }
            }
        );

        if (response.data.errors) {
            throw new Error(`Erro Autentique: ${response.data.errors[0].message}`);
        }

        return response.data.data.document;
    },

    /**
     * Edita um documento existente no Autentique via updateDocument mutation.
     */
    async updateDocument(
        autentiqueDocumentId: string,
        updates: {
            name?: string;
            message?: string;
            reminder?: 'DAILY' | 'WEEKLY';
            refusable?: boolean;
            deadline_at?: string;
            expiration?: { days_before: number; notify_at: string };
        },
        apiToken: string
    ) {
        const mutation = `
            mutation UpdateDoc($id: UUID!, $document: UpdateDocumentInput!) {
                updateDocument(id: $id, document: $document) {
                    id
                    name
                    message
                    reminder
                    refusable
                    deadline_at
                }
            }
        `;

        const response = await axios.post(
            'https://api.autentique.com.br/v2/graphql',
            {
                query: mutation,
                variables: {
                    id: autentiqueDocumentId,
                    document: updates
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                }
            }
        );

        if (response.data.errors) {
            throw new Error(`Erro Autentique: ${response.data.errors[0].message}`);
        }

        return response.data.data.updateDocument;
    },

    /**
     * Reenvia a solicitação de assinatura para um ou mais signatários.
     */
    async resendSignatures(publicIds: string[], apiToken: string) {
        const query = `
            mutation {
                resendSignatures(public_ids: ${JSON.stringify(publicIds)})
            }
        `;

        const response = await axios.post(
            'https://api.autentique.com.br/v2/graphql',
            { query },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                }
            }
        );

        if (response.data.errors) {
            throw new Error(`Erro Autentique: ${response.data.errors[0].message}`);
        }

        return response.data.data.resendSignatures;
    }
};
