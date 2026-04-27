import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "../../App";
import { formatDisplayDate } from "../../App";
import { Payment, Expense, Bride, DashboardStats, AppSettings } from "../../types";
import { Copy, Plus, Filter, Search, CheckCircle, ChevronDown, Clock, Download, ChevronRight, FileText, AlertCircle, X, ExternalLink, RefreshCw, Calendar, MoreVertical, Edit, Trash2, XCircle } from "lucide-react";
import { parseDate } from "../../App";

const FinanceView = ({ 
  payments, 
  expenses, 
  brides, 
  stats, 
  settings, 
  onAddPayment, 
  onAddExpense, 
  onUpdatePayment,
  onDeletePayment,
  onUpdateExpense,
  onDeleteExpense,
  onGoToSettings 
}: { 
  payments: Payment[], 
  expenses: Expense[], 
  brides: Bride[], 
  stats: DashboardStats | null, 
  settings: AppSettings, 
  onAddPayment: (p: any) => Promise<boolean>, 
  onAddExpense: (e: any) => Promise<boolean>, 
  onUpdatePayment: (id: number, p: any) => Promise<boolean>,
  onDeletePayment: (id: number) => Promise<void>,
  onUpdateExpense: (id: number, e: any) => Promise<boolean>,
  onDeleteExpense: (id: number) => Promise<void>,
  onGoToSettings: () => void, 
  key?: string 
}) => {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [openMenuId, setFinanceMenuId] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  // Filtros para lançamentos recentes
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [dateFilter, setDateFilter] = useState('Todos');
  const [partnerFilter, setPartnerFilter] = useState('Todos');
  const [brideFilter, setBrideFilter] = useState('Todos');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  // Filtragem dos lançamentos recentes
  const allItems = [
    ...payments.map(p => ({ ...p, isExpense: false })),
    ...expenses.map(e => ({ ...e, bride_name: `Despesa: ${e.category}`, isExpense: true, amount_paid: e.amount, payment_date: e.date, bride_id: null }))
  ];
  const filteredItems = allItems
    .filter(item => {
      // Filtro de busca
      const searchMatch = item.bride_name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      // Filtro de tipo
      const typeMatch = typeFilter === 'Todos' || (typeFilter === 'Receita' && !item.isExpense) || (typeFilter === 'Despesa' && item.isExpense);
      // Filtro de parceiro (apenas para BV ou despesas que tenham parceiro na descrição)
      const partnerMatch = partnerFilter === 'Todos' ||
        item.description?.toLowerCase().includes(partnerFilter.toLowerCase()) ||
        (item as any).partner_name === partnerFilter;
      // Filtro de cliente
      const brideMatch = brideFilter === 'Todos' || String(item.bride_id) === brideFilter;
      // Filtro de data
      let dateMatch = true;
      const itemDate = parseDate(item.payment_date) || new Date();
      if (dateFilter === 'Hoje') {
        const today = new Date();
        dateMatch = itemDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'Últimos 7 dias') {
        const today = new Date();
        const diff = (today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        dateMatch = diff >= 0 && diff <= 7;
      } else if (dateFilter === 'Últimos 30 dias') {
        const today = new Date();
        const diff = (today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        dateMatch = diff >= 0 && diff <= 30;
      } else if (dateFilter === 'Personalizado') {
        if (customStart && customEnd) {
          const start = parseDate(customStart) || new Date(0);
          const end = parseDate(customEnd) || new Date();
          if (end) end.setHours(23, 59, 59, 999); // Inlcui o dia final inteiro
          dateMatch = itemDate >= start && itemDate <= end;
        } else {
          dateMatch = true;
        }
      }
      return searchMatch && typeMatch && dateMatch && partnerMatch && brideMatch;
    })
    .sort((a, b) => (parseDate(b.payment_date)?.getTime() || 0) - (parseDate(a.payment_date)?.getTime() || 0));
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  const totalRecebidoAno = payments
    .filter(p => {
      const isPaid = (p.status || '').trim().toLowerCase() === 'pago';
      const year = p.payment_date ? parseDate(p.payment_date)?.getFullYear() : null;
      return isPaid && year === currentYear;
    })
    .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

  const totalDespesasAno = expenses
    .filter(e => {
      const year = e.date ? parseDate(e.date)?.getFullYear() : null;
      return year === currentYear;
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalPendenteAno = brides
    .filter(b => {
      const isActiveOrCancelled = (b.status === 'Ativa' || b.status === 'Cancelado') && b.id !== 58;
      const year = b.event_date ? parseDate(b.event_date)?.getFullYear() : null;
      return isActiveOrCancelled && year === currentYear;
    })
    .reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 pb-20 lg:pb-0"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <Header title="Gestão Financeira" subtitle="Controle total de entradas e despesas da sua assessoria de casamentos." />
        <div className="flex items-center gap-3">
          <button
            className="flex-1 lg:flex-none px-6 py-3.5 bg-white text-[#883545] border border-[#883545]/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            onClick={() => setIsFinanceModalOpen(true)}
          >
            <Plus className="w-5 h-5" /> Novo Lançamento
          </button>
          <button
            className="px-6 py-3.5 bg-[#883545] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#883545]/20 hover:bg-[#883545]/90 transition-all active:scale-95"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <Filter className="w-5 h-5" /> Filtrar
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(isFinanceModalOpen || !!editingItem) && (
          <FinanceModal
            isOpen={isFinanceModalOpen || !!editingItem}
            onClose={() => { setIsFinanceModalOpen(false); setEditingItem(null); }}
            brides={brides}
            partners={settings.partners}
            onAddPayment={onAddPayment}
            onAddExpense={onAddExpense}
            onUpdatePayment={onUpdatePayment}
            onDeletePayment={onDeletePayment}
            onUpdateExpense={onUpdateExpense}
            onDeleteExpense={onDeleteExpense}
            itemToEdit={editingItem}
            onGoToSettings={onGoToSettings}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFilterModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#883545]/10">
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Lançamento</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Descrição ou origem..."
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option>Todos</option>
                      <option>Receita</option>
                      <option>Despesa</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <option>Todos</option>
                      <option>Hoje</option>
                      <option>Últimos 7 dias</option>
                      <option>Últimos 30 dias</option>
                      <option>Personalizado</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-7 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {dateFilter === 'Personalizado' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2 mt-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">De</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner transition-all cursor-pointer"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Até</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner transition-all cursor-pointer"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parceiro</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
                      value={partnerFilter}
                      onChange={(e) => setPartnerFilter(e.target.value)}
                    >
                      <option>Todos</option>
                      {[...(settings.partners || [])].sort((a, b) => a.localeCompare(b)).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente / Evento</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner cursor-pointer"
                      value={brideFilter}
                      onChange={(e) => setBrideFilter(e.target.value)}
                    >
                      <option value="Todos">Todos os clientes</option>
                      {[...brides]
                        .filter(b => b.id !== 58)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(b => <option key={b.id} value={b.id.toString()}>{b.name}</option>)
                      }
                      <option value="58">Geral / Sem Cliente</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <button
                  onClick={() => { setSearchTerm(''); setTypeFilter('Todos'); setDateFilter('Todos'); setPartnerFilter('Todos'); setBrideFilter('Todos'); setCustomStart(''); setCustomEnd(''); }}
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

      <div className="grid grid-cols-1 gap-6 lg:gap-8">
        <div className="w-full">
          <div className="bg-white rounded-2xl border border-[#883545]/10 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-4 lg:p-6 border-b border-[#883545]/5 flex justify-between items-center bg-[#883545]/5">
              <h3 className="font-bold text-slate-800">Lançamentos Recentes</h3>
            </div>
            <div className="lg:hidden p-4 space-y-4">
              {filteredItems.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400 italic font-medium">Nenhum lançamento encontrado com os filtros aplicados.</div>
              ) : (
                filteredItems.map((item: any) => (
                  <div key={item.id + (item.isExpense ? '-exp' : '-pay')} className={`${settings.ui.compactMode ? 'p-3' : 'p-4'} rounded-xl bg-slate-50 border border-[#883545]/5 space-y-3 relative overflow-hidden`}>
                    <div className={`absolute top-0 left-0 w-1 h-full ${item.isExpense ? 'bg-rose-500' : (item.status || '').trim().toLowerCase() === 'pago' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">{item.bride_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.description}</p>
                      </div>
                      <p className={`text-sm font-black ${item.isExpense ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {item.isExpense ? '-' : ''} R$ {Number(item.amount_paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <Calendar className="w-3 h-3 text-[#883545]/40" />
                          {item.payment_date && formatDisplayDate(item.payment_date)}
                        </div>
                        <button 
                          onClick={() => setEditingItem(item)}
                          className="text-[10px] font-black text-[#883545] uppercase tracking-widest px-2 py-1 bg-white rounded-lg shadow-sm"
                        >
                          Editar
                        </button>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${item.isExpense ? 'bg-rose-100 text-rose-700' :
                        (item.status || '').trim().toLowerCase() === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                        {item.isExpense ? 'Despesa' : (item.status || 'Pendente')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden lg:block">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Descrição / Origem</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                    <th className="px-6 py-4">Tipo / Status</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#883545]/5">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium">Nenhum lançamento encontrado com os filtros aplicados.</td>
                    </tr>
                  ) : (
                    filteredItems.map((item: any) => (
                      <tr key={item.id + (item.isExpense ? '-exp' : '-pay')} className="hover:bg-[#883545]/5 transition-colors group">
                        <td className={`${settings.ui.compactMode ? 'px-6 py-2' : 'px-6 py-4'}`}>
                          <p className={`${settings.ui.compactMode ? 'text-xs' : 'text-sm'} font-extrabold text-slate-900 group-hover:text-[#883545] transition-colors`}>{item.bride_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{item.description}</p>
                        </td>
                        <td className={`${settings.ui.compactMode ? 'px-6 py-2' : 'px-6 py-4'} text-xs font-medium text-slate-600`}>
                          {item.payment_date && formatDisplayDate(item.payment_date)}
                        </td>
                        <td className={`${settings.ui.compactMode ? 'px-6 py-2' : 'px-6 py-4'} ${settings.ui.compactMode ? 'text-xs' : 'text-sm'} font-black text-right ${item.isExpense ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {item.isExpense ? '-' : ''} R$ {Number(item.amount_paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`${settings.ui.compactMode ? 'px-6 py-2' : 'px-6 py-4'}`}>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.isExpense ? 'bg-rose-100 text-rose-700' :
                            (item.status || '').trim().toLowerCase() === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {item.isExpense ? 'SAÍDA' : 'ENTRADA'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setFinanceMenuId(openMenuId === (item.id + (item.isExpense ? '-exp' : '-pay')) ? null : (item.id + (item.isExpense ? '-exp' : '-pay')))}
                            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[#883545] transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === (item.id + (item.isExpense ? '-exp' : '-pay')) && (
                            <div className="absolute right-4 top-12 w-40 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(136,53,69,0.4)] border border-[#883545]/10 z-[100] p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                              <button 
                                onClick={() => { setEditingItem(item); setFinanceMenuId(null); }} 
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-[#883545]/5 hover:text-[#883545] rounded-lg transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button 
                                onClick={() => { 
                                  if (item.isExpense) onDeleteExpense(item.id); 
                                  else onDeletePayment(item.id);
                                  setFinanceMenuId(null);
                                }} 
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Rodapé com totais dos filtros aplicados */}
                {filteredItems.length > 0 && (() => {
                  const totalReceita = filteredItems.filter((i: any) => !i.isExpense).reduce((s: number, i: any) => s + Number(i.amount_paid), 0);
                  const totalDespesa = filteredItems.filter((i: any) => i.isExpense).reduce((s: number, i: any) => s + Number(i.amount_paid), 0);
                  const liquido = totalReceita - totalDespesa;
                  const isPositive = liquido >= 0;
                  return (
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-[#883545]/10">
                        <td colSpan={2} className="px-6 py-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Resultado dos filtros aplicados ({filteredItems.length} lançamentos)
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receita</span>
                              <span className="text-xs font-black text-emerald-600">R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Despesa</span>
                              <span className="text-xs font-black text-rose-500">- R$ {totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="w-full h-px bg-slate-200 my-0.5" />
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${isPositive ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Líquido</span>
                              <span className={`text-sm font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isPositive ? '' : '-'} R$ {Math.abs(liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4" />
                      </tr>
                    </tfoot>
                  );
                })()}
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Mobile */}
      {filteredItems.length > 0 && (() => {
        const totalReceita = filteredItems.filter((i: any) => !i.isExpense).reduce((s: number, i: any) => s + Number(i.amount_paid), 0);
        const totalDespesa = filteredItems.filter((i: any) => i.isExpense).reduce((s: number, i: any) => s + Number(i.amount_paid), 0);
        const liquido = totalReceita - totalDespesa;
        const isPositive = liquido >= 0;
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden bg-white rounded-2xl border border-[#883545]/10 shadow-sm overflow-hidden"
          >
            <div className="p-4 bg-[#883545]/5 border-b border-[#883545]/10">
              <p className="text-[10px] font-black text-[#883545] uppercase tracking-widest">Resultado dos Filtros ({filteredItems.length} lançamentos)</p>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center bg-emerald-50 rounded-xl p-3">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Receita</span>
                <span className="text-xs font-black text-emerald-600 text-center">R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex flex-col items-center bg-rose-50 rounded-xl p-3">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Despesa</span>
                <span className="text-xs font-black text-rose-500 text-center">R$ {totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={`flex flex-col items-center rounded-xl p-3 ${isPositive ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Líquido</span>
                <span className={`text-xs font-black text-center ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isPositive ? '+' : '-'} R$ {Math.abs(liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </motion.div>
  );
};

const FinanceModal = ({ 
  isOpen, 
  onClose, 
  brides, 
  partners, 
  onAddPayment, 
  onAddExpense, 
  onUpdatePayment,
  onDeletePayment,
  onUpdateExpense,
  onDeleteExpense,
  itemToEdit,
  onGoToSettings 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  brides: Bride[], 
  partners: string[], 
  onAddPayment: (p: any) => Promise<boolean>, 
  onAddExpense: (e: any) => Promise<boolean>,
  onUpdatePayment?: (id: number, p: any) => Promise<boolean>,
  onDeletePayment?: (id: number) => Promise<void>,
  onUpdateExpense?: (id: number, e: any) => Promise<boolean>,
  onDeleteExpense?: (id: number) => Promise<void>,
  itemToEdit?: any,
  onGoToSettings: () => void 
}) => {
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');
  const [revenueSegment, setRevenueSegment] = useState<'assessoria' | 'bv'>('assessoria');
  const [formData, setFormData] = useState({
    bride_id: '',
    description: '',
    partner_name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Pago',
    category: 'Geral'
  });

  useEffect(() => {
    if (itemToEdit) {
      setType(itemToEdit.isExpense ? 'saida' : 'entrada');
      
      // Detecção de tipo entrada (bv vs assessoria)
      let desc = itemToEdit.description || '';
      let isBV = false;
      let partner = '';
      if (desc.startsWith('[BV]')) {
        isBV = true;
        const parts = desc.replace('[BV] ', '').split(' - ');
        partner = parts[0];
        desc = parts.slice(1).join(' - ');
      }
      
      setRevenueSegment(isBV ? 'bv' : 'assessoria');
      setFormData({
        bride_id: !itemToEdit.bride_id ? '58' : String(itemToEdit.bride_id),
        description: desc.replace('[MULTA] ', ''),
        partner_name: partner,
        amount: String(itemToEdit.amount_paid || itemToEdit.amount || 0),
        date: itemToEdit.payment_date || itemToEdit.date || new Date().toISOString().split('T')[0],
        status: itemToEdit.status || 'Pago',
        category: itemToEdit.category || 'Geral'
      });
    } else {
      setType('entrada');
      setRevenueSegment('assessoria');
      setFormData({
        bride_id: '',
        description: '',
        partner_name: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Pago',
        category: 'Geral'
      });
    }
  }, [itemToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let success = false;
      if (type === 'entrada') {
        const isBV = revenueSegment === 'bv';
        const selectedBride = brides.find(b => String(b.id) === String(formData.bride_id));
        const isCancellation = selectedBride?.status === 'Cancelado';

        const payload = {
          bride_id: isBV ? (formData.bride_id || 58) : formData.bride_id,
          revenue_type: isBV ? 'bv' : 'assessoria',
          description: isBV
            ? `[BV] ${formData.partner_name} - ${formData.description}`
            : (isCancellation ? `[MULTA] ${formData.description}` : formData.description),
          amount_paid: Number(formData.amount),
          payment_date: formData.date,
          status: formData.status || 'Pago'
        };

        if (itemToEdit && onUpdatePayment) {
          success = await onUpdatePayment(itemToEdit.id, payload);
        } else {
          success = await onAddPayment(payload);
        }
      } else {
        const payload = {
          description: formData.description,
          amount: Number(formData.amount),
          date: formData.date,
          category: formData.category
        };

        if (itemToEdit && onUpdateExpense) {
          success = await onUpdateExpense(itemToEdit.id, payload);
        } else {
          success = await onAddExpense(payload);
        }
      }

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Erro ao processar lançamento:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-[#883545]/10"
      >
        <div className="p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-[#883545] uppercase tracking-widest flex items-center gap-2">
              {itemToEdit ? (
                <Edit className={`w-6 h-6 p-1 rounded-full ${type === 'entrada' ? 'bg-[#883545] text-white' : 'bg-rose-500 text-white'}`} />
              ) : (
                <Plus className={`w-6 h-6 p-1 rounded-full ${type === 'entrada' ? 'bg-[#883545] text-white' : 'bg-rose-500 text-white'}`} />
              )}
              {itemToEdit ? 'Editar Lançamento' : (type === 'entrada' ? 'Nova Receita' : 'Nova Despesa')}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <XCircle className="w-6 h-6 text-slate-300" />
            </button>
          </div>

          <div className="flex gap-2 mb-6 p-1 bg-slate-50 rounded-2xl border border-[#883545]/5">
            <button
              onClick={() => setType('entrada')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === 'entrada' ? 'bg-[#883545] text-white shadow-lg' : 'text-slate-400 hover:text-[#883545]'}`}
            >
              Receita (+)
            </button>
            <button
              onClick={() => setType('saida')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === 'saida' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-rose-500'}`}
            >
              Despesa (-)
            </button>
          </div>

          {type === 'entrada' && (
            <div className="flex gap-2 mb-6 p-1 bg-white rounded-xl border border-[#883545]/10">
              <button
                type="button"
                onClick={() => setRevenueSegment('assessoria')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${revenueSegment === 'assessoria' ? 'bg-slate-100 text-[#883545]' : 'text-slate-400'}`}
              >
                Assessoria
              </button>
              <button
                type="button"
                onClick={() => setRevenueSegment('bv')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${revenueSegment === 'bv' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'}`}
              >
                Bonificação (BV)
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'entrada' && (
              revenueSegment === 'assessoria' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                  <select
                    required
                    value={formData.bride_id}
                    onChange={(e) => setFormData({ ...formData, bride_id: e.target.value })}
                    className="w-full rounded-xl border-none bg-slate-50 text-sm p-4 focus:ring-2 focus:ring-[#883545]/20 font-bold shadow-inner"
                  >
                    <option value="">Selecione um cliente...</option>
                    {brides
                      .filter(b => {
                        if (b.id === 58) return false;
                        if (b.status === 'Ativa') return true;
                        if (b.status === 'Cancelado' && b.balance >= 1) return true;
                        return false;
                      })
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} - {formatDisplayDate(b.event_date)} {b.status === 'Cancelado' ? '(Cancelado/Multa)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parceiro / Fornecedor</label>
                    <select
                      required
                      value={formData.partner_name}
                      onChange={(e) => {
                        if (e.target.value === 'NEW_PARTNER') {
                          onGoToSettings();
                        } else {
                          setFormData({ ...formData, partner_name: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl border-none bg-emerald-50/30 text-sm p-4 focus:ring-2 focus:ring-emerald-500/20 font-bold shadow-inner"
                    >
                      <option value="">Selecione um parceiro...</option>
                      {[...(partners || [])].sort((a, b) => a.localeCompare(b)).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                      <option value="NEW_PARTNER" className="font-black text-emerald-600 bg-emerald-50 italic">➕ Cadastrar Novo Fornecedor...</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2 transition-all">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular a Cliente (Opcional)</label>
                    <select
                      value={formData.bride_id}
                      onChange={(e) => setFormData({ ...formData, bride_id: e.target.value })}
                      className="w-full rounded-xl border-dashed border-2 border-emerald-500/10 bg-slate-50/50 text-xs p-3 focus:ring-2 focus:ring-emerald-500/10 font-bold"
                    >
                      <option value="">Geral (Sem cliente específico)</option>
                      {[...brides]
                        .filter(b => b.id !== 58)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} - {formatDisplayDate(b.event_date)}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
              <input
                required
                type="text"
                placeholder={type === 'entrada' ? "Ex: Parcela 02/10" : "Ex: Uber para evento"}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border-none bg-slate-50 text-sm p-4 focus:ring-2 focus:ring-[#883545]/20 font-bold shadow-inner"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border-none bg-slate-50 text-sm p-4 focus:ring-2 focus:ring-[#883545]/20 font-bold shadow-inner"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0,00"
                  className={`w-full rounded-xl border-none bg-slate-50 text-sm p-4 focus:ring-2 focus:ring-[#883545]/20 font-black shadow-inner ${type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}
                />
              </div>
            </div>
            {type === 'saida' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border-none bg-slate-50 text-sm p-4 focus:ring-2 focus:ring-[#883545]/20 font-bold shadow-inner"
                >
                  <option value="Uber">Uber / Transporte</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Marketing">Marketing / Tráfego</option>
                  <option value="Equipe">Equipe / Freelance</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            )}
            <button type="submit" className={`mt-4 w-full h-14 text-white font-black rounded-2xl shadow-xl transition-all text-xs uppercase tracking-widest ${type === 'entrada' ? 'bg-[#883545] shadow-[#883545]/20 hover:bg-[#883545]/90' : 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600'}`}>
              {itemToEdit ? 'CONFIRMAR ALTERAÇÃO' : (type === 'entrada' ? 'LANÇAR RECEITA' : 'REGISTRAR DESPESA')}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};


export { FinanceView };
