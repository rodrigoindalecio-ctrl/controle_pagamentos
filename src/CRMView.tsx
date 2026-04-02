import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  MoreVertical, 
  UserMinus, 
  RefreshCcw,
  AlertCircle,
  Mail,
  Calendar,
  Filter,
  Check,
  Archive,
  ArrowRight,
  Settings,
  X,
  Smartphone,
  QrCode,
  SmartphoneNfc,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  event_date?: string;
  status: 'captured' | 'msg1_sent' | 'msg2_sent' | 'msg3_sent' | 'responded' | 'archived' | 'invalid';
  msg_count: number;
  last_msg_at?: string;
  is_test: boolean;
  created_at: string;
}

interface Column {
  id: string;
  title: string;
  icon: any;
  color: string;
}

const CRMView = ({ authFetch }: any) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isSandbox, setIsSandbox] = useState(false); // Começa em MODO REAL por padrão
  const [searchTerm, setSearchTerm] = useState('');
  const [retroDays, setRetroDays] = useState(10);

  // Estados do Modal de Configuração / Robô WPP
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'device' | 'templates'>('device');
  const [wppStatus, setWppStatus] = useState('OFFLINE');
  const [wppQr, setWppQr] = useState<string | null>(null);
  
  const [templates, setTemplates] = useState({
    msg1: 'Olá [NOME], vi que solicitou um orçamento no Casamentos.com.br para a data [DATA]. Meu nome é Vanessa e estou à sua disposição!',
    msg2: 'Oie [NOME]! Conseguiu visualizar o e-mail com a nossa proposta musical?',
    msg3: '[NOME], tudo bem? Nossa proposta do casamento para [DATA] ainda faz sentido ou posso arquivar seu contato?'
  });

  // Carrega templates DB
  useEffect(() => {
    const fetchTemplates = async () => {
       try {
         const res = await authFetch('/api/whatsapp/templates');
         const data = await res.json();
         if (data.msg1) setTemplates(data);
       } catch (e) {}
    };
    fetchTemplates();
  }, [authFetch]);

  // Salva no banco sempre que edita
  const saveTemplates = async (newTemp: any) => {
    setTemplates(newTemp);
    try {
       await authFetch('/api/whatsapp/templates', {
         method: 'POST',
         body: JSON.stringify(newTemp)
       });
    } catch(e) {}
  };

  // Polling de Status do WhatsApp global
  useEffect(() => {
    let interval: any;
    const checkStatus = async () => {
      try {
        const res = await authFetch('/api/whatsapp/status');
        const data = await res.json();
        setWppStatus(data.status);
        setWppQr(data.qrUrl);
      } catch (e) {}
    };
    
    checkStatus();
    // Bate rápído se o usuario ta na engrenagem, mais devagar se estiver focado no funil
    interval = setInterval(checkStatus, settingsOpen ? 3000 : 15000); 
    
    return () => clearInterval(interval);
  }, [settingsOpen]);

  const initWhatsApp = async () => {
    try {
      setWppStatus('INITIALIZING');
      await authFetch('/api/whatsapp/init', { method: 'POST' });
    } catch(e) {
      alert("Erro ao ligar motor WPP.");
    }
  };

  const columns: Column[] = [
    { id: 'captured', title: 'Capturados', icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'msg1_sent', title: 'Mensagem 1', icon: Send, color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
    { id: 'msg2_sent', title: 'Mensagem 2', icon: Send, color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { id: 'msg3_sent', title: 'Mensagem 3', icon: Send, color: 'bg-red-50 text-red-600 border-red-100' },
    { id: 'responded', title: 'Respondidos', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'archived', title: 'Arquivados', icon: Archive, color: 'bg-slate-50 text-slate-400 border-slate-100' },
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      console.log('[CRM] Buscando leads em /api/leads...');
      const res = await authFetch('/api/leads');
      console.log('[CRM] Resposta da API - status:', res.status, 'ok:', res.ok);
      
      if (res.ok) {
        const data = await res.json();
        console.log('[CRM] Leads recebidos:', data?.length, '| Primeiros 3:', data?.slice(0,3));
        setLeads(data || []);
      } else {
        const errText = await res.text();
        console.error('[CRM] API retornou erro:', res.status, errText);
        alert(`Erro ao buscar leads: ${res.status} - ${errText.substring(0, 100)}`);
      }
    } catch (err) {
      console.error('[CRM] Erro de rede ao buscar leads:', err);
      alert(`Erro de rede: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const syncLeads = async () => {
    setSyncing(true);
    try {
      const res = await authFetch('/api/leads/sync', {
        method: 'POST',
        body: JSON.stringify({ retroDays })
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      alert(`Sincronização concluída! ${data.count || 0} leads processados.`);
      fetchLeads();
    } catch (err: any) {
      console.error('Sync Error:', err);
      alert(`Falha técnica: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDrop = async (leadId: string, newStatus: string) => {
    // Busca o lead original para evitar updates desnecessários
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Atualização Otimista na UI (parecer ultra rápido)
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));

    try {
      const res = await authFetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Falha ao atualizar no banco');
    } catch (err: any) {
      console.error('Erro ao mover card:', err);
      // Se falhar o banco, volta ao status anterior no Frontend
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: lead.status as any } : l));
      alert(`Não foi possível salvar o status: ${err.message}`);
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(l => {
      const statusMatch = l.status === status;
      const searchMatch = 
        (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.whatsapp || '').includes(searchTerm) ||
        (l.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && searchMatch;
    });
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return 'Data não definida';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {wppStatus !== 'READY' && wppStatus !== 'INITIALIZING' && wppStatus !== 'STARTING' && (
         <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
               <AlertCircle className="w-5 h-5 flex-shrink-0" />
               <p className="font-bold text-sm tracking-tight text-red-800">⚠️ Robô do WhatsApp Offline! O envio automático das mensagens e o relógio de follow-ups estão pausados.</p>
            </div>
            <button onClick={() => { setSettingsTab('device'); setSettingsOpen(true); }} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-black shadow hover:bg-red-700 transition uppercase tracking-widest">
               Escaneie o QR Code
            </button>
         </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-[#883545]/5">
        <div>
          <h2 className="text-2xl font-bold text-[#883545] flex items-center gap-2">
            <Users className="w-6 h-6" /> CRM de Marketing & Leads
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 opacity-70">
            Gerencie o funil de prospecção e automação de e-mails
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 p-1.5 rounded-xl flex items-center gap-2 border border-[#883545]/5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Histórico:</span>
            <select 
              value={retroDays}
              onChange={(e) => setRetroDays(Number(e.target.value))}
              className="bg-white border-none rounded-lg text-xs font-black text-[#883545] focus:ring-0 cursor-pointer shadow-sm px-2 py-1"
            >
              <option value={10}>10 Dias</option>
              <option value={30}>30 Dias</option>
              <option value={60}>60 Dias</option>
              <option value={90}>90 Dias</option>
              <option value={365}>1 Ano</option>
            </select>
          </div>
          <div className="bg-slate-50 p-1 rounded-xl flex items-center">
            <button 
              onClick={() => setIsSandbox(true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${isSandbox ? 'bg-[#883545] text-white shadow-md' : 'text-slate-400'}`}
            >
              MODO TESTE
            </button>
            <button 
              onClick={() => setIsSandbox(false)}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${!isSandbox ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}
            >
              MODO REAL
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#883545] transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar noiva ou celular..."
              className="pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#883545]/20 outline-none w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={syncLeads}
            disabled={syncing}
            className="flex items-center gap-2 bg-[#883545] text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-[#883545]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {syncing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Sincronizar E-mails
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 bg-slate-100 text-slate-500 hover:text-[#883545] px-4 py-2.5 rounded-xl text-sm font-black transition-all hover:bg-[#883545]/10"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
         <div className="flex flex-col items-center justify-center h-64 gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-[#883545]/10 border-t-[#883545] rounded-full" />
            <p className="text-slate-400 font-medium italic animate-pulse">Consultando banco de leads...</p>
         </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {columns.map(column => {
            const columnLeads = getLeadsByStatus(column.id);
            return (
              <div 
                key={column.id} 
                className="min-w-[300px] flex-shrink-0 flex flex-col gap-3"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const leadId = e.dataTransfer.getData('leadId');
                  if (leadId) handleDrop(leadId, column.id);
                }}
              >
                <div className={`p-4 rounded-2xl border-b-4 flex items-center justify-between ${column.color}`}>
                  <div className="flex items-center gap-2">
                    <column.icon className="w-4 h-4" />
                    <span className="text-sm font-black uppercase tracking-widest">{column.title}</span>
                  </div>
                  <span className="bg-white/50 px-2 py-0.5 rounded-lg text-xs font-bold">{columnLeads.length}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {columnLeads.length === 0 ? (
                    <div className="h-24 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center">
                      <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Coluna Vazia</p>
                    </div>
                  ) : (
                    columnLeads.map(lead => (
                      <LeadCard key={lead.id} lead={lead} templates={templates} isSandbox={isSandbox} handleDrop={handleDrop} authFetch={authFetch} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CONFIGURAÇÕES / ADMIN WPP */}
      <AnimatePresence>
        {settingsOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
             >
                {/* Menu lateral do modal */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-black text-slate-800 tracking-tight">Regras de Automação</h3>
                     <button onClick={() => setSettingsOpen(false)} className="md:hidden p-2 bg-white rounded-full shadow-sm text-slate-400">
                        <X className="w-5 h-5" />
                     </button>
                  </div>
                  
                  <button onClick={() => setSettingsTab('device')} className={`flex items-center gap-3 w-full p-4 rounded-2xl text-left font-bold transition-all ${settingsTab === 'device' ? 'bg-white shadow-sm border border-[#883545]/10 text-[#883545]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                     <SmartphoneNfc className="w-5 h-5 flex-shrink-0" /> Parear Aparelho
                  </button>
                  <button onClick={() => setSettingsTab('templates')} className={`flex items-center gap-3 w-full p-4 rounded-2xl text-left font-bold transition-all ${settingsTab === 'templates' ? 'bg-white shadow-sm border border-[#883545]/10 text-[#883545]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                     <Bot className="w-5 h-5 flex-shrink-0" /> Edit. Templates
                  </button>
                  <div className="mt-auto pt-6 opacity-30 text-center">
                    <QrCode className="w-16 h-16 mx-auto mb-2 text-slate-400" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Node JS Engine</p>
                  </div>
                </div>

                {/* Conteúdo Dinâmico */}
                <div className="flex-1 p-8 flex flex-col relative w-full h-[600px] overflow-y-auto">
                   <button onClick={() => setSettingsOpen(false)} className="absolute top-6 right-6 hidden md:block p-2 text-slate-400 hover:text-[#883545] hover:bg-red-50 rounded-full transition-all">
                      <X className="w-6 h-6" />
                   </button>

                   {settingsTab === 'device' && (
                     <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md mx-auto text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-2">
                           <Smartphone className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">Seu Cérebro de WhatsApp</h2>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Aqui é onde geramos seu servidor privado e invisível. Nenhuma janela irá aparecer, e os disparos do CRM acontecerão instantaneamente por debaixo dos panos.
                        </p>
                        
                        <div className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px]">
                           {wppStatus === 'OFFLINE' || wppStatus === 'DISCONNECTED' ? (
                             <div className="flex flex-col items-center gap-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Motor Desligado</p>
                                <button onClick={initWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 hover:scale-105 transition-all text-white px-8 py-3 rounded-xl font-black uppercase shadow-lg shadow-emerald-500/20">
                                  Ligar Servidor do Robô
                                </button>
                             </div>
                           ) : wppStatus === 'INITIALIZING' ? (
                             <div className="flex flex-col items-center gap-4">
                                <RefreshCcw className="w-8 h-8 text-emerald-500 animate-spin" />
                                <p className="text-sm font-bold text-slate-500 animate-pulse">Carregando Chrome virtualizado...</p>
                             </div>
                           ) : wppStatus === 'QR_READY' && wppQr ? (
                             <div className="flex flex-col items-center gap-4 fade-in">
                                <h3 className="font-bold text-emerald-600">Escaneie o QR Code abaixo!</h3>
                                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                                  <img src={wppQr} alt="QR Code" className="w-64 h-64 object-contain" />
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Abra o App do WhatsApp no celular {'>'} Aparelhos Conectados</p>
                             </div>
                           ) : wppStatus === 'AUTHENTICATED' ? (
                             <div className="flex flex-col items-center gap-4">
                                <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" />
                                <p className="text-sm font-bold text-slate-500 animate-pulse">Autenticado! Carregando suas conversas e contatos. Aguarde...</p>
                             </div>
                           ) : wppStatus === 'READY' ? (
                             <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                  <Check className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-emerald-600">Tudo Pronto e Pareado!</h3>
                                <p className="text-xs text-slate-500 font-medium text-center">Seu número já está vinculado. Agora o botão "Aviãozinho" do CRM vai disparar silenciosamente por lá!</p>
                             </div>
                           ) : (
                             <p className="text-sm font-bold text-slate-500">Status desconhecido: {wppStatus}</p>
                           )}
                        </div>
                     </div>
                   )}

                   {settingsTab === 'templates' && (
                     <div className="flex flex-col h-full w-full max-w-2xl mx-auto">
                        <div className="mb-8">
                          <h2 className="text-2xl font-black text-slate-800 mb-2">Editor de Templates</h2>
                          <p className="text-sm text-slate-500">
                            Crie os textos padrões. Você pode usar as <strong className="text-[#883545]">tags automáticas</strong>: 
                            <code className="mx-1 px-2 py-0.5 bg-[#883545]/10 text-[#883545] rounded-md text-xs">[NOME]</code> e 
                            <code className="mx-1 px-2 py-0.5 bg-[#883545]/10 text-[#883545] rounded-md text-xs">[DATA]</code>.
                          </p>
                        </div>
                        
                        <div className="space-y-6 flex-1 pr-2 custom-scrollbar overflow-y-auto">
                          <div className="space-y-2">
                             <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Texto da Mensagem 1 (Captura inicial)</label>
                             <textarea 
                               value={templates.msg1}
                               onChange={e => saveTemplates({...templates, msg1: e.target.value})}
                               className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm text-slate-700 min-h-[120px] focus:ring-2 focus:ring-[#883545]/20 focus:bg-white transition-all shadow-inner"
                             />
                          </div>
                          
                          <div className="space-y-2">
                             <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Texto da Mensagem 2 (Follow-up de dias)</label>
                             <textarea 
                               value={templates.msg2}
                               onChange={e => saveTemplates({...templates, msg2: e.target.value})}
                               className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm text-slate-700 min-h-[120px] focus:ring-2 focus:ring-[#883545]/20 focus:bg-white transition-all shadow-inner"
                             />
                          </div>

                          <div className="space-y-2">
                             <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Texto da Mensagem 3 (Última tentativa)</label>
                             <textarea 
                               value={templates.msg3}
                               onChange={e => saveTemplates({...templates, msg3: e.target.value})}
                               className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm text-slate-700 min-h-[120px] focus:ring-2 focus:ring-[#883545]/20 focus:bg-white transition-all shadow-inner"
                             />
                          </div>
                        </div>
                     </div>
                   )}
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LeadCard = ({ lead, templates, isSandbox, handleDrop, authFetch }: any) => {
  const [sending, setSending] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // BOTÃO AZUL INVISÍVEL (Disparo de E-mail Elegante Alternativo)
  const handleSendEmail = async () => {
     try {
       if (!lead.email) { alert("Esta noiva não possui e-mail cadastrado!"); return; }
       setSendingEmail(true);

       // Seleciona a Msg que o Wpp tentaria mandar
       let textToUse = templates.msg1;
       if (lead.status === 'msg1_sent') textToUse = templates.msg2;
       else if (lead.status === 'msg2_sent') textToUse = templates.msg3;

       const shortDate = lead.event_date ? new Date(lead.event_date + 'T12:00:00').toLocaleDateString('pt-BR') : '(Data a Confirmar)';
       const firstName = lead.name.split(' ')[0];
       let finalMessage = textToUse.replace(/\[NOME\]/gi, firstName).replace(/\[DATA\]/gi, shortDate);

       // Proteção contra erro em Produção 
       // Em teste, o e-mail vai para o seu contato de teste ou do dev (usarei seu e-mail como placeholder ou um alert).
       const targetEmail = isSandbox ? "rodrigoindalecio@hotmail.com" : lead.email;
       if (isSandbox) {
           if(!confirm(`⚠️ MODO TESTE ATIVADO ⚠️\nO E-mail elegante ia para ${lead.email}, mas atiraremos no seu 'rodrigoindalecio@hotmail.com' para você provar o visual. Quer fazer o disparo?`)) {
               setSendingEmail(false); return;
           }
       }

       const res = await authFetch('/api/email/send', {
         method: 'POST',
         body: JSON.stringify({ toEmail: targetEmail, noivaName: firstName, wppMessage: finalMessage })
       });
       
       if(res.ok) {
          alert('E-mail elegantíssimo enviado com sucesso para a noiva!');
       } else {
          alert('Nós batemos na porta da Locaweb/Hostinger e eles recusaram o disparo.');
       }
     } catch(e:any) {
       alert('Erro: ' + e.message);
     } finally {
       setSendingEmail(false);
     }
  };

  // BOTÃO AVIÃOZINHO DE PAPEL (WhatsApp Headless Sem Ver)
  const handleSendWhatsApp = async () => {
    try {
      setSending(true);

      // 1. Determina o Template baseado no estágio atual da trilha
      let textToUse = templates.msg1;
      let nextPhase = 'msg1_sent';

      if (lead.status === 'msg1_sent') {
        textToUse = templates.msg2;
        nextPhase = 'msg2_sent';
      } else if (lead.status === 'msg2_sent') {
        textToUse = templates.msg3;
        nextPhase = 'msg3_sent';
      } else if (lead.status === 'msg3_sent' || lead.status === 'responded') {
         alert("Este lead já chegou ao fim da régua de automação!");
         setSending(false);
         return;
      }

      // 2. Substituir as Tags Mágicas
      const shortDate = lead.event_date ? new Date(lead.event_date + 'T12:00:00').toLocaleDateString('pt-BR') : '(Data a Confirmar)';
      const firstName = lead.name.split(' ')[0];
      
      let finalMessage = textToUse.replace(/\[NOME\]/gi, firstName).replace(/\[DATA\]/gi, shortDate);

      // 3. Verifica destino (MODO SANDBOX vs MODO REAL)
      // Seu número de teste de segurança: 5511981667932
      const targetPhone = isSandbox ? "5511981667932" : lead.whatsapp;

      if (isSandbox) {
         if(!confirm(`⚠️ MODO TESTE ATIVADO ⚠️\nA mensagem de [${firstName}] será enviada PARA O SEU NÚMERO (11) 98166-7932 para garantir a segurança da noiva. Deseja disparar o teste?`)) {
            setSending(false); return;
         }
      }

      if (!targetPhone) {
         alert("Lead sem WhatsApp cadastrado.");
         setSending(false); return;
      }

      console.log(`[WPP] Disparando para: ${targetPhone}`, finalMessage);

      // 4. Bate na API Invisível
      const res = await authFetch('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          toPhone: targetPhone,
          messageText: finalMessage,
          leadId: lead.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao disparar');

      // 5. Mover Kanban via Props de forma invisivel e automática
      await handleDrop(lead.id, nextPhase);
      
    } catch (e: any) {
      alert(`[ERRO DO ROBÔ]: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div 
      layoutId={lead.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      draggable
      onDragStart={(e: any) => {
        // Envia o ID pro Drag Drop do navegador
        e.dataTransfer.setData('leadId', lead.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="bg-white p-4 rounded-2xl shadow-sm border border-[#883545]/5 hover:shadow-md transition-all group relative overflow-hidden cursor-grab active:cursor-grabbing"
    >
      {lead.is_test && (
        <div className="absolute top-0 right-0 p-1 bg-[#883545] text-white rounded-bl-lg">
          <Check className="w-2.5 h-2.5" />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h4 className="font-black text-slate-800 text-sm">{lead.name}</h4>
          <button className="text-slate-300 hover:text-slate-600 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-[#883545]/30" />
            <span className="text-[11px] font-bold">{lead.event_date ? new Date(lead.event_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data Indefinida'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <MessageSquare className="w-3.5 h-3.5 text-[#883545]/30" />
            <span className="text-[11px] font-bold">{lead.whatsapp || 'Sem WhatsApp'}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2 text-[#883545]/60">
              <Mail className="w-3.5 h-3.5 text-[#883545]/30" />
              <span className="text-[11px] font-bold truncate max-w-[180px]">{lead.email}</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${lead.status === 'responded' ? 'bg-emerald-500' : 'bg-[#883545] animate-pulse'}`} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
              {lead.status === 'captured' ? 'Aguardando Início' : 
               lead.status === 'msg1_sent' ? 'No Fluxo: Passo 1' : 
               lead.status === 'msg2_sent' ? 'No Fluxo: Passo 2' :
               lead.status === 'msg3_sent' ? 'No Fluxo: Passo 3' :
               lead.status === 'responded' ? 'RESPONDIDO' : 'ARQUIVADO'}
            </span>
          </div>
          
            <div className="flex items-center gap-1.5">
              {lead.email && (
                <button 
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className={`bg-blue-50 p-2 rounded-xl transition-all group ${sendingEmail ? 'opacity-50 cursor-wait' : 'hover:bg-blue-600 hover:text-white text-blue-600'}`}
                  title="E-mail Inteligente (Quando WPP Falha)"
                >
                  {sendingEmail ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                </button>
              )}
              <button 
                onClick={() => window.open(`https://wa.me/${lead.whatsapp}`, '_blank')}
                className="bg-emerald-50 p-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-emerald-600"
                title="WhatsApp Manual Direto"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              
              <button 
                onClick={handleSendWhatsApp}
                disabled={sending}
                className="bg-slate-50 p-2 rounded-xl hover:bg-[#883545] hover:text-white transition-all text-slate-400 group"
                title={isSandbox ? "DISPARAR MENSAGEM (TESTE)" : "DISPARAR MENSAGEM (REAL)"}
              >
                {sending ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CRMView;
