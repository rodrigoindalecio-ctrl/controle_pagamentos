import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
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
  CircleDollarSign,
  Edit,
  Trash2,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  UserMinus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types & Interfaces ---

interface Bride {
  id: number;
  name: string;
  email: string;
  event_date: string;
  created_at: string;
  status: 'Ativa' | 'Inativa' | 'Cancelado' | 'Concluído';
  service_type: string;
  contract_value: number;
  original_value: number;
  balance: number;
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

interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface MonthlyStat {
  month: string;
  revenue: number;
  expenses: number;
}

interface DashboardStats {
  activeBrides: number;
  activeBridesBreakdown?: {
    year2026: number;
    year2027: number;
    year2028: number;
  };
  activeBridesTrend: string;
  monthlyRevenue: number;
  revenueBreakdown?: {
    assessoria: number;
    bv: number;
  };
  revenueTrend: string;
  pendingPayments: number;
  pendingBreakdown?: {
    year2026: number;
    year2027: number;
    year2028: number;
  };
  monthlyExpenses: number;
  expensesTrend: string;
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

const StatCard = ({ label, value, icon: Icon, trend, color, children }: { label: string, value: string, icon: any, trend?: string, color: string, children?: React.ReactNode }) => {
  const isNegativeValue = value.includes('-') || (label === "Saldo Líquido" && parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) < 0);

  return (
    <div className="bg-white p-4 lg:p-6 rounded-xl border border-[#883545]/10 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:border-[#883545]/30 transition-all">
      <div className="flex justify-between items-start relative z-10">
        <span className="text-slate-500 text-[10px] lg:text-xs font-bold uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg bg-slate-50 ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
        </div>
      </div>
      <div className="relative z-10">
        <p className={`text-lg lg:text-2xl font-black leading-none mb-1 ${isNegativeValue ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-600' :
            trend.startsWith('-') ? 'text-rose-600' :
              'text-slate-400'
            }`}>
            {trend.startsWith('-') ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      {children && <div className="mt-2 pt-2 border-t border-slate-50 relative z-10">{children}</div>}
      <div className={`absolute -right-2 -bottom-2 w-16 h-16 ${color} opacity-[0.03] group-hover:scale-125 transition-transform`}>
        <Icon className="w-full h-full" />
      </div>
    </div>
  );
};

const DashboardView = ({ stats, payments, brides, onViewAll }: { stats: DashboardStats | null, payments: Payment[], brides: Bride[], onViewAll: () => void, key?: string }) => {
  if (!stats) return <div className="flex items-center justify-center h-64 text-slate-400 font-medium italic">Carregando painel...</div>;

  const maxVal = Math.max(...(stats.chartData?.map(d => Math.max(d.revenue, d.expenses)) || [1]), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 lg:space-y-8 pb-20 lg:pb-0"
    >
      {/* UI v2.1 */}
      <Header title="Olá, Rodrigo! 👋" subtitle="Aqui está o resumo da sua assessoria de casamentos hoje." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          label="Eventos Ativos Mês"
          value={stats.activeBrides.toString()}
          icon={Users}
          color="text-[#883545]"
        >
          {stats.activeBridesBreakdown && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                <span className="text-slate-400">2026:</span>
                <span className="text-[#883545] font-black">{stats.activeBridesBreakdown.year2026}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                <span className="text-slate-400">2027:</span>
                <span className="text-[#883545] font-black">{stats.activeBridesBreakdown.year2027}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                <span className="text-slate-400">2028:</span>
                <span className="text-[#883545] font-black">{stats.activeBridesBreakdown.year2028}</span>
              </div>
            </div>
          )}
        </StatCard>

        <StatCard label="Receita (Mês)" value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} trend={`${stats.revenueTrend} vs anterior`} color="text-emerald-500" />
        <StatCard
          label="Pendentes Mês"
          value={`R$ ${stats.pendingPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Clock}
          color="text-amber-500"
        >
          {stats.pendingBreakdown && (
            <div className="space-y-1">

              <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                <span className="text-slate-400">2026:</span>
                <span className="text-amber-600">R$ {stats.pendingBreakdown.year2026.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                <span className="text-slate-400">2027:</span>
                <span className="text-amber-600">R$ {stats.pendingBreakdown.year2027.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                <span className="text-slate-400">2028:</span>
                <span className="text-amber-600">R$ {stats.pendingBreakdown.year2028.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </StatCard>
        <StatCard label="Despesas" value={`R$ ${stats.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} trend={`${stats.expensesTrend} vs anterior`} color="text-rose-500" />
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
          <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6">Alertas de Pendência</h3>
          <div className="flex flex-col gap-4 lg:gap-5 min-h-[100px]">
            {(() => {
              const alerts = brides
                .filter(b => b.status === 'Ativa')
                .map(b => {
                  const balance = Number(b.balance) || 0;
                  const eventDate = new Date(b.event_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const diffTime = eventDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return { ...b, balance, diffDays };
                })
                .filter(b => b.balance > 1) // ignora diferenças de centavos
                .sort((a, b) => a.diffDays - b.diffDays)
                .slice(0, 5);

              if (alerts.length === 0) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8 text-center">
                    <CircleDollarSign className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs italic">Tudo em dia!</p>
                  </div>
                );
              }

              return alerts.map((bride) => (
                <div key={bride.id} className="flex items-center gap-3 lg:gap-4 group">
                  <div className={`size-10 lg:size-12 rounded-xl flex flex-col items-center justify-center font-bold transition-all ${bride.diffDays <= 10 ? 'bg-rose-100 text-rose-600 shadow-sm' : 'bg-[#883545]/5 text-[#883545]'}`}>
                    <span className="text-[14px] lg:text-[16px] leading-none">{bride.diffDays}</span>
                    <span className="text-[7px] lg:text-[8px] uppercase tracking-tighter">DIAS</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate">{bride.name}</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${bride.diffDays <= 10 ? 'text-rose-500' : 'text-slate-400'}`}>
                        A PAGAR: R$ {bride.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  {bride.diffDays <= 10 && <div className="size-2 rounded-full bg-rose-500 animate-pulse shrink-0" />}
                </div>
              ));
            })()}
            <button
              onClick={onViewAll}
              className="mt-4 lg:mt-6 w-full py-3 lg:py-4 border-2 border-[#883545]/5 text-[#883545] text-xs lg:text-sm font-black rounded-xl hover:bg-[#883545] hover:text-white transition-all uppercase tracking-widest"
            >
              Ver Todos Clientes
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Brides View ---

const DistratoModal = ({ isOpen, onClose, onConfirm, bride, payments }: { isOpen: boolean, onClose: () => void, onConfirm: (fine: number) => void, bride: Bride | null, payments: Payment[] }) => {
  const [fine, setFine] = useState(0);

  useEffect(() => {
    if (bride && isOpen) {
      const eventDate = new Date(bride.event_date);
      const today = new Date();
      const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const suggestedPercent = diffDays > 30 ? 0.5 : 1.0;
      setFine(bride.contract_value * suggestedPercent);
    }
  }, [bride, isOpen]);

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

const BridesView = ({ brides, payments, onEdit, onUpdateStatus, onDelete }: { brides: Bride[], payments: Payment[], onEdit: (bride: Bride) => void, onUpdateStatus: (id: number, status: string, options?: any) => void, onDelete: (id: number) => void, key?: string }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [yearFilter, setYearFilter] = useState('Todos');
  const [balanceFilter, setBalanceFilter] = useState('Todos');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isDistratoModalOpen, setIsDistratoModalOpen] = useState(false);
  const [brideForDistrato, setBrideForDistrato] = useState<Bride | null>(null);

  const calculateBalance = (bride: Bride) => {
    const totalPaid = payments
      .filter(p => p.bride_id === bride.id && (p.status || '').trim().toLowerCase() === 'pago')
      .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
    return {
      totalPaid,
      balance: bride.balance
    };
  };

  const filteredBrides = brides.filter(b => {
    if (b.id === 58) return false; // Esconde o cliente de BV da lista
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || (b.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || b.status === statusFilter;
    const matchesYear = yearFilter === 'Todos' || (b.event_date || '').startsWith(yearFilter);
    const matchesBalance = balanceFilter === 'Todos' || (balanceFilter === 'Com Pendência' ? b.balance > 1 : b.balance <= 1);

    return matchesSearch && matchesStatus && matchesYear && matchesBalance;
  });

  const years = Array.from(new Set(brides.map(b => (b.event_date || '').split('-')[0]).filter(Boolean))).sort();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Header title="Lista de Clientes" subtitle={`Gerencie seus ${brides.filter(b => b.id !== 58).length} clientes ativos e inativos.`} />
      </div>

      {/* Sugestão de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-[#883545]/10 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Cliente</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Nome ou email..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#883545]/20 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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

        <button
          onClick={() => { setSearchTerm(''); setStatusFilter('Todos'); setYearFilter('Todos'); setBalanceFilter('Todos'); }}
          className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
          title="Limpar Filtros"
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
              <div key={bride.id} className="bg-white p-5 rounded-2xl border border-[#883545]/10 shadow-sm space-y-4 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-1.5 h-full ${bride.status === 'Ativa' ? 'bg-emerald-500' : bride.status === 'Concluído' ? 'bg-blue-400' : bride.status === 'Inativa' ? 'bg-slate-300' : 'bg-rose-500'}`} />

                <div className="flex justify-between items-start pr-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-[#883545] transition-colors">{bride.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{bride.email}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === bride.id ? null : bride.id)}
                      className="p-2 -mr-2 text-slate-300 hover:text-[#883545] transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenuId === bride.id && (
                      <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-2xl border border-[#883545]/10 z-50 p-2 space-y-1 animate-in fade-in zoom-in duration-200">
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
                        <button onClick={() => { setBrideForDistrato(bride); setIsDistratoModalOpen(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </button>
                        <div className="h-px bg-slate-50 my-1" />
                        <button onClick={() => onDelete(bride.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
                      {bride.event_date && new Date(bride.event_date).toLocaleDateString('pt-BR')}
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

      <div className="hidden lg:block bg-white rounded-2xl border border-[#883545]/10 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] lg:text-xs uppercase tracking-wider font-bold border-b border-[#883545]/5">
                <th className="px-4 lg:px-6 py-4 lg:py-5">Cliente / Casal</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Data Evento</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Serviço</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Valor Contrato</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Pago</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">A Pagar</th>
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
                      <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm font-black text-slate-700">
                        {bride.status === 'Cancelado' && bride.original_value > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-rose-600">Multa: R$ {bride.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-slate-400 line-through font-medium">Orig: R$ {bride.original_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ) : (
                          <>R$ {(bride.contract_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm font-bold text-emerald-600">
                        R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm font-black text-[#883545]">
                        R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] lg:text-xs font-bold ${bride.status === 'Ativa' ? 'bg-emerald-100 text-emerald-700' :
                          bride.status === 'Concluído' ? 'bg-blue-100 text-blue-700' :
                            bride.status === 'Inativa' ? 'bg-slate-100 text-slate-700' :
                              'bg-rose-100 text-rose-700'
                          }`}>
                          {bride.status}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-center relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === bride.id ? null : bride.id)}
                          className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[#883545] transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenuId === bride.id && (
                          <div className="absolute right-0 top-14 w-48 bg-white rounded-xl shadow-2xl border border-[#883545]/10 z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
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
                            <button onClick={() => { setBrideForDistrato(bride); setIsDistratoModalOpen(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                              <XCircle className="w-3.5 h-3.5" /> Cancelar
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
        bride={brideForDistrato}
        payments={payments}
        onConfirm={(fine) => {
          if (brideForDistrato) {
            onUpdateStatus(brideForDistrato.id, 'Cancelado', {
              fine_amount: fine,
              original_value: brideForDistrato.contract_value
            });
            setIsDistratoModalOpen(false);
          }
        }}
      />
    </motion.div >
  );
};

// --- Finance View ---

const FinanceView = ({ payments, expenses, brides, stats, onAddPayment, onAddExpense }: { payments: Payment[], expenses: Expense[], brides: Bride[], stats: DashboardStats | null, onAddPayment: (p: any) => void, onAddExpense: (e: any) => void, key?: string }) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'entrada') {
      const isBV = revenueSegment === 'bv';
      const selectedBride = brides.find(b => String(b.id) === String(formData.bride_id));
      const isCancellation = selectedBride?.status === 'Cancelado';

      onAddPayment({
        bride_id: isBV ? 58 : formData.bride_id,
        description: isBV
          ? `[BV] ${formData.partner_name} - ${formData.description}`
          : (isCancellation ? `[MULTA] ${formData.description}` : formData.description),
        amount_paid: Number(formData.amount),
        payment_date: formData.date,
        status: 'Pago'
      });
    } else {
      onAddExpense({
        description: formData.description,
        amount: Number(formData.amount),
        date: formData.date,
        category: formData.category
      });
    }
    setFormData({
      bride_id: '',
      description: '',
      partner_name: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Pago',
      category: 'Geral'
    });
    setRevenueSegment('assessoria');
  };

  const totalRecebido = payments
    .filter(p => (p.status || '').trim().toLowerCase() === 'pago')
    .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

  const totalPendente = brides
    .filter(b => (b.status === 'Ativa' || b.status === 'Cancelado') && b.id !== 58)
    .reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 pb-20 lg:pb-0"
    >
      <Header title="Gestão Financeira" subtitle="Controle total de entradas e despesas da sua assessoria de casamentos." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
        <StatCard label="Total Ganho" value={`R$ ${totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} color="text-emerald-500" />
        <StatCard label="Despesas" value={`R$ ${expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} color="text-rose-500" />
        <StatCard label="Saldo Líquido" value={`R$ ${(totalRecebido - expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={CircleDollarSign} color="text-[#883545]" />
        <StatCard label="A Receber" value={`R$ ${totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Clock} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-[#883545]/10">
            <div className="flex gap-2 mb-6 p-1 bg-slate-50 rounded-xl border border-[#883545]/5">
              <button
                onClick={() => setType('entrada')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${type === 'entrada' ? 'bg-[#883545] text-white shadow-md' : 'text-slate-400 hover:text-[#883545]'}`}
              >
                Receita (+)
              </button>
              <button
                onClick={() => setType('saida')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${type === 'saida' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-rose-500'}`}
              >
                Despesa (-)
              </button>
            </div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Plus className={`w-5 h-5 ${type === 'entrada' ? 'text-[#883545]' : 'text-rose-500'}`} />
              {type === 'entrada' ? 'Registrar Parcela' : 'Lançar Despesa'}
            </h3>

            {type === 'entrada' && (
              <div className="flex gap-2 mb-6 p-1 bg-white rounded-xl border border-[#883545]/10">
                <button
                  type="button"
                  onClick={() => setRevenueSegment('assessoria')}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${revenueSegment === 'assessoria' ? 'bg-slate-100 text-[#883545]' : 'text-slate-400'}`}
                >
                  Assessoria
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueSegment('bv')}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${revenueSegment === 'bv' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'}`}
                >
                  Bonificação (BV)
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
              {type === 'entrada' && (
                revenueSegment === 'assessoria' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</label>
                    <select
                      required
                      value={formData.bride_id}
                      onChange={(e) => setFormData({ ...formData, bride_id: e.target.value })}
                      className="w-full rounded-lg border-[#883545]/20 bg-slate-50 text-sm p-2.5 focus:ring-[#883545] focus:border-[#883545] font-medium transition-all"
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
                            {b.name} {b.status === 'Cancelado' ? '(Cancelado/Multa)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Parceiro / Fornecedor</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Papelaria Modelo, Buffet X"
                      value={formData.partner_name}
                      onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                      className="w-full rounded-lg border-[#883545]/20 bg-emerald-50/30 text-sm p-2.5 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                    />
                  </div>
                )
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</label>
                <input
                  required
                  type="text"
                  placeholder={type === 'entrada' ? "Ex: Parcela 02/10" : "Ex: Uber para evento"}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border-[#883545]/20 bg-slate-50 text-sm p-2.5 focus:ring-[#883545] focus:border-[#883545] font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Data {type === 'entrada' ? 'do Pagamento' : 'da Despesa'}</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-lg border-[#883545]/20 bg-slate-50 text-sm p-2.5 focus:ring-[#883545] focus:border-[#883545] font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Valor (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                    className={`w-full rounded-lg border-[#883545]/20 bg-slate-50 text-sm p-2.5 focus:ring-[#883545] focus:border-[#883545] font-bold ${type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}
                  />
                </div>
              </div>
              {type === 'saida' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border-[#883545]/20 bg-slate-50 text-sm p-2.5 focus:ring-[#883545] focus:border-[#883545] font-medium"
                  >
                    <option value="Uber">Uber / Transporte</option>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Marketing">Marketing / Tráfego</option>
                    <option value="Equipe">Equipe / Freelance</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              )}
              <button type="submit" className={`mt-4 w-full h-11 lg:h-12 text-white font-black rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest ${type === 'entrada' ? 'bg-[#883545] shadow-[#883545]/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                {type === 'entrada' ? 'LANÇAR RECEITA' : 'REGISTRAR DESPESA'}
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
            <div className="lg:hidden p-4 space-y-4">
              {[...payments, ...expenses.map(e => ({ ...e, bride_name: `[DESPESA] ${e.category}`, isExpense: true, amount_paid: e.amount, payment_date: e.date }))]
                .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                .slice(0, 20)
                .map((item: any) => (
                  <div key={item.id + (item.isExpense ? '-exp' : '-pay')} className="p-4 rounded-xl bg-slate-50 border border-[#883545]/5 space-y-3 relative overflow-hidden">
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
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                        <Calendar className="w-3 h-3 text-[#883545]/40" />
                        {item.payment_date && new Date(item.payment_date).toLocaleDateString('pt-BR')}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${item.isExpense ? 'bg-rose-100 text-rose-700' :
                        (item.status || '').trim().toLowerCase() === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                        {item.isExpense ? 'Despesa' : (item.status || 'Pendente')}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Descrição / Origem</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                    <th className="px-6 py-4">Tipo / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#883545]/5">
                  {[...payments, ...expenses.map(e => ({ ...e, bride_name: `Despesa: ${e.category}`, isExpense: true, amount_paid: e.amount, payment_date: e.date }))]
                    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                    .slice(0, 30)
                    .map((item: any) => (
                      <tr key={item.id + (item.isExpense ? '-exp' : '-pay')} className="hover:bg-[#883545]/5 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-extrabold text-slate-900 group-hover:text-[#883545] transition-colors">{item.bride_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{item.description}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          {item.payment_date && new Date(item.payment_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className={`px-6 py-4 text-sm font-black text-right ${item.isExpense ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {item.isExpense ? '-' : ''} R$ {Number(item.amount_paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.isExpense ? 'bg-rose-100 text-rose-700' :
                            (item.status || '').trim().toLowerCase() === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {item.isExpense ? 'SAÍDA' : 'ENTRADA'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SettingsView = ({ key }: { key?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="space-y-6 pb-20 lg:pb-0"
  >
    <Header title="Configurações" subtitle="Gerencie as preferências da sua conta e do sistema." />
    <div className="bg-white p-6 lg:p-10 rounded-2xl border border-[#883545]/10 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
      <div className="size-20 bg-[#883545]/5 rounded-full flex items-center justify-center text-[#883545] mb-4">
        <Settings className="w-10 h-10 opacity-40" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Em Breve</h3>
      <p className="text-slate-500 max-w-xs">Estamos preparando as melhores opções de personalização para você.</p>
    </div>
  </motion.div>
);

const BrideModal = ({ isOpen, onClose, onSave, brideToEdit }: { isOpen: boolean, onClose: () => void, onSave: (bride: any) => void, brideToEdit?: Bride | null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    event_date: '',
    service_type: '',
    contract_value: '',
    original_value: ''
  });

  useEffect(() => {
    if (brideToEdit) {
      setFormData({
        name: brideToEdit.name || '',
        email: brideToEdit.email || '',
        event_date: brideToEdit.event_date ? brideToEdit.event_date.split('T')[0] : '',
        service_type: brideToEdit.service_type || '',
        contract_value: brideToEdit.contract_value?.toString() || '',
        original_value: brideToEdit.original_value?.toString() || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        event_date: '',
        service_type: '',
        contract_value: '',
        original_value: ''
      });
    }
  }, [brideToEdit, isOpen]);

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
        <div className="bg-[#883545] p-6 text-white text-center relative">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-full transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h2 className="text-2xl font-black uppercase tracking-widest">{brideToEdit ? 'Editar Evento' : 'Novo Evento'}</h2>
        </div>

        <form className="p-6 lg:p-8 space-y-4 lg:space-y-6" onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
          onClose();
        }}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Cliente / Casal</label>
              <input
                required
                className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm focus:ring-[#883545] border shadow-inner transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</label>
              <input
                type="email"
                placeholder="email@exemplo.com"
                className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm focus:ring-[#883545] border shadow-inner transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  step="0.01"
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
                  step="0.01"
                  placeholder="0,00"
                  className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm text-slate-400 line-through font-bold shadow-inner"
                  value={formData.original_value}
                  onChange={(e) => setFormData({ ...formData, original_value: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-[#883545] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-[#883545]/20 hover:bg-[#883545]/90 hover:-translate-y-1 transition-all">
            {brideToEdit ? 'Atualizar Cliente' : 'Salvar Cadastro'}
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isBrideModalOpen, setIsBrideModalOpen] = useState(false);
  const [brideToEdit, setBrideToEdit] = useState<Bride | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, bridesRes, paymentsRes, expensesRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/brides'),
        fetch('/api/payments'),
        fetch('/api/expenses')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (bridesRes.ok) setBrides(await bridesRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBride = async (brideData: any) => {
    try {
      const url = brideToEdit ? `/api/brides/${brideToEdit.id}` : '/api/brides';
      const method = brideToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brideData)
      });
      if (res.ok) {
        fetchData();
        setBrideToEdit(null);
      }
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
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddExpense = async (expenseData: any) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBrideStatus = async (id: number, status: string, options: any = {}) => {
    try {
      const res = await fetch(`/api/brides/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          fine_amount: options.fine_amount,
          original_value: options.original_value
        })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBride = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      const res = await fetch(`/api/brides/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
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
          <SidebarItem icon={Users} label="Clientes" active={activeTab === 'brides'} onClick={() => setActiveTab('brides')} />
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
            onClick={() => { setBrideToEdit(null); setIsBrideModalOpen(true); }}
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
                brides={brides}
                onViewAll={() => setActiveTab('brides')}
              />
            )}
            {activeTab === 'brides' && (
              <BridesView
                key="brides"
                brides={brides}
                payments={payments}
                onEdit={(bride) => { setBrideToEdit(bride); setIsBrideModalOpen(true); }}
                onUpdateStatus={handleUpdateBrideStatus}
                onDelete={handleDeleteBride}
              />
            )}
            {activeTab === 'finance' && (
              <FinanceView
                key="finance"
                payments={payments}
                expenses={expenses}
                brides={brides}
                stats={stats}
                onAddPayment={handleAddPayment}
                onAddExpense={handleAddExpense}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView key="settings" />
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Floating Action Button */}
        <button
          onClick={() => { setBrideToEdit(null); setIsBrideModalOpen(true); }}
          className="lg:hidden fixed bottom-24 right-6 size-14 bg-[#883545] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white"
        >
          <Plus className="w-8 h-8" />
        </button>
      </main>

      <BrideModal
        isOpen={isBrideModalOpen}
        onClose={() => { setIsBrideModalOpen(false); setBrideToEdit(null); }}
        onSave={handleSaveBride}
        brideToEdit={brideToEdit}
      />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

const MobileNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
  <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#883545]/10 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0,05)]">
    <button
      onClick={() => setActiveTab('dashboard')}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-[#883545] scale-110' : 'text-slate-400 opacity-60'}`}
    >
      <LayoutDashboard className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Início</span>
    </button>
    <button
      onClick={() => setActiveTab('brides')}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'brides' ? 'text-[#883545] scale-110' : 'text-slate-400 opacity-60'}`}
    >
      <Users className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Noivas</span>
    </button>
    <button
      onClick={() => setActiveTab('finance')}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'finance' ? 'text-[#883545] scale-110' : 'text-slate-400 opacity-60'}`}
    >
      <CircleDollarSign className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Caixa</span>
    </button>
    <button
      onClick={() => setActiveTab('settings')}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'settings' ? 'text-[#883545] scale-110' : 'text-slate-400 opacity-60'}`}
    >
      <Settings className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Ajustes</span>
    </button>
  </div>
);
