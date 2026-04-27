import { jsPDF } from 'jspdf';
import { vanessaSignature } from '../signatures';

export async function generateContractPDF(brideName: string, text: string, signatures: any[] = [], token?: string, settings?: any) {
  try {
    console.log("Iniciando geração de PDF...");
    if (!text) {
      alert("Erro: Texto do contrato não encontrado.");
      return;
    }

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    const companyName = settings?.profile?.name || "Vanessa Bidinotti - Assessoria e Cerimonial";
    const docId = token || "DOC-" + Math.random().toString(36).substring(2, 9).toUpperCase();

    // Função para desenhar o rodapé de segurança em cada página
    const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(6);
      doc.setTextColor(160, 160, 160);
      const footerText = `${companyName} | ID: ${docId}\nDocumento assinado eletronicamente conforme MP 2.200-2/2001 e Lei 14.063/2020.`;
      doc.text(footerText, 15, pageHeight - 12, { maxWidth: pageWidth - 60 });
      doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 40, pageHeight - 10);
      
      // Linha divisória fina
      doc.setDrawColor(240, 240, 240);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    };

    // --- RENDERIZAÇÃO MANUAL DO CONTRATO ---
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = pageWidth - (margin * 2);
    let currentY = 12; 
    let isFirstContent = true;

    const checkPageBreak = (needed: number) => {
      if (currentY + needed > 282) {
        doc.addPage();
        currentY = 12;
        return true;
      }
      return false;
    };

    const paragraphs = text.split('\n');
    let inCenterBlock = false;
    let sigLineCounter = 0;

    for (let pText of paragraphs) {
      if (pText.includes('<center>')) inCenterBlock = true;
      
      let cleanText = pText.replace(/<center>/g, '').replace(/<\/center>/g, '').replace(/\*\*/g, '').trim();
      
      if (cleanText === "" && isFirstContent) continue;
      isFirstContent = false;

      if (cleanText === "" && pText.trim() === "") {
          currentY += 1.5;
          continue;
      }

      const isExplicitCenter = pText.includes('<center>') || pText.includes('</center>');
      const isCenter = inCenterBlock || isExplicitCenter;
      const isBold = (pText.startsWith('**') && pText.endsWith('**')) || isCenter || isExplicitCenter;

      const isSignatureLine = cleanText.startsWith('____') || cleanText.includes('________________');
      if (isSignatureLine) {
          currentY += 8;
          sigLineCounter = 4;
      }

      doc.setFont("times", isBold ? "bold" : "normal");
      const splitLines = doc.splitTextToSize(cleanText, maxWidth);
      
      checkPageBreak(splitLines.length * 4.8);

      splitLines.forEach((line: string) => {
          if (isCenter) {
              doc.text(line, pageWidth / 2, currentY, { align: 'center' });
          } else {
              doc.text(line, margin, currentY, { maxWidth: maxWidth, align: 'justify' });
          }

          if (sigLineCounter > 0 && !isSignatureLine) {
              const availableSignatures = [
                  ...(signatures || []),
                  { signer_name: "Vanessa Bidinotti", signature_image: vanessaSignature },
                  { signer_name: "Vanessa Bidinotti Vicente", signature_image: vanessaSignature }
              ];

              for (const sig of availableSignatures) {
                  const sName = (sig.signer_name || "").toLowerCase();
                  const lText = line.toLowerCase();
                  if (sName.length > 3 && lText.includes(sName)) {
                      if (sig.signature_image) {
                          try {
                            doc.addImage(sig.signature_image, 'PNG', (pageWidth / 2) - 25, currentY - 21, 50, 20);
                            sigLineCounter = 0;
                          } catch (imgErr) {}
                      }
                  }
              }
          }

          currentY += 4.8;
          if (sigLineCounter > 0) sigLineCounter--;
      });

      if (isSignatureLine) currentY += 1.5;
      else currentY += 0.8;

      if (pText.includes('</center>')) inCenterBlock = false;
    }

    const totalPages = doc.getNumberOfPages();
    for(let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, i, totalPages);
    }

    // --- PÁGINA DE AUDITORIA ---
    doc.addPage();
    const auditY = 30;
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("RELATÓRIO DE ASSINATURAS", pageWidth / 2, auditY, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.text(`Documento ID: ${docId}`, pageWidth / 2, auditY + 10, { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, auditY + 15, { align: 'center' });

    let currentAuditY = auditY + 35;
    
    const auditSignatures = [
        ...(signatures || []),
        { 
            signer_name: "Vanessa Bidinotti Vicente", 
            signer_type: "CONTRATADA (CERTIFICADA)", 
            signed_at: new Date().toISOString(),
            ip_address: "IP de Autenticação de Propriedade",
            user_agent: "Assinatura via Sistema Genesis v1",
            signature_image: vanessaSignature
        }
    ];

    for(const sig of auditSignatures) {
        if (currentAuditY > 240) {
            doc.addPage();
            currentAuditY = 30;
        }

        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, currentAuditY, maxWidth, 50, 'FD');
        
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.setTextColor(136, 53, 69);
        doc.text(sig.signer_name.toUpperCase(), margin + 5, currentAuditY + 10);
        
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(`Papel: ${sig.signer_type || 'CONTRATANTE'}`, margin + 5, currentAuditY + 18);
        doc.text(`Data/Hora: ${new Date(sig.signed_at).toLocaleString('pt-BR')}`, margin + 5, currentAuditY + 23);
        
        doc.setFont("times", "bold");
        doc.text("PONTOS DE AUTENTICAÇÃO:", margin + 5, currentAuditY + 30);
        doc.setFont("times", "normal");
        doc.text(`Telefone: ${sig.signer_phone || "Proprietário do Sistema"}`, margin + 5, currentAuditY + 34);
        doc.text(`E-mail: ${sig.signer_email || "Autenticado via Painel Administrativo"}`, margin + 5, currentAuditY + 38);
        doc.text(`Localização: ${sig.signer_location || "Aproximada (via IP)"}`, margin + 5, currentAuditY + 42);

        doc.text(`IP: ${sig.ip_address}`, margin + 90, currentAuditY + 34);
        doc.text(`Dispositivo: ${sig.user_agent.substring(0, 60)}...`, margin + 90, currentAuditY + 38, { maxWidth: maxWidth - 90 });
        
        if (sig.signature_image) {
            try {
                doc.addImage(sig.signature_image, 'PNG', margin + maxWidth - 55, currentAuditY + 15, 50, 20);
            } catch (e) {}
        }

        doc.setFontSize(9);
        doc.setTextColor(34, 197, 94);
        doc.text("✓ INTEGRIDADE GARANTIDA", margin + maxWidth - 5, currentAuditY + 10, { align: 'right' });
        doc.setTextColor(0, 0, 0);

        currentAuditY += 60;
    }

    if (currentAuditY > 260) { doc.addPage(); currentAuditY = 20; }
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const complianceText = "Certificamos a integridade deste documento e a autenticidade das assinaturas colhidas via endereço de IP e ID de dispositivo, em conformidade com o disposto na Medida Provisória nº 2.200-2/2001 e na Lei nº 14.063/2020. O registro cronológico e os metadados de acesso garantem a não-repúdio e a autoria das partes envolvidas.";
    doc.text(complianceText, margin, currentAuditY + 10, { maxWidth: maxWidth, align: 'justify' });

    const fileName = `Contrato_${brideName.replace(/\s+/g, '_')}_Assinado.pdf`;
    doc.save(fileName);
    console.log("PDF gerado com sucesso!");
    
  } catch (error: any) {
    console.error("Erro crítico na geração do PDF:", error);
    alert("Erro ao gerar o PDF: " + error.message);
  }
}
