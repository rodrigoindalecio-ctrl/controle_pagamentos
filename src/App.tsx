import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Clock,
  Wallet,
  Calendar,
  Settings,
  Plus,
  MoreVertical,
  Search,
  LayoutDashboard,
  Heart,
  LogOut,
  CircleDollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types & Interfaces ---

interface Bride {
  id: number;
  name: string;
  email: string;
  event_date: string;
  created_at: string;
  status: 'Ativa' | 'Inativa' | 'Cancelado';
  service_type: string;
  contract_value: number;
  original_value: number;
}

interface Payment {
  id: number;
  bride_id: number;
  bride_name: string;
  description: string;
  amount_paid: number;
  payment_date: string;
  status: string;
}

interface MonthlyStat {
  month: string;
  revenue: number;
  expenses: number;
}

interface DashboardStats {
  activeBrides: number;
  monthlyRevenue: number;
  pendingPayments: number;
  monthlyExpenses: number;
  chartData: MonthlyStat[];
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: { icon: any, label: string, active: boolean, onClick: () => void, badge?: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 lg:px-4 lg:py-3 rounded-xl transition-all duration-200 group ${active
        ? 'bg-[#883545] text-white shadow-lg shadow-[#883545]/20'
        : 'text-slate-500 hover:bg-[#883545]/5 hover:text-[#883545]'
      }`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${active ? 'text-white' : 'group-hover:text-[#883545]'}`} />
      <span className="text-xs lg:text-sm font-bold tracking-tight">{label}</span>
    </div>
    {badge && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${active ? 'bg-white/20 text-white' : 'bg-[#883545]/10 text-[#883545]'}`}>
        {badge}
      </span>
    )}
  </button>
);

const Header = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <header className="mb-6 lg:mb-8">
    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mb-1 lg:mb-2">{title}</h2>
    <p className="text-sm lg:text-base text-slate-500">{subtitle}</p>
  </header>
);

const StatCard = ({ label, value, icon: Icon, trend, color }: { label: string, value: string, icon: any, trend?: string, color: string }) => (
  <div className="bg-white p-4 lg:p-6 rounded-xl border border-[#883545]/10 shadow-sm flex flex-col gap-2">
    <div className="flex justify-between items-start">
      <span className="text-slate-500 text-xs lg:text-sm font-medium">{label}</span>
      <Icon className={`${color} opacity-40 w-4 h-4 lg:w-5 lg:h-5`} />
    </div>
    <p className="text-xl lg:text-2xl font-black text-slate-900">{value}</p>
    {trend && (
      <div className="flex items-center gap-1 text-emerald-600 text-[10px] lg:text-xs font-bold">
        <TrendingUp className="w-3 h-3" />
        <span>{trend}</span>
      </div>
    )}
  </div>
);

const DashboardView = ({ stats, payments, onViewAll }: { stats: DashboardStats | null, payments: Payment[], onViewAll: () => void }) => {
  if (!stats) return <div className="flex items-center justify-center h-64 text-slate-400 font-medium italic">Carregando painel...</div>;

  const maxVal = Math.max(...(stats.chartData?.map(d => Math.max(d.revenue, d.expenses)) || [1]), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 lg:space-y-8 pb-20 lg:pb-0"
    >
      <Header title="Olá, Rodrigo! 👋" subtitle="Aqui está o resumo da sua assessoria de casamentos hoje." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        <StatCard label="Noivas Ativas" value={stats.activeBrides.toString()} icon={Users} trend="+12% este mês" color="text-[#883545]" />
        <StatCard label="Receita (Mês)" value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} trend="+5% vs anterior" color="text-emerald-500" />
        <StatCard label="Pendentes" value={`R$ ${stats.pendingPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Clock} trend="-2% este mês" color="text-amber-500" />
        <StatCard label="Despesas" value={`R$ ${stats.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} trend="-8% este mês" color="text-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white p-4 lg:p-8 rounded-xl shadow-sm border border-[#883545]/10 flex flex-col">
          <div className="flex justify-between items-center mb-6 lg:mb-8">
            <div>
              <h3 className="text-lg lg:text-xl font-bold">Fluxo de Caixa</h3>
              <p className="text-slate-500 text-xs lg:text-sm">Comparativo mensal: Receitas vs Despesas</p>
            </div>
          </div>
          <div className="flex-1 min-h-[220px] flex items-end justify-between gap-2 lg:gap-6 px-2 lg:px-4">
            {(stats.chartData || []).map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex justify-center gap-1 items-end h-[160px] lg:h-[200px]">
                  {/* Revenue Bar */}
                  <div
                    className="w-2 lg:w-4 bg-[#883545] rounded-t-md transition-all duration-1000"
                    style={{ height: `${Math.max((data.revenue / maxVal) * 100, 4)}%` }}
                    title={`Receita: R$ ${data.revenue.toLocaleString('pt-BR')}`}
                  ></div>
                  {/* Expenses Bar */}
                  <div
                    className="w-2 lg:w-4 bg-slate-200 rounded-t-md transition-all duration-1000"
                    style={{ height: `${Math.max((data.expenses / maxVal) * 100, 2)}%` }}
                    title={`Despesa: R$ ${data.expenses.toLocaleString('pt-BR')}`}
                  ></div>
                </div>
                <span className="text-[10px] lg:text-xs font-bold text-slate-400 mt-1">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border border-[#883545]/10">
          <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6">Próximos Recebimentos</h3>
          <div className="flex flex-col gap-4 lg:gap-5 min-h-[100px]">
            {payments.filter(p => (p.status || '').trim().toLowerCase() !== 'pago').length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8 text-center">
                <CircleDollarSign className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-xs italic">Nenhum pagamento pendente</p>
              </div>
            ) : (
              payments.filter(p => (p.status || '').trim().toLowerCase() !== 'pago').slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center gap-3 lg:gap-4 group">
                  <div className="size-10 lg:size-12 rounded-xl bg-[#883545]/5 flex items-center justify-center text-[#883545] font-bold text-[10px] lg:text-xs group-hover:bg-[#883545]/10 transition-colors">
                    {payment.payment_date && new Date(payment.payment_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate">{payment.bride_name}</p>
                    <p className="text-[10px] lg:text-xs text-slate-500 font-medium truncate">{payment.description}</p>
                  </div>
                  <p className="text-sm font-black text-[#883545]">R$ {Number(payment.amount_paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              ))
            )}
            <button
              onClick={onViewAll}
              className="mt-4 lg:mt-6 w-full py-3 lg:py-4 border-2 border-[#883545]/5 text-[#883545] text-xs lg:text-sm font-black rounded-xl hover:bg-[#883545] hover:text-white transition-all uppercase tracking-widest"
            >
              Ver Todos
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Brides View ---

const BridesView = ({ brides, onAdd }: { brides: Bride[], onAdd: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="space-y-6"
  >
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <Header title="Lista de Noivas" subtitle={`Gerencie suas ${brides.length} clientes ativas e inativas.`} />
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-[#883545] text-white px-5 py-3 lg:px-6 lg:py-3.5 rounded-xl font-bold shadow-lg shadow-[#883545]/20 hover:scale-105 active:scale-95 transition-all text-sm"
      >
        <Plus className="w-4 h-4" />
        <span>NOVO EVENTO</span>
      </button>
    </div>

    <div className="bg-white rounded-2xl border border-[#883545]/10 shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-[10px] lg:text-xs uppercase tracking-wider font-bold border-b border-[#883545]/5">
            <th className="px-4 lg:px-6 py-4 lg:py-5">Noiva / Casal</th>
            <th className="px-4 lg:px-6 py-4 lg:py-5">Data Evento</th>
            <th className="px-4 lg:px-6 py-4 lg:py-5">Serviço</th>
            <th className="px-4 lg:px-6 py-4 lg:py-5">Valor Contrato</th>
            <th className="px-4 lg:px-6 py-4 lg:py-5">Status</th>
            <th className="px-4 lg:px-6 py-4 lg:py-5 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#883545]/5 font-medium">
          {brides.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma noiva cadastrada.</td>
            </tr>
          ) : (
            brides.map((bride) => (
              <tr key={bride.id} className="hover:bg-[#883545]/5 transition-colors group">
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#883545] transition-colors">{bride.name}</span>
                    <span className="text-[10px] lg:text-xs text-slate-500">{bride.email}</span>
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-700 text-xs lg:text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {bride.event_date && new Date(bride.event_date).toLocaleDateString('pt-BR')}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-600">
                  {bride.service_type || 'Não definido'}
                </td>
                <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm font-black text-[#883545]">
                  R$ {(bride.contract_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 lg:px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] lg:text-xs font-bold ${bride.status === 'Ativa' ? 'bg-emerald-100 text-emerald-700' :
                      bride.status === 'Inativa' ? 'bg-slate-100 text-slate-700' :
                        'bg-rose-100 text-rose-700'
                    }`}>
                    {bride.status}
                  </span>
                </td>
                <td className="px-4 lg:px-6 py-4 text-center">
                  <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[#883545] transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
);

// --- Finance View ---

const FinanceView = ({ payments, brides, onAdd }: { payments: Payment[], brides: Bride[], onAdd: (p: any) => void }) => {
  const [formData, setFormData] = useState({
    bride_id: '',
    description: '',
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
    status: 'Pago'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      amount_paid: Number(formData.amount_paid)
    });
    setFormData({
      bride_id: '',
      description: '',
      amount_paid: '',
      payment_date: new Date().toISOString().split('T')[0],
      status: 'Pago'
    });
  };

  const totalRecebido = payments
    .filter(p => (p.status || '').trim().toLowerCase() === 'pago')
    .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

  const totalPendente = payments
    .filter(p => (p.status || '').trim().toLowerCase() !== 'pago')
    .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 pb-20 lg:pb-0"
    >
      <Header title="Gestão Financeira" subtitle="Controle total de entradas e despesas da sua assessoria de casamentos." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <StatCard label="Total a Receber" value={`R$ ${(totalRecebido + totalPendente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} color="text-[#883545]" />
        <StatCard label="Recebido" value={`R$ ${totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={CircleDollarSign} color="text-emerald-500" />
        <StatCard label="Pendente" value={`R$ ${totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Clock} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-[#883545]/10">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#883545]" />
              Registrar Parcela
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Noiva / Casal</label>
                <select
                  required
                  value={formData.bride_id}
                  onChange={(e) => setFormData({ ...formData, bride_id: e.target.value })}
                  className="w-full rounded-lg border-[#883545]/20 bg-slate-50 text-sm p-2.5 focus:ring-[#883545] focus:border-[#883545] font-medium transition-all"
                >
                  <option value="">Selecione um cliente...</option>
                  {brides.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Parcela 02/10"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border-[#883545]/20 bg-slate-50 text-sm p-2.5 focus:ring-[#883545] focus:border-[#883545] font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Pagamento</label>
                  <input
                    required
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full rounded-lg border-[#883545]/20 bg-slate-50 text-sm p-2.5 focus:ring-[#883545] focus:border-[#883545] font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Pago (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                    placeholder="0,00"
                    className="w-full rounded-lg border-[#883545]/20 bg-slate-50 text-sm p-2.5 focus:ring-[#883545] focus:border-[#883545] font-bold text-[#883545]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border-[#883545]/20 bg-slate-50 text-sm p-2.5 focus:ring-[#883545] focus:border-[#883545] font-medium"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Vencido">Vencido</option>
                </select>
              </div>
              <button type="submit" className="mt-4 w-full h-11 lg:h-12 bg-[#883545] text-white font-black rounded-xl shadow-lg shadow-[#883545]/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest">
                LANÇAR PAGAMENTO
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#883545]/10 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-4 lg:p-6 border-b border-[#883545]/5 flex justify-between items-center bg-[#883545]/5">
              <h3 className="font-bold text-slate-800">Lançamentos Recentes</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition-all"><Search className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition-all"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Data Pagamento</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4 text-right">Valor Pago</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#883545]/5">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-400 italic font-medium">
                        <div className="flex flex-col items-center">
                          <CircleDollarSign className="w-10 h-10 opacity-10 mb-2 text-[#883545]" />
                          Nenhum lançamento encontrado.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-[#883545]/5 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-extrabold text-slate-900 group-hover:text-[#883545] transition-colors">{payment.bride_name}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          {payment.payment_date && new Date(payment.payment_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-tight">{payment.description}</td>
                        <td className="px-6 py-4 text-sm font-black text-right text-[#883545]">
                          R$ {Number(payment.amount_paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] lg:text-xs font-bold ${(payment.status || '').trim().toLowerCase() === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                              (payment.status || '').trim().toLowerCase() === 'pendente' ? 'bg-amber-100 text-amber-700' :
                                'bg-rose-100 text-rose-700'
                            }`}>
                            {payment.status || 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BrideModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (bride: any) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    event_date: '',
    service_type: '',
    contract_value: '',
    original_value: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#883545]/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="bg-[#883545] p-6 text-white text-center">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h2 className="text-2xl font-black uppercase tracking-widest">Novo Evento</h2>
        </div>

        <form className="p-6 lg:p-8 space-y-4 lg:space-y-6" onSubmit={(e) => {
          e.preventDefault();
          onAdd(formData);
          onClose();
        }}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome da Noiva / Casal</label>
              <input
                required
                className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm focus:ring-[#883545] border shadow-inner transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data do Evento</label>
                <input
                  required
                  type="date"
                  className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-bold shadow-inner"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Serviço</label>
                <input
                  placeholder="Assessoria do Dia..."
                  className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-bold shadow-inner"
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor do Contrato (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-black text-[#883545] shadow-inner"
                  value={formData.contract_value}
                  onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Original (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm text-slate-400 line-through font-bold shadow-inner"
                  value={formData.original_value}
                  onChange={(e) => setFormData({ ...formData, original_value: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-[#883545] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-[#883545]/20 hover:bg-[#883545]/90 hover:-translate-y-1 transition-all">
            Salvar Cadastro
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [brides, setBrides] = useState<Bride[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isBrideModalOpen, setIsBrideModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, bridesRes, paymentsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/brides'),
        fetch('/api/payments')
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (bridesRes.ok) {
        setBrides(await bridesRes.json());
      }
      if (paymentsRes.ok) {
        setPayments(await paymentsRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddBride = async (brideData: any) => {
    try {
      const res = await fetch('/api/brides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brideData)
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPayment = async (paymentData: any) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      if (res.ok) {
        fetchData();
        setActiveTab('dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDF8F8] text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-[#883545]/10 flex-col p-6 shadow-2xl shadow-[#883545]/5 z-20">
        <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
          <div className="size-12 bg-[#883545] rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-[#883545]/30 group-hover:rotate-6 transition-transform">
            <Heart className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#883545] tracking-tight leading-none uppercase">WeddingAdviser</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Gestão Premium</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Users} label="Noivas" active={activeTab === 'brides'} onClick={() => setActiveTab('brides')} />
          <SidebarItem icon={CircleDollarSign} label="Financeiro" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
          <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-[#883545]/10">
          <div className="flex items-center gap-4 px-2 mb-6 group cursor-pointer">
            <div className="size-10 bg-[#883545]/10 rounded-xl flex items-center justify-center text-[#883545] font-black group-hover:bg-[#883545]/20 transition-colors">RS</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-slate-800 truncate leading-none mb-1">Rodrigo Silva</p>
              <button onClick={() => { }} className="flex items-center gap-1 text-[10px] font-bold text-[#883545]/60 hover:text-[#883545] transition-colors">
                <LogOut className="w-3 h-3" />
                SAIR DA CONTA
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsBrideModalOpen(true)}
            className="w-full bg-[#883545] text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#883545]/25"
          >
            <Plus className="w-5 h-5" />
            <span className="uppercase tracking-widest text-xs">Novo Evento</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 lg:p-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardView
                key="dash"
                stats={stats}
                payments={payments}
                onViewAll={() => setActiveTab('finance')}
              />
            )}
            {activeTab === 'brides' && (
              <BridesView
                key="brides"
                brides={brides}
                onAdd={() => setIsBrideModalOpen(true)}
              />
            )}
            {activeTab === 'finance' && (
              <FinanceView
                key="finance"
                payments={payments}
                brides={brides}
                onAdd={handleAddPayment}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <BrideModal
        isOpen={isBrideModalOpen}
        onClose={() => setIsBrideModalOpen(false)}
        onAdd={handleAddBride}
      />
    </div>
  );
}
