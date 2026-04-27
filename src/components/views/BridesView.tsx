import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bride, Payment, AppSettings, ContractTemplate } from "../../types";
import { Eye, Edit, Trash2, CheckCircle, XCircle, ChevronDown, User, Calendar, MapPin, Sparkles, Filter, Search, Plus, FileText, ChevronRight, X, AlertCircle, Download, Send, CircleDollarSign, TrendingDown, Heart, Clock, Users, Award, Wallet, MoreVertical, UserMinus } from "lucide-react";
import { parseDate, formatDisplayDate, generateContractPDF } from "../../App";
import { Header } from "../../App";

// --- Brides View ---

export const DistratoModal = ({ isOpen, onClose, onConfirm, bride, payments, goals }: { isOpen: boolean, onClose: () => void, onConfirm: (fine: number) => void, bride: Bride | null, payments: Payment[], goals: AppSettings['goals'] }) => {
  const [fine, setFine] = useState(0);

  useEffect(() => {
    if (bride && isOpen) {
      const eventDate = new Date(bride.event_date);
      const today = new Date();
      const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Lógica de multa dinâmica baseada nos dias restantes
      const percent = diffDays > goals.fineThresholdDays ? goals.fineEarlyPercent : goals.fineLatePercent;
      setFine(bride.contract_value * (percent / 100));
    }
  }, [bride, isOpen, goals]);

  if (!bride) return null;

  const totalPaid = payments
    .filter(p => p.bride_id === bride.id && (p.status || '').trim().toLowerCase() === 'pago')
    .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

  const pendingFine = Math.max(0, fine - totalPaid);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#883545]/10">
            <div className="bg-[#883545]/5 p-6 border-b border-[#883545]/10 text-center">
              <div className="size-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-800">Distrato Comercial (V4)</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">{bride.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Contratado</p>
                  <p className="text-sm font-black text-slate-700">R$ {bride.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pago Até Hoje</p>
                  <p className="text-sm font-black text-emerald-600">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Acordado da Multa (R$)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(fine)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFine(Number(val) / 100);
                    }}
                    className="w-full pl-6 pr-4 py-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-lg font-black text-rose-600 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 transition-all outline-none"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 italic px-1">
                  *Sugestão baseada na data do evento: {fine >= bride.contract_value ? '100%' : '50%'}
                </p>
              </div>

              <div className="bg-rose-600 p-4 rounded-xl text-white shadow-lg shadow-rose-600/20">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Saldo Devedor da Multa</p>
                <p className="text-xl font-black">R$ {pendingFine.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Desistir</button>
              <button onClick={() => onConfirm(fine)} className="flex-[2] py-4 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 active:scale-95 transition-all">Confirmar Distrato</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ContractModal = ({ isOpen, onClose, bride, authFetch, showAlert }: { isOpen: boolean, onClose: () => void, bride: Bride | null, authFetch: any, showAlert: (t: string, m: string) => void }) => {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [previewText, setPreviewText] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'sent'>('select');
  const [signerType, setSignerType] = useState<'noiva' | 'noivo'>('noiva');

  useEffect(() => {
    if (isOpen && bride) {
      setStep('select');
      setPreviewText('');
      setSignerType((bride as any).signer_type || 'noiva');

      authFetch('/api/contract-templates')
        .then((res: any) => res.json())
        .then(data => {
          setTemplates(data);
          // Pré-seleção inteligente baseada no Tipo de Serviço
          if (bride.service_type) {
            const matched = data.find((t: any) =>
              t.name.toLowerCase().trim() === bride.service_type.toLowerCase().trim()
            );
            if (matched) setSelectedTemplateId(matched.id);
            else setSelectedTemplateId('');
          } else {
            setSelectedTemplateId('');
          }
        });
    }
  }, [isOpen, bride]);

  const handleGeneratePreview = async () => {
    if (!selectedTemplateId || !bride) return;
    setIsRendering(true);
    try {
      const res = await authFetch('/api/contracts/preview', {
        method: 'POST',
        body: JSON.stringify({ template_id: selectedTemplateId, bride_id: bride.id })
      });
      const data = await res.json();
      setPreviewText(data.rendered);
      setStep('preview');
    } catch (err) {
      showAlert('Erro na Prévia', 'Erro ao gerar prévia');
    } finally {
      setIsRendering(false);
    }
  };

  const handleCreateAndSend = async () => {
    setIsSending(true);
    try {
      // 1. Cria o contrato no banco
      const saveRes = await authFetch('/api/contracts', {
        method: 'POST',
        body: JSON.stringify({ 
            bride_id: bride?.id, 
            template_id: selectedTemplateId, 
            generated_text: previewText 
        })
      });
      const contract = await saveRes.json();

      if (!saveRes.ok) throw new Error(contract.error || "Erro ao salvar contrato");

      // 2. Gera o link interno de assinatura
      // Usamos o signature_token que foi gerado pelo banco ou criamos um agora
      const token = contract.signature_token || Math.random().toString(36).substring(2, 15);
      const signLink = `${window.location.origin}/?token=${token}`;

      // 3. Prepara a mensagem de WhatsApp
      const firstSignerName = bride.name.split(' ')[0];
      const message = `Olá ${firstSignerName}! Tudo bem? ✨\n\nFinalizei o seu contrato de ${bride.service_type}. Segue o link para você realizar a assinatura digital diretamente pelo seu celular:\n\n${signLink}\n\nQualquer dúvida estou à disposição! 💍`;
      
      const phone = (bride.phone_number || "").replace(/\D/g, "");
      const whatsappUrl = `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`;

      // 4. Abre o WhatsApp e finaliza o modal
      window.open(whatsappUrl, '_blank');
      setStep('sent');
      
      showAlert('Sucesso!', 'Link de assinatura gerado e WhatsApp aberto. O status do contrato será atualizado automaticamente assim que o cliente assinar.');

    } catch (err: any) {
      console.error('[Contract Error]', err);
      showAlert('Erro no Contrato', err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPDF = () => {
    generateContractPDF(bride.name, previewText);
  };

  if (!isOpen || !bride) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#883545] text-white">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest">Gerar Contrato</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Cliente: {bride.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 lg:p-8">
          {step === 'select' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Escolha o Modelo</label>
                <select
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">Selecione um template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signatário Identificado</p>
                  <p className="text-sm font-bold text-slate-700">
                    {bride.name}
                  </p>
                </div>
                <div className="px-3 py-1 bg-[#883545]/10 text-[#883545] rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {signerType === 'noiva' ? 'Noiva' : 'Noivo'}
                </div>
              </div>

              <button
                disabled={!selectedTemplateId || isRendering}
                onClick={handleGeneratePreview}
                className="w-full py-5 bg-[#883545] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                {isRendering ? 'Processando...' : 'Gerar Prévia Editável'}
              </button>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex justify-between items-end">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Confira e Edit se necessário</label>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-widest">Modo de Edição Ativo</span>
              </div>
              <textarea
                className="flex-1 w-full p-6 bg-slate-50 border-none rounded-2xl font-serif text-slate-700 leading-relaxed shadow-inner min-h-[400px] focus:ring-0"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
              />
              <div className="flex flex-col lg:flex-row gap-4 pt-4">
                <button onClick={() => setStep('select')} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Voltar</button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Baixar PDF
                </button>
                <button
                  onClick={handleCreateAndSend}
                  disabled={isSending}
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {isSending ? 'Enviando...' : <><Send className="w-4 h-4" /> Finalizar e Enviar para Assinatura</>}
                </button>
              </div>
            </div>
          )}

          {step === 'sent' && (
            <div className="py-20 text-center space-y-6">
              <div className="size-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">Contrato Disponível!</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">Uma nova aba foi aberta para você realizar a sua assinatura. Após você assinar, o cliente receberá o link automaticamente.</p>
              </div>
              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <button onClick={handleDownloadPDF} className="w-full py-4 bg-white text-[#883545] border-2 border-[#883545] rounded-2xl font-black uppercase tracking-widest hover:bg-[#883545]/5 transition-all flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" /> Baixar Cópia em PDF
                </button>
                <button onClick={onClose} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Fechar Janela</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const ClientSummaryModal = ({ isOpen, onClose, bride, payments, onEdit }: { isOpen: boolean, onClose: () => void, bride: Bride | null, payments: Payment[], onEdit: (b: Bride) => void }) => {
  if (!isOpen || !bride) return null;

  const bridePayments = payments.filter(p => p.bride_id === bride.id && (p.status || '').trim().toLowerCase() === 'pago');
  const totalPaid = bridePayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
  const balance = Math.max(0, (Number(bride.contract_value) || 0) - totalPaid);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
          >
            {/* Elegant Header */}
            <div className="relative p-8 pb-6 overflow-hidden bg-gradient-to-br from-[#883545] to-[#6a2935] text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-white/20 text-white backdrop-blur-sm`}>
                      {bride.status}
                    </span>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest italic">ID: {bride.id}</span>
                  </div>
                  
                  {/* Dynamic Labels based on couple type */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">
                        {bride.couple_type === 'noivos' ? 'Noivo' : 'Noiva'}:
                      </span>
                      <h3 className="text-3xl font-black italic tracking-tight leading-none">{bride.name}</h3>
                    </div>
                    {bride.spouse_name && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">
                          {bride.couple_type === 'noivas' ? 'Noiva' : 'Noivo'}:
                        </span>
                        <p className="text-lg font-bold opacity-80 italic">{bride.spouse_name}</p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8 space-y-8 bg-[#FDF8F8]/50">
              {/* Event Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#883545]/10 pb-2">
                  <Sparkles className="w-4 h-4 text-[#883545]" />
                  <h4 className="text-xs font-black text-[#883545] uppercase tracking-[0.2em]">Detalhes do Evento</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data do Casamento</p>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <Calendar className="w-4 h-4 text-[#883545]/40" />
                      {bride.event_date ? formatDisplayDate(bride.event_date) : 'Não definido'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {bride.couple_type === 'noivas' ? 'Noiva' : 'Noivo'}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <Heart className="w-4 h-4 text-[#883545]/40" />
                      {bride.spouse_name || 'Não informado'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Horário</p>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <Clock className="w-4 h-4 text-[#883545]/40" />
                      {bride.event_start_time || '--:--'}
                      {bride.event_end_time && ` até ${bride.event_end_time}`}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cerimônia / Local</p>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <MapPin className="w-4 h-4 text-[#883545]/40" />
                      <span className="truncate">{bride.event_location || 'Não definido'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Convidados</p>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <Users className="w-4 h-4 text-[#883545]/40" />
                      {bride.guest_count || '-'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo de Serviço</p>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <Award className="w-4 h-4 text-[#883545]/40" />
                      {bride.service_type || 'Não definido'}
                    </div>
                  </div>
                </div>
              </section>

              {/* Financial Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#883545]/10 pb-2">
                  <CircleDollarSign className="w-4 h-4 text-[#883545]" />
                  <h4 className="text-xs font-black text-[#883545] uppercase tracking-[0.2em]">Resumo Financeiro</h4>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contrato</p>
                    <div className="relative z-10">
                      {bride.status === 'Cancelado' && bride.original_value > 0 ? (
                        <>
                          <p className="text-xs text-slate-300 line-through font-bold">R$ {bride.original_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p className="text-sm font-black text-rose-600">R$ {bride.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </>
                      ) : (
                        <p className="text-base font-black text-slate-700">R$ {(bride.contract_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      )}
                    </div>
                    <Wallet className="absolute -right-2 -bottom-2 w-12 h-12 text-[#883545]/5 group-hover:scale-110 transition-transform" />
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Total Pago</p>
                    <p className="text-base font-black text-emerald-600 relative z-10">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <CheckCircle className="absolute -right-2 -bottom-2 w-12 h-12 text-emerald-600/5 group-hover:scale-110 transition-transform" />
                  </div>

                  <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group">
                    <p className="text-[9px] font-black text-rose-600/60 uppercase tracking-widest mb-1">Saldo</p>
                    <p className="text-base font-black text-rose-600 relative z-10">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <TrendingDown className="absolute -right-2 -bottom-2 w-12 h-12 text-rose-600/5 group-hover:scale-110 transition-transform" />
                  </div>
                </div>

                {/* Micro Payments List */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Últimos Pagamentos</p>
                  </div>
                  <div className="max-h-32 overflow-auto divide-y divide-slate-50">
                    {bridePayments.length === 0 ? (
                      <p className="px-4 py-4 text-[10px] font-bold text-slate-300 italic text-center">Nenhum pagamento registrado.</p>
                    ) : ( 
                      bridePayments.sort((a,b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).map(p => (
                        <div key={p.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{formatDisplayDate(p.payment_date)}</span>
                            <span className="text-[11px] font-black text-slate-900 italic translate-y-[1px]">{p.description || 'Assessoria'}</span>
                          </div>
                          <span className="text-[11px] font-black text-emerald-600">
                            R$ {Number(p.amount_paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              {/* Contact / Bio */}
              <section className="grid grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Contato</p>
                  <p className="text-xs font-bold text-slate-600">{bride.email}</p>
                  <p className="text-xs font-black text-[#883545]">{bride.phone_number || '-'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Endereço do Evento</p>
                  <p className="text-[10px] font-bold text-slate-500 leading-tight">
                    {bride.event_address || 'Não cadastrado'}
                  </p>
                </div>
              </section>
            </div>

            <div className="p-6 bg-white border-t border-slate-50 flex gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all font-sans"
              >
                Fechar
              </button>
              <button 
                onClick={() => { onEdit(bride); onClose(); }} 
                className="flex-[2] py-4 bg-[#883545] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#883545]/20 transition-all flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" /> Editar Cadastro Completo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const BridesView = ({ brides, payments, onEdit, onUpdateStatus, onDelete, settings, authFetch, onNewContract, onNewBride, showAlert }: { brides: Bride[], payments: Payment[], onEdit: (bride: Bride) => void, onUpdateStatus: (id: number, status: string, options?: any) => void, onDelete: (id: number) => void, settings: AppSettings, authFetch: any, onNewContract: () => void, onNewBride: () => void, showAlert: (t: string, m: string) => void, key?: string }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Ativa');
  const [yearFilter, setYearFilter] = useState('Todos');
  const [balanceFilter, setBalanceFilter] = useState('Todos');
  const [localFilter, setLocalFilter] = useState('Todos');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isDistratoModalOpen, setIsDistratoModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [brideForModal, setBrideForModal] = useState<Bride | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  const handleDownloadLatestContract = async (bride: Bride) => {
    setIsDownloading(bride.id);
    try {
      const res = await authFetch('/api/contracts');
      if (res.ok) {
        const contracts = await res.json();
        const latest = contracts.find((c: any) => c.bride_id === bride.id);
        if (latest) {
          // Busca assinaturas se o contrato estiver assinado
          let signatures: any[] = [];
          if (latest.status === 'signed' || latest.status === 'completed') {
            const sigRes = await authFetch(`/api/contracts/${latest.id}/signatures`);
            if (sigRes.ok) signatures = await sigRes.json();
          }
          
          let fullContractText = '';
          if (latest.signature_token) {
              const fullRes = await fetch(`/api/public/contract/${latest.signature_token}`);
              if (fullRes.ok) {
                  const fullData = await fullRes.json();
                  fullContractText = fullData.generated_text;
              }
          }

          if (!fullContractText) {
             showAlert('Erro', 'Texto do contrato não encontrado no servidor para download.');
             setIsDownloading(null);
             return;
          }

          generateContractPDF(bride.name, fullContractText, signatures, latest.signature_token, settings);
        } else {
          showAlert('Contrato não encontrado', 'Ainda não foi gerado um contrato para este cliente.');
        }
      }
    } catch (e) {
      console.error(e);
      showAlert('Erro', 'Ocorreu um erro ao buscar o contrato.');
    } finally {
      setIsDownloading(null);
    }
  };

  useEffect(() => {
    const handleOpenContract = (e: any) => {
      setBrideForModal(e.detail);
      setIsContractModalOpen(true);
    };
    window.addEventListener('open-contract', handleOpenContract);
    return () => window.removeEventListener('open-contract', handleOpenContract);
  }, []);

  const calculateBalance = (bride: Bride) => {
    const totalPaid = payments
      .filter(p => p.bride_id === bride.id && (p.status || '').trim().toLowerCase() === 'pago')
      .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
    return {
      totalPaid,
      balance: Math.max(0, (Number(bride.contract_value) || 0) - totalPaid)
    };
  };

  const filteredBrides = brides.filter(b => {
    if (b.id === 58) return false; // Esconde o cliente de BV da lista
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.spouse_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.event_date ? parseDate(b.event_date)?.toLocaleDateString('pt-BR').includes(searchTerm) : false) ||
                          (b.event_date || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'Todos' || b.status === statusFilter;
    const matchesYear = yearFilter === 'Todos' || (b.event_date || '').startsWith(yearFilter);
    const matchesBalance = balanceFilter === 'Todos' || (balanceFilter === 'Com Pendência' ? b.balance > 1 : b.balance <= 1);
    const matchesLocal = localFilter === 'Todos' || b.event_location === localFilter;

    return matchesSearch && matchesStatus && matchesYear && matchesBalance && matchesLocal;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const years = Array.from(new Set(
    brides.filter(b => b.id !== 58).map(b => {
      if (!b.event_date) return null;
      const d = String(b.event_date).split('T')[0];
      const y = parseInt(d.split('-')[0]) || parseInt(d.split('/')[2]);
      return y;
    }).filter(y => y !== null && !isNaN(y))
  )).sort((a, b) => Number(a) - Number(b)).map(String);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Header title="Lista de Clientes" subtitle={`Gerencie seus ${brides.filter(b => b.id !== 58).length} clientes ativos e inativos.`} />
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onNewBride}
            className="px-6 py-3 bg-white text-[#883545] border border-[#883545]/20 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Novo Cliente
          </button>
          <button
            onClick={onNewContract}
            className="px-6 py-3 bg-[#883545] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#883545]/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <FileText className="w-5 h-5" /> Novo Contrato
          </button>
        </div>
      </div>

      {/* Sugestão de Filtros */}
      {/* Filtros colapsados no mobile */}
      <div className="lg:hidden flex justify-end mb-4">
        <button
          className="px-4 py-2 bg-[#883545] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#883545]/90 transition-all"
          onClick={() => setIsFilterModalOpen(true)}
        >
          <Filter className="w-5 h-5" /> Filtrar
        </button>
      </div>
      {/* Modal de filtros para mobile */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFilterModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#883545]/10">
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Cliente</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nome, e-mail ou data (DD/MM)..."
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#883545]/20 transition-all shadow-inner"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-[#883545] transition-colors"
                        title="Limpar busca"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option>Todos</option>
                      <option>Ativa</option>
                      <option>Concluído</option>
                      <option>Inativa</option>
                      <option>Cancelado</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ano</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                    >
                      <option>Todos</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
                      value={balanceFilter}
                      onChange={(e) => setBalanceFilter(e.target.value)}
                    >
                      <option>Todos</option>
                      <option>Com Pendência</option>
                      <option>Sem Pendência</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
                      value={localFilter}
                      onChange={(e) => setLocalFilter(e.target.value)}
                    >
                      <option>Todos</option>
                      {([...(settings.locations || [])].sort((a, b) => {
                        const nameA = typeof a === 'string' ? a : a.name;
                        const nameB = typeof b === 'string' ? b : b.name;
                        return nameA.localeCompare(nameB);
                      })).map(l => {
                        const name = typeof l === 'string' ? l : l.name;
                        return <option key={name} value={name}>{name}</option>;
                      })}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('Ativa'); setYearFilter('Todos'); setBalanceFilter('Todos'); setLocalFilter('Todos'); }}
                  className="w-full p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
                  title="Limpar Filtros"
                >
                  <Filter className="w-5 h-5" /> Limpar Filtros
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="w-full mt-2 py-3 bg-[#883545] text-white rounded-xl font-bold hover:bg-[#883545]/90 transition-all"
                >
                  Aplicar Filtros
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Filtros normais no desktop */}
      <div className="hidden lg:flex bg-white p-4 rounded-2xl border border-[#883545]/10 shadow-sm flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Cliente</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Nome, e-mail ou data (DD/MM/AAAA)..."
              className="w-full pl-11 pr-11 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#883545]/20 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-[#883545] transition-colors"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="w-full md:w-40 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Todos</option>
              <option>Ativa</option>
              <option>Concluído</option>
              <option>Inativa</option>
              <option>Cancelado</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-full md:w-32 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ano</label>
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option>Todos</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-full md:w-48 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo</label>
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
            >
              <option>Todos</option>
              <option>Com Pendência</option>
              <option>Sem Pendência</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-full md:w-56 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local do Evento</label>
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
              value={localFilter}
              onChange={(e) => setLocalFilter(e.target.value)}
            >
              <option>Todos</option>
              {([...(settings.locations || [])].sort((a, b) => {
                const nameA = typeof a === 'string' ? a : a.name;
                const nameB = typeof b === 'string' ? b : b.name;
                return nameA.localeCompare(nameB);
              })).map(l => {
                const name = typeof l === 'string' ? l : l.name;
                return <option key={name} value={name}>{name}</option>;
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={() => { setSearchTerm(''); setStatusFilter('Ativa'); setYearFilter('Todos'); setBalanceFilter('Todos'); setLocalFilter('Todos'); }}
          className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
          title="Limpar todos os filtros"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div className="lg:hidden space-y-4">
        {filteredBrides.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#883545]/10 shadow-sm text-center text-slate-400 italic font-medium">
            Nenhum cliente encontrado com os filtros aplicados.
          </div>
        ) : (
          filteredBrides.map((bride) => {
            const { totalPaid, balance } = calculateBalance(bride);
            return (
              <div 
                key={bride.id} 
                onClick={() => { setBrideForModal(bride); setIsSummaryModalOpen(true); }}
                className={`${settings.ui.compactMode ? 'p-3' : 'p-5'} bg-white rounded-2xl border border-[#883545]/10 shadow-sm space-y-4 relative group cursor-pointer hover:shadow-md hover:border-[#883545]/30 transition-all`}
              >
                <div className={`absolute top-0 right-0 w-1.5 h-full rounded-r-2xl ${bride.status === 'Ativa' ? 'bg-emerald-500' : bride.status === 'Concluído' ? 'bg-blue-400' : bride.status === 'Inativa' ? 'bg-slate-300' : 'bg-rose-500'}`} />

                <div className="flex justify-between items-start pr-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-[#883545] transition-colors">
                      {bride.name}
                    </h3>
                    {bride.spouse_name && (
                      <p className="text-[11px] font-bold text-slate-400 -mt-0.5 italic">
                        {bride.spouse_name}
                      </p>
                    )}
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">{bride.email}</p>
                  </div>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === bride.id ? null : bride.id)}
                      className="p-2 -mr-2 text-slate-300 hover:text-[#883545] transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenuId === bride.id && (
                      <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-[0_10px_40px_-5px_rgba(136,53,69,0.3)] border border-[#883545]/10 z-[100] p-2 space-y-1 animate-in fade-in zoom-in duration-200">
                        <p className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Ações</p>
                        <button onClick={() => { onEdit(bride); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-[#883545]/5 hover:text-[#883545] rounded-lg transition-colors">
                          <Edit className="w-3.5 h-3.5" /> Editar Cliente
                        </button>
                        <div className="h-px bg-slate-50 my-1" />
                        <button onClick={() => onUpdateStatus(bride.id, 'Ativa')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                          <CheckCircle className="w-3.5 h-3.5" /> Tornar Ativa
                        </button>
                        <button onClick={() => onUpdateStatus(bride.id, 'Concluído')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                          <CheckCircle className="w-3.5 h-3.5" /> Concluir Evento
                        </button>
                        <button onClick={() => onUpdateStatus(bride.id, 'Inativa')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <UserMinus className="w-3.5 h-3.5" /> Inativar
                        </button>
                        <button onClick={() => { setBrideForModal(bride); setIsContractModalOpen(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-[#883545]/5 hover:text-[#883545] rounded-lg transition-colors">
                          <FileText className="w-3.5 h-3.5" /> Gerar Contrato
                        </button>
                        <button onClick={() => { setBrideForModal(bride); setIsDistratoModalOpen(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </button>
                        <button 
                          onClick={() => { handleDownloadLatestContract(bride); setOpenMenuId(null); }} 
                          disabled={isDownloading === bride.id}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#883545] hover:bg-[#883545]/5 rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> {isDownloading === bride.id ? 'Buscando...' : 'Baixar Contrato (PDF)'}
                        </button>
                        <div className="h-px bg-slate-50 my-1" />
                        <button onClick={() => { onDelete(bride.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Excluir Cliente
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data do Evento</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-[#883545]/40" />
                      {bride.event_date && formatDisplayDate(bride.event_date)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo de Serviço</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{bride.service_type || 'Não definido'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contrato</p>
                    <p className="text-xs font-bold text-slate-700">R$ {(bride.contract_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  {bride.status === 'Cancelado' && bride.original_value > 0 && (
                    <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">Dedução Comercial (Distrato)</p>
                      <p className="text-xs font-bold text-slate-500 line-through">Original: R$ {bride.original_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-sm font-black text-rose-600">Multa Acordada: R$ {bride.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Pago</p>
                    <p className="text-xs font-bold text-emerald-600">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#883545] uppercase tracking-widest">Saldo Devedor {bride.status === 'Cancelado' ? '(Multa)' : ''}</p>
                    <p className="text-sm font-black text-[#883545]">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="space-y-1 col-span-2 pt-2 border-t border-slate-50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Local do Evento</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {bride.event_location || 'Não informado'}
                    </div>
                  </div>
                  <div className="space-y-1 flex flex-col justify-end">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest self-start ${bride.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600' :
                      bride.status === 'Concluído' ? 'bg-blue-50 text-blue-600' :
                        bride.status === 'Inativa' ? 'bg-slate-50 text-slate-500' :
                          'bg-rose-50 text-rose-600'
                      }`}>
                      {bride.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden lg:block bg-white rounded-2xl border border-[#883545]/10 shadow-sm min-h-[400px]">
        <div>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] lg:text-xs uppercase tracking-wider font-bold border-b border-[#883545]/5">
                <th className="px-4 lg:px-6 py-4 lg:py-5">Cliente / Casal</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Data Evento</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Local</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Serviço</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5 whitespace-nowrap min-w-[140px]">Valor Contrato</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5 whitespace-nowrap min-w-[120px]">Pago</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5 whitespace-nowrap min-w-[120px]">A Pagar</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Status</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#883545]/5 font-medium">
              {filteredBrides.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic font-bold">Nenhum cliente encontrado com estes filtros.</td>
                </tr>
              ) : (
                filteredBrides.map((bride) => {
                  const { totalPaid, balance } = calculateBalance(bride);
                  return (
                    <tr 
                      key={bride.id} 
                      onClick={() => { setBrideForModal(bride); setIsSummaryModalOpen(true); }}
                      className={`${settings.ui.compactMode ? 'hover:bg-[#883545]/5' : 'hover:bg-[#883545]/5'} transition-colors group cursor-pointer`}
                    >
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'}`}>
                        <div className="flex flex-col">
                          <span className={`${settings.ui.compactMode ? 'text-xs' : 'text-sm'} font-extrabold text-slate-900 group-hover:text-[#883545] transition-colors`}>
                            {bride.name}
                          </span>
                          {bride.spouse_name && (
                            <span className="text-[11px] font-medium text-slate-400 -mt-0.5 italic">
                              {bride.spouse_name}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-300 mt-0.5">{bride.email}</span>
                        </div>
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'}`}>
                        <div className="flex items-center gap-2 text-slate-700 text-xs">
                          <Calendar className={`${settings.ui.compactMode ? 'w-3 h-3' : 'w-4 h-4'} text-slate-400`} />
                          {bride.event_date && formatDisplayDate(bride.event_date)}
                        </div>
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'} text-xs font-bold text-slate-500`}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-300" />
                          {bride.event_location || '-'}
                        </div>
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'} text-xs font-bold text-slate-600`}>
                        {bride.service_type || 'Não definido'}
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'} text-xs font-black text-slate-700 whitespace-nowrap`}>
                        {bride.status === 'Cancelado' && bride.original_value > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-rose-600">Multa: R$ {bride.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-slate-400 line-through font-medium">Orig: R$ {bride.original_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ) : (
                          <>R$ {(bride.contract_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                        )}
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'} text-xs font-bold text-emerald-600 whitespace-nowrap`}>
                        R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'} text-xs font-black text-[#883545] whitespace-nowrap`}>
                        R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'}`}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] lg:text-xs font-bold ${bride.status === 'Ativa' ? 'bg-emerald-100 text-emerald-700' :
                          bride.status === 'Concluído' ? 'bg-blue-100 text-blue-700' :
                            bride.status === 'Inativa' ? 'bg-slate-100 text-slate-700' :
                              'bg-rose-100 text-rose-700'
                          }`}>
                          {bride.status}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === bride.id ? null : bride.id)}
                          className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[#883545] transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenuId === bride.id && (
                          <div className="absolute right-4 top-12 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(136,53,69,0.4)] border border-[#883545]/10 z-[100] p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Ações</p>
                            <button onClick={() => { onEdit(bride); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-[#883545]/5 hover:text-[#883545] rounded-lg transition-colors">
                              <Edit className="w-3.5 h-3.5" /> Editar Cliente
                            </button>
                            <div className="h-px bg-slate-50 my-1" />
                            <button onClick={() => { onUpdateStatus(bride.id, 'Ativa'); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" /> Tornar Ativa
                            </button>
                            <button onClick={() => { onUpdateStatus(bride.id, 'Concluído'); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" /> Concluir Evento
                            </button>
                            <button onClick={() => { onUpdateStatus(bride.id, 'Inativa'); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                              <UserMinus className="w-3.5 h-3.5" /> Inativar
                            </button>
                            <button onClick={() => { setBrideForModal(bride); setIsContractModalOpen(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-[#883545]/5 hover:text-[#883545] rounded-lg transition-colors">
                              <FileText className="w-3.5 h-3.5" /> Gerar Contrato
                            </button>
                            <button onClick={() => { setBrideForModal(bride); setIsDistratoModalOpen(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                              <XCircle className="w-3.5 h-3.5" /> Cancelar
                            </button>
                            <button 
                              onClick={() => { handleDownloadLatestContract(bride); setOpenMenuId(null); }} 
                              disabled={isDownloading === bride.id}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#883545] hover:bg-[#883545]/5 rounded-lg transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> {isDownloading === bride.id ? 'Baixando...' : 'Baixar Contrato (PDF)'}
                            </button>
                            <div className="h-px bg-slate-50 my-1" />
                            <button onClick={() => { onDelete(bride.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Cliente
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overlay to close menus */}
      {openMenuId && <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />}
      <DistratoModal
        isOpen={isDistratoModalOpen}
        onClose={() => setIsDistratoModalOpen(false)}
        bride={brideForModal}
        payments={payments}
        goals={settings.goals}
        onConfirm={(fine) => {
          if (brideForModal) {
            onUpdateStatus(brideForModal.id, 'Cancelado', {
              fine_amount: fine,
              original_value: brideForModal.contract_value
            });
            setIsDistratoModalOpen(false);
          }
        }}
      />
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        bride={brideForModal}
        authFetch={authFetch}
        showAlert={showAlert}
      />
      <ClientSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        bride={brideForModal}
        payments={payments}
        onEdit={onEdit}
      />
    </motion.div >
  );
};

// --- Finance View ---

export { BridesView };
