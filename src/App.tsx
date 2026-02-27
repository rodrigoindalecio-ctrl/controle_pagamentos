// Componente mínimo SidebarItem
function SidebarItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-[#883545]/10 text-[#883545]' : 'text-slate-700 hover:bg-slate-50'}`}
      onClick={onClick}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{label}</span>
    </button>
  );
}
import React, { useState, useEffect } from 'react';
import DoughnutChart from './DoughnutChart';
import VolumeValorBarChart from './VolumeValorBarChart';
import OcupacaoAgendaBarChart from './OcupacaoAgendaBarChart';
import GhostLinesChart from './GhostLinesChart';
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
  UserMinus,
  Award,
  Trophy,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  Sparkles,
  X
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
  yearlyRevenue: number;
  activeBridesBreakdown?: {
    year2026?: number;
    year2027?: number;
    year2028?: number;
    year1?: number;
    year2?: number;
    year3?: number;
    label1?: string;
    label2?: string;
    label3?: string;
  };
  eventosAtivos?: number;
  receita?: number;
  pendentes?: number;
  despesas?: number;
  novosContratos?: number;
  ticketMedio?: number;
  eficiencia?: string;
  crescimentoYoY?: string;
  cancelamentos?: any;
  faturamentoProjetado?: number;
  ocupacaoAgenda?: any;
  mixReceita?: any;
  volumeValor?: any;
  ghostLines?: any;
  fluxoCaixa?: any;
  recebimentos?: any;
  chartData?: Array<{ month: string; revenue: number; expenses: number }>;
  monthlyRevenue?: number;
  revenueTrend?: string;
  pendingPayments?: number;
  pendingBreakdown?: {
    year2026: number;
    year2027: number;
    year2028: number;
  };
  monthlyExpenses?: number;
  expensesTrend?: string;
  efficiency?: string;
  growthYoY?: string;
  growthYoYBreakdown?: {
    current: number;
    previous: number;
  };
  cancellations?: {
    count: number;
    revenue: number;
    lost: number;
  };
}

interface AppSettings {
  profile: {
    name: string;
    logo: string;
    description: string;
  };
  services: string[];
  partners: string[];
  goals: {
    annualRevenue: number;
    fineThresholdDays: number;
    fineEarlyPercent: number;
    fineLatePercent: number;
  };
  ui: {
    darkMode: boolean;
    compactMode: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    name: "WeddingAdviser",
    logo: "",
    description: "Gestão Premium"
  },
  services: ["Assessoria do Dia", "Assessoria Completa", "Assessoria Parcial", "Consultoria"],
  partners: ["Papelaria Modelo", "Buffet X", "Uber", "Freelancer"],
  goals: {
    annualRevenue: 100000,
    fineThresholdDays: 30,
    fineEarlyPercent: 50,
    fineLatePercent: 100
  },
  ui: {
    darkMode: false,
    compactMode: false
  }
};

// Implementação mínima de StatCard
const StatCard = ({ label, value, icon: Icon, color, trend, children }: any) => {
  const isNegative = trend && (trend.includes('-') || trend.includes('descendo'));
  const isPositive = trend && (trend.includes('+') || trend.includes('subindo'));

  // Tenta separar o R$ do valor para um estilo mais premium
  const currencyMatch = typeof value === 'string' ? value.match(/^(R\$\s?)(.*)$/) : null;
  const currency = currencyMatch ? currencyMatch[1] : '';
  const amount = currencyMatch ? currencyMatch[2] : value;
  // Lógica de tamanho de fonte dinâmico
  const amountStr = String(amount);
  const fontSizeClass =
    amountStr.length > 24 ? 'text-xs' :
      amountStr.length > 18 ? 'text-sm' :
        amountStr.length > 14 ? 'text-lg' :
          amountStr.length > 11 ? 'text-xl' :
            amountStr.length > 9 ? 'text-2xl' :
              'text-3xl';

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#883545]/5 flex flex-col h-full hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-2 shrink-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
        <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').split('-')[0]}-50 ${color} group-hover:scale-110 transition-transform`}>
          {Icon && <Icon className="size-4" />}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="flex items-center justify-center gap-1 w-full min-h-[40px]">
          {currency && <span className="text-xs font-bold text-slate-400 mt-1">{currency}</span>}
          <span className={`${fontSizeClass} font-black text-slate-800 leading-tight break-words`}>
            {amount}
          </span>
        </div>

        {trend && (
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : isNegative ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
              {trend.split(' ')[0]}
            </span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">vs anterior</span>
          </div>
        )}
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-slate-50">
          {children}
        </div>
      )}
    </div>
  );
};

// Implementação mínima de Header
const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-4">
    <h2 className="text-2xl font-bold text-[#883545] italic">{title}</h2>
    {subtitle && <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 opacity-70">{subtitle}</p>}
  </div>
);

// --- Componente de Loading ---
const LoadingScreen = ({ logo }: { logo?: string, key?: string }) => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-[#FDF8F8] flex flex-col items-center justify-center"
  >
    <div className="relative">
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-[#883545] rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [1, 0.9, 1],
          boxShadow: [
            "0 0 20px rgba(136, 53, 69, 0.1)",
            "0 0 40px rgba(136, 53, 69, 0.2)",
            "0 0 20px rgba(136, 53, 69, 0.1)"
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="size-32 bg-white rounded-[2.8rem] flex items-center justify-center border border-[#883545]/5 overflow-hidden p-7"
      >
        {logo ? (
          <img src={logo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <Heart className="text-[#883545] w-12 h-12" />
        )}
      </motion.div>

      {/* Spinning Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-4 border-2 border-dashed border-[#883545]/10 rounded-[3.5rem]"
      />
    </div>

    <div className="mt-12 flex flex-col items-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[10px] font-black text-[#883545] uppercase tracking-[0.4em] mb-4"
      >
        Preparando Experiência
      </motion.p>
      <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
          className="h-full bg-[#883545]"
        />
      </div>
    </div>
  </motion.div>
);

// --- Componente de Login ---
const LoginView = ({ onLogin, logo, companyName }: { onLogin: (user: any) => void, logo?: string, companyName: string, key?: string }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    // Usa as credenciais salvas no perfil (que podem ser alteradas nas configurações)
    const savedUser = JSON.parse(localStorage.getItem('wedding_user') || '{}');
    const validEmail = savedUser.email || 'rodrigoindalecio@hotmail.com';
    const validPass = savedUser.password || '12345678';

    setTimeout(() => {
      if (email === validEmail && password === validPass) {
        onLogin({
          ...savedUser,
          email: email
        });
      } else {
        setError('E-mail ou senha incorretos. Tente novamente.');
        setIsLoggingIn(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FDF8F8] flex items-center justify-center p-6 lg:p-10 relative overflow-hidden w-full">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#883545]/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 opacity-60" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#F59E42]/5 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{
          opacity: 1,
          y: 0,
          x: error ? [0, -10, 10, -10, 10, 0] : 0
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          x: { duration: 0.4 }
        }}
        className="w-full max-w-md bg-white/80 backdrop-blur-3xl rounded-[3.5rem] p-10 lg:p-14 shadow-[0_32px_120px_-20px_rgba(136,53,69,0.15)] border border-white/50 relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="size-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-[#883545]/10 border border-[#883545]/5 overflow-hidden p-5 mx-auto mb-8"
          >
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Heart className="text-[#883545] w-10 h-10" />
            )}
          </motion.div>

          <div className="space-y-1">
            <h2 className="text-[10px] font-black text-[#883545]/60 uppercase tracking-[0.3em]">{companyName}</h2>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic leading-tight">Acesso Premium</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Gestão Estratégica</p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
          >
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-xs font-bold text-red-600 uppercase tracking-tight leading-tight">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">E-mail Corporativo</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-transform group-focus-within:scale-110">
                <Mail className="w-4 h-4 text-[#883545]/40 group-focus-within:text-[#883545] transition-colors" />
              </div>
              <input
                type="email"
                placeholder="rodrigoindalecio@hotmail.com"
                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#883545]/5 focus:border-[#883545]/20 focus:bg-white transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Chave de Acesso</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-transform group-focus-within:scale-110">
                <Lock className="w-4 h-4 text-[#883545]/40 group-focus-within:text-[#883545] transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className="w-full pl-14 pr-14 py-5 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#883545]/5 focus:border-[#883545]/20 focus:bg-white transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              disabled={isLoggingIn}
              className="w-full py-5 bg-[#883545] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(136,53,69,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 relative overflow-hidden group disabled:opacity-90"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              {isLoggingIn ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full relative z-10"
                />
              ) : (
                <ShieldCheck className="w-5 h-5 relative z-10" />
              )}
              <span className="relative z-10">ENTRAR NO PORTAL</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-4">
            <Sparkles className="w-3 h-3 text-[#F59E42]" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistema Seguro & Criptografado</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DashboardView = ({ stats, payments, brides, onViewAll, filterYear, setFilterYear, filterMonth, setFilterMonth, settings, userProfile }: { stats: DashboardStats | null, payments: Payment[], brides: Bride[], onViewAll: () => void, filterYear: string, setFilterYear: (y: string) => void, filterMonth: string, setFilterMonth: (m: string) => void, settings: AppSettings, key?: string, userProfile: any }) => {
  const currentYear = new Date().getFullYear();
  // --- Mapa de Ocupação de Agenda ---
  // --- Forecast de Faturamento Projetado ---
  const today = new Date();
  const forecastContratos = brides.filter(b => {
    if (!b.event_date) return false;
    const eventDate = new Date(b.event_date);
    // Deve ser no futuro e estar ativo/concluído
    if (!(eventDate > today && (b.status === 'Ativa' || b.status === 'Concluído'))) return false;

    // Deve respeitar o filtro de ano e mês
    const year = eventDate.getFullYear();
    const month = eventDate.getMonth() + 1;
    if (filterMonth === 'all') return String(year) === filterYear;
    return String(year) === filterYear && String(month) === filterMonth;
  });
  const forecastValor = forecastContratos.reduce((sum, b) => sum + (b.contract_value || 0), 0);

  // Extrai dinamicamente todos os anos em que existem eventos (no mínimo 2024 a 2026)
  const availableYears = Array.from(new Set([
    2024, 2025, 2026,
    ...brides.filter(b => String(b.id) !== '58').map(b => {
      if (!b.event_date) return null;
      const d = String(b.event_date).split('T')[0];
      const y = parseInt(d.split('-')[0]) || parseInt(d.split('/')[2]);
      return y;
    }).filter(y => y !== null && !isNaN(y))
  ])).sort((a, b) => Number(a) - Number(b));
  const anosAgenda = ['2026', '2027', '2028'];
  const eventosPorAno = anosAgenda.map(ano =>
    brides.filter(b => b.event_date && b.event_date.startsWith(ano) && (b.status === 'Ativa' || b.status === 'Concluído')).length
  );

  const [showGrowthDetail, setShowGrowthDetail] = useState(false);
  const [showPendingDetail, setShowPendingDetail] = useState(false);
  const [showContractsModal, setShowContractsModal] = useState(false);
  const [showCancellationsModal, setShowCancellationsModal] = useState(false);

  if (!stats) return <div className="flex items-center justify-center h-64 text-slate-400 font-medium italic">Carregando painel...</div>;

  const maxValRaw = Math.max(...(stats.chartData?.map(d => Math.max(d.revenue, d.expenses)) || [1]), 1);
  const maxVal = maxValRaw * 1.45; // 45% de margem no topo para caber os valores verticais

  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const periodLabel = filterMonth === 'all' ? `Ano ${filterYear}` : `${months.find(m => m.value === filterMonth)?.label} ${filterYear}`;

  // --- Revenue Mix (Rosca) ---
  // --- Conversão de Novos Contratos ---
  const yearsToCompare = [Number(filterYear), Number(filterYear) + 1, Number(filterYear) + 2];
  const yearlyContracts = yearsToCompare.reduce((acc, year) => {
    acc[year] = brides.filter(b => b.created_at && new Date(b.created_at).getFullYear() === year).length;
    return acc;
  }, {} as any);

  const yearlyCancellations = yearsToCompare.reduce((acc, year) => {
    acc[year] = brides.filter(b => (b.status || '').toLowerCase() === 'cancelado' && b.event_date && b.event_date.startsWith(String(year))).length;
    return acc;
  }, {} as any);

  const novosContratos = brides.filter(b => {
    if (!b.created_at) return false;
    const created = new Date(b.created_at);
    const year = created.getFullYear();
    const month = created.getMonth() + 1;
    if (filterMonth === 'all') return String(year) === filterYear;
    return String(year) === filterYear && String(month) === filterMonth;
  }).length;
  // Agrupa contratos ativos/concluídos do período por tipo de serviço
  const contractsInPeriod = brides.filter(b => {
    if (!b.service_type) return false;
    if (b.status !== 'Ativa' && b.status !== 'Concluído') return false;
    const eventDate = b.event_date ? new Date(b.event_date) : null;
    if (!eventDate) return false;
    const year = eventDate.getFullYear();
    const month = eventDate.getMonth() + 1;
    if (filterMonth === 'all') return String(year) === filterYear;
    return String(year) === filterYear && String(month) === filterMonth;
  });
  const mixMap = new Map();
  contractsInPeriod.forEach(b => {
    const key = b.service_type || 'Outro';
    mixMap.set(key, (mixMap.get(key) || 0) + (b.contract_value || 0));
  });
  const mixLabels = Array.from(mixMap.keys());
  const mixData = Array.from(mixMap.values());
  const mixColors = [
    '#883545', '#F59E42', '#4F46E5', '#10B981', '#F43F5E', '#FACC15', '#6366F1', '#A21CAF', '#0EA5E9', '#F472B6', '#22D3EE', '#A3E635'
  ];

  // --- Performance Reports: Serviço e Parceiro ---
  // 1. Serviço mais vendido (Baseado no volume de contratos ativos/concluídos no período)
  const serviceCounts = new Map();
  contractsInPeriod.forEach(b => {
    const type = b.service_type || 'Outro';
    serviceCounts.set(type, (serviceCounts.get(type) || 0) + 1);
  });
  let bestSellingService = 'N/A';
  let bestSellingCount = 0;
  serviceCounts.forEach((count, type) => {
    if (count > bestSellingCount) {
      bestSellingCount = count;
      bestSellingService = type;
    }
  });

  // 2. Parceiro que mais gera BV (Baseado nos pagamentos da conta BV - ID 58)
  const bvPayments = payments.filter(p =>
    p.bride_id === 58 &&
    (p.status || '').trim().toLowerCase() === 'pago'
  );

  // Filtrar payments pelo ano/mês se necessário (padrão é o ano inteiro se filterMonth for all)
  const bvInPeriod = bvPayments.filter(p => {
    const d = p.payment_date ? new Date(p.payment_date) : null;
    if (!d) return false;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    if (filterMonth === 'all') return String(year) === filterYear;
    return String(year) === filterYear && String(month) === filterMonth;
  });

  const bvMap = new Map();
  bvInPeriod.forEach(p => {
    let partner = (p as any).partner_name;
    if (!partner) {
      partner = settings.partners.find(name => p.description?.includes(name)) || 'Outros';
    }
    bvMap.set(partner, (bvMap.get(partner) || 0) + (Number(p.amount_paid) || 0));
  });

  let topBVPartner = 'N/A';
  let topBVAmount = 0;
  bvMap.forEach((amount, partner) => {
    if (amount > topBVAmount) {
      topBVAmount = amount;
      topBVPartner = partner;
    }
  });

  const yearlyRevenueForFilter = payments.filter(p => {
    const d = p.payment_date ? new Date(p.payment_date) : null;
    return d && d.getFullYear() === Number(filterYear) && (p.status || '').trim().toLowerCase() === 'pago';
  }).reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

  // Ghost Lines: comparativo de receita por mês para o ano atual + 1 anterior
  const ghostYears = [String(currentYear - 1), String(currentYear)];
  const ghostMonths = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const ghostColors = ["#F59E42", "#883545"]; // Laranja, Vinho
  const ghostDatasets = ghostYears.map((year, idx) => {
    const data = ghostMonths.map((month, mIdx) => {
      const monthNum = mIdx + 1;
      const total = payments
        .filter(p => {
          const d = p.payment_date ? new Date(p.payment_date) : null;
          return d && d.getFullYear() === Number(year) && d.getMonth() + 1 === monthNum && (p.status || '').trim().toLowerCase() === 'pago';
        })
        .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
      return total > 0 ? total : null;
    });
    return {
      label: year,
      data,
      borderColor: ghostColors[idx],
      borderDash: year !== String(currentYear) ? [6, 4] : undefined,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 6,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 lg:space-y-8 pb-20 lg:pb-0"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <Header title={`Olá, ${userProfile.name.split(' ')[0]}! 👋`} subtitle="Aqui está o resumo estratégico da sua assessoria." />

        {/* Period Filter Bar */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#883545]/10 shadow-sm">
          {/* Goal Indicator (Desktop) */}
          {filterMonth === 'all' && (
            <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-xl mr-2">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Meta {filterYear}</span>
                <span className="text-xs font-black text-[#883545]">R$ {settings.goals.annualRevenue.toLocaleString('pt-BR')}</span>
              </div>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (yearlyRevenueForFilter / settings.goals.annualRevenue) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-emerald-600">
                {((yearlyRevenueForFilter / settings.goals.annualRevenue) * 100).toFixed(0)}%
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 px-2 border-r border-slate-100">
            <Calendar className="size-4 text-[#883545]/40" />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer text-slate-700"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 px-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer text-slate-700"
            >
              <option value="all">Ano Inteiro</option>
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Left Side: All 12 Stats Cards */}
        <div className="lg:col-span-3 space-y-4 lg:space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            <StatCard
              label={`Eventos Ativos (${filterMonth === 'all' ? filterYear : months.find(m => m.value === filterMonth)?.label})`}
              value={stats.activeBrides.toString()}
              icon={Users}
              color="text-[#883545]"
            >
              {stats.activeBridesBreakdown && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                    <span className="text-slate-400">{stats.activeBridesBreakdown.label1 || '2026'}:</span>
                    <span className="text-[#883545] font-black">{stats.activeBridesBreakdown.year1 ?? stats.activeBridesBreakdown.year2026}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                    <span className="text-slate-400">{stats.activeBridesBreakdown.label2 || '2027'}:</span>
                    <span className="text-[#883545] font-black">{stats.activeBridesBreakdown.year2 ?? stats.activeBridesBreakdown.year2027}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                    <span className="text-slate-400">{stats.activeBridesBreakdown.label3 || '2028'}:</span>
                    <span className="text-[#883545] font-black">{stats.activeBridesBreakdown.year3 ?? stats.activeBridesBreakdown.year2028}</span>
                  </div>
                </div>
              )}
            </StatCard>
            <StatCard label={`Receita (${periodLabel})`} value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} trend={`${stats.revenueTrend} vs anterior`} color="text-emerald-500" />
            <StatCard label={`Despesas (${periodLabel})`} value={`R$ ${stats.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} trend={`${stats.expensesTrend} vs anterior`} color="text-rose-500" />
            <div
              onClick={() => setShowContractsModal(true)}
              className="cursor-pointer group relative touch-none select-none transition-transform active:scale-95"
            >
              <StatCard
                label="Novos Contratos"
                value={novosContratos.toString()}
                icon={Plus}
                color="text-emerald-700"
              >
                <div className="flex gap-2.5 mt-1.5 pt-1.5 border-t border-slate-50">
                  {yearsToCompare.map(year => (
                    <div key={year} className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{year}</span>
                      <span className={`text-[11px] font-black ${String(year) === filterYear ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {yearlyContracts[year]}
                      </span>
                    </div>
                  ))}
                </div>
              </StatCard>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            <StatCard label="Ticket Médio" value={`R$ ${stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={CircleDollarSign} color="text-indigo-500" />
            <StatCard label="Eficiência Lucro" value={stats.efficiency} icon={Heart} color="text-pink-500" />
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowGrowthDetail(!showGrowthDetail);
              }}
              className="cursor-pointer group relative touch-none select-none transition-transform active:scale-95"
            >
              <StatCard
                label="Evolução Comercial"
                value={stats.growthYoY}
                icon={TrendingUp}
                color="text-blue-500"
              >
                <AnimatePresence>
                  {showGrowthDetail && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 overflow-hidden pt-1 border-t border-slate-50 mt-1"
                    >
                      {stats.growthYoYBreakdown ? (
                        <>
                          <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                            <span className="text-slate-400">{filterYear}:</span>
                            <span className="text-blue-600 font-black">R$ {stats.growthYoYBreakdown.current.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                            <span className="text-slate-400">{Number(filterYear) - 1}:</span>
                            <span className="text-blue-600/60 font-black">R$ {stats.growthYoYBreakdown.previous.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-[9px] font-bold text-slate-400 italic text-center py-1">
                          Reinicie o servidor para carregar detalhes...
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {!showGrowthDetail && (
                  <div className="text-[8px] font-black text-blue-400/50 uppercase tracking-widest text-center mt-1 group-hover:text-blue-500 transition-colors">
                    Clique para detalhes
                  </div>
                )}
              </StatCard>
            </div>
            <StatCard label="Serviço +Vendido" value={bestSellingService} icon={Award} color="text-amber-500" />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            <StatCard
              label="Melhor Parceiro BV"
              value={topBVPartner}
              icon={Trophy}
              color="text-[#883545]"
            >
              <div className="text-[11px] font-bold text-[#883545]/60 mt-1">
                R$ {topBVAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gerados
              </div>
            </StatCard>
            <StatCard label="Média Mensal" value={`R$ ${((stats.chartData && stats.chartData.length > 0) ? (stats.chartData.reduce((sum, d) => sum + d.revenue, 0) / stats.chartData.length) : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Calendar} color="text-slate-600" />
            <div
              onClick={() => setShowCancellationsModal(true)}
              className="cursor-pointer group relative touch-none select-none transition-transform active:scale-95"
            >
              <StatCard
                label="Cancelamentos"
                value={stats.cancellations.count.toString()}
                icon={UserMinus}
                color="text-rose-600"
              >
                <div className="flex gap-2.5 mb-2">
                  {yearsToCompare.map(year => (
                    <div key={year} className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{year}</span>
                      <span className={`text-[11px] font-black ${String(year) === filterYear ? 'text-rose-600' : 'text-slate-400'}`}>
                        {yearlyCancellations[year]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 pt-1.5 border-t border-slate-50">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">FINA:</span>
                    <span className="text-emerald-600">R$ {stats.cancellations.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">PERDA:</span>
                    <span className="text-rose-500">R$ {stats.cancellations.lost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </StatCard>
            </div>
            <StatCard label="Faturamento Projetado" value={`R$ ${forecastValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={TrendingUp} color="text-blue-700" />
          </div>
        </div>

        {/* Right Side: Alertas de Pendência */}
        <div className="order-first lg:order-last">
          <div
            onClick={() => setShowPendingDetail(!showPendingDetail)}
            className="bg-white p-4 lg:p-6 rounded-[2rem] shadow-sm border border-[#883545]/10 h-full cursor-pointer hover:border-[#883545]/30 transition-all select-none group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-sm transition-transform group-hover:scale-110">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">Alertas de Pendência</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Próximos recebimentos</p>
                </div>
              </div>
              <motion.div animate={{ rotate: showPendingDetail ? 180 : 0 }} className="text-slate-300">
                <ChevronDown className="size-5" />
              </motion.div>
            </div>

            <div className="flex flex-col gap-4">
              {(() => {
                const pendentesBase = brides
                  .filter(b => b.status === 'Ativa' && Number(b.balance) > 1 && b.event_date)
                  .map(b => ({
                    id: b.id,
                    name: b.name,
                    balance: Number(b.balance),
                    eventDate: new Date(b.event_date),
                  }))
                  .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

                const pendentes = pendentesBase.slice(0, showPendingDetail ? 20 : 6);

                if (pendentes.length === 0) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                      <CircleDollarSign className="w-8 h-8 opacity-20 mb-2" />
                      <p className="text-xs italic font-bold">Nenhum recebimento pendente.</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="flex flex-col gap-4">
                      {pendentes.map((b) => {
                        const today = new Date();
                        const daysLeft = Math.ceil((b.eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const vencendo = daysLeft <= 10 && daysLeft >= 0;
                        return (
                          <div key={b.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-none group">
                            <div className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl shadow-sm shrink-0 leading-none ${vencendo ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600'}`}>
                              <span className="text-lg font-black">{Math.max(daysLeft, 0)}</span>
                              <span className="text-[7px] font-black uppercase tracking-tighter opacity-80 mt-0.5">DIAS</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black truncate text-slate-800 mb-1 uppercase tracking-tighter">{b.name}</p>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">A PAGAR:</p>
                                <p className="text-sm font-black text-[#883545]">R$ {b.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                            {vencendo && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span>}
                          </div>
                        );
                      })}
                    </div>

                    {!showPendingDetail && pendentesBase.length > 3 && (
                      <div className="text-[9px] font-black text-[#883545]/60 text-center uppercase tracking-[0.2em] pt-2 animate-bounce">
                        + {pendentesBase.length - 3} alertas ocultos
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Gráfico Mapa de Ocupação de Agenda */}
        <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border border-[#883545]/10 flex flex-col items-center justify-center">
          <h3 className="text-lg lg:text-xl font-bold mb-4">Ocupação de Agenda</h3>
          <OcupacaoAgendaBarChart
            labels={anosAgenda}
            values={eventosPorAno}
            color="#883545"
            title="Eventos Fechados por Ano"
          />
        </div>
        {/* Gráfico de Rosca: Mix de Receita por Serviço */}
        <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border border-[#883545]/10 flex flex-col items-center justify-center">
          <h3 className="text-lg lg:text-xl font-bold mb-4">Mix de Receita por Serviço</h3>
          {mixLabels.length > 0 ? (
            <DoughnutChart
              labels={mixLabels}
              data={mixData}
              colors={mixLabels.map((_, i) => mixColors[i % mixColors.length])}
              title="Receita por Tipo de Serviço"
            />
          ) : (
            <div className="text-slate-400 text-sm italic py-12">Sem contratos no período selecionado.</div>
          )}
        </div>

        {/* Gráfico Volume vs Valor por Tipo de Serviço */}
        <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border border-[#883545]/10 flex flex-col items-center justify-center">
          <h3 className="text-lg lg:text-xl font-bold mb-4">Volume vs Valor por Tipo</h3>
          {mixLabels.length > 0 ? (
            <VolumeValorBarChart
              labels={mixLabels}
              volumes={mixLabels.map(label => contractsInPeriod.filter(b => b.service_type === label).length)}
              valores={mixLabels.map(label => contractsInPeriod.filter(b => b.service_type === label).reduce((sum, b) => sum + (b.contract_value || 0), 0))}
              colors={["#F59E42", "#883545"]}
              title="Quantidade x Valor por Serviço"
            />
          ) : (
            <div className="text-slate-400 text-sm italic py-12">Sem contratos no período selecionado.</div>
          )}
        </div>
        <div className="lg:col-span-4 bg-white p-4 lg:p-8 rounded-xl shadow-sm border border-[#883545]/10 flex flex-col">
          <div className="flex justify-between items-center mb-6 lg:mb-8">
            <div>
              <h3 className="text-lg lg:text-xl font-bold">Fluxo de Caixa</h3>
              <p className="text-slate-500 text-xs lg:text-sm">Comparativo mensal: Receitas vs Despesas</p>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] flex items-end justify-around gap-1 lg:gap-4 px-2 lg:px-4">
            {(stats.chartData || []).map((data, i) => (
              <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="flex justify-center gap-1 lg:gap-2 items-end h-[180px] lg:h-[220px] mb-12 lg:mb-16 relative">
                  {/* Revenue Bar */}
                  <div className="relative flex flex-col items-center justify-end h-full w-3 lg:w-6 group/rev">
                    {data.revenue > 0 && (
                      <div
                        className="absolute whitespace-nowrap text-[8px] lg:text-[10px] font-black text-[#883545] transition-all duration-1000"
                        style={{
                          bottom: `${(data.revenue / maxVal) * 100}%`,
                          paddingBottom: '6px',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'left bottom',
                          left: '50%'
                        }}
                      >
                        R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                    <div
                      className="w-full bg-[#883545] rounded-t-mg lg:rounded-t-lg transition-all duration-1000 shadow-sm"
                      style={{ height: `${Math.max((data.revenue / maxVal) * 100, 4)}%` }}
                    />
                  </div>
                  {/* Expenses Bar */}
                  <div className="relative flex flex-col items-center justify-end h-full w-3 lg:w-6 group/exp">
                    {data.expenses > 0 && (
                      <div
                        className="absolute whitespace-nowrap text-[8px] lg:text-[10px] font-black text-slate-400 transition-all duration-1000"
                        style={{
                          bottom: `${(data.expenses / maxVal) * 100}%`,
                          paddingBottom: '6px',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'left bottom',
                          left: '50%'
                        }}
                      >
                        R$ {data.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                    <div
                      className="w-full bg-slate-200 rounded-t-mg lg:rounded-t-lg transition-all duration-1000 shadow-sm"
                      style={{ height: `${Math.max((data.expenses / maxVal) * 100, 2)}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] lg:text-xs font-bold text-slate-400 mt-1">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ghost Lines Chart: Comparativo de anos */}
        <div className="lg:col-span-4 bg-white p-4 lg:p-8 rounded-xl shadow-sm border border-[#883545]/10 flex flex-col">
          <h3 className="text-lg lg:text-xl font-bold mb-4">Comparativo de Receita por Ano</h3>
          <GhostLinesChart
            labels={ghostMonths}
            datasets={ghostDatasets}
            title="Receita Mensal por Ano"
          />
        </div>
      </div>

      <ContractsModal
        isOpen={showContractsModal}
        onClose={() => setShowContractsModal(false)}
        brides={brides}
        months={months}
      />
      <CancellationsModal
        isOpen={showCancellationsModal}
        onClose={() => setShowCancellationsModal(false)}
        brides={brides}
        filterYear={filterYear}
      />
    </motion.div>
  );
};

// --- Cancellations Modal ---
const CancellationsModal = ({ isOpen, onClose, brides, filterYear }: { isOpen: boolean, onClose: () => void, brides: Bride[], filterYear: string }) => {
  const canceledBrides = brides.filter(b => (b.status || '').toLowerCase() === 'cancelado' && b.event_date && b.event_date.startsWith(filterYear));

  const totalFina = canceledBrides.reduce((sum, b) => sum + (Number(b.contract_value) || 0), 0);
  const totalOriginal = canceledBrides.reduce((sum, b) => sum + (Number(b.original_value) || 0), 0);
  const totalPerda = totalOriginal - totalFina;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 lg:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col"
          >
            <div className="bg-rose-50 p-3 lg:p-4 border-b border-rose-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-rose-600 text-white rounded-lg flex items-center justify-center">
                  <UserMinus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm lg:text-lg font-bold text-slate-800 leading-tight">Detahes de Cancelamentos</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Eventos em {filterYear}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="flex-1 overflow-auto p-3 lg:p-4">
              {canceledBrides.length > 0 ? (
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Cliente</th>
                      <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Data Evento</th>
                      <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Original</th>
                      <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Multa (FINA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {canceledBrides.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-1 px-3 text-[10px] font-bold text-slate-800 uppercase tracking-tighter">{b.name}</td>
                        <td className="py-1 px-3 text-[10px] font-bold text-slate-500">{b.event_date ? new Date(b.event_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="py-1 px-3 text-[10px] font-black text-center text-slate-400">R$ {Number(b.original_value).toLocaleString('pt-BR')}</td>
                        <td className="py-1 px-3 text-[10px] font-black text-center text-emerald-600">R$ {Number(b.contract_value).toLocaleString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="z-20 bg-white sticky bottom-0">
                    <tr className="bg-slate-50 border-t-2 border-slate-100 text-xs font-black">
                      <td colSpan={2} className="py-2 px-3 text-slate-400 uppercase">Totais Anuais</td>
                      <td className="py-2 px-3 text-center text-slate-500 font-black">R$ {totalOriginal.toLocaleString('pt-BR')}</td>
                      <td className="py-2 px-3 text-center text-emerald-600 font-black">R$ {totalFina.toLocaleString('pt-BR')}</td>
                    </tr>
                    <tr className="bg-rose-600 text-white">
                      <td colSpan={3} className="py-2 px-3 text-[10px] font-black uppercase">Receita Perdida Total (PERDA)</td>
                      <td className="py-2 px-3 text-center text-sm font-black">R$ {totalPerda.toLocaleString('pt-BR')}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 italic text-sm">
                  Nenhum cancelamento encontrado para o ano de {filterYear}.
                </div>
              )}
            </div>

            <div className="p-2 bg-slate-50 text-center shrink-0 border-t border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic tracking-[0.1em]">Análise baseada em eventos com status "Cancelado" e multa registrada</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ContractsModal = ({ isOpen, onClose, brides, months }: { isOpen: boolean, onClose: () => void, brides: Bride[], months: any[] }) => {
  const years = [2024, 2025, 2026];
  const tableData = months.map(m => {
    const monthIndex = Number(m.value);
    const row: any = { label: m.label, values: {} };
    years.forEach(year => {
      row.values[year] = brides.filter(b => b.created_at && new Date(b.created_at).getFullYear() === year && new Date(b.created_at).getMonth() + 1 === monthIndex).length;
    });
    return row;
  });
  const totals = years.reduce((acc: any, year) => {
    acc[year] = tableData.reduce((sum, row) => sum + (row.values[year] || 0), 0);
    return acc;
  }, {});
  const averages = years.reduce((acc: any, year) => {
    acc[year] = (totals[year] / 12).toFixed(1);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 lg:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-[#883545]/10 flex flex-col"
          >
            <div className="bg-[#883545]/5 p-3 lg:p-4 border-b border-[#883545]/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-[#883545] text-white rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm lg:text-lg font-bold text-slate-800 leading-tight">Contagem de Novos Contratos</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Comparativo Anual x Mensal</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="flex-1 overflow-hidden p-3 lg:p-4">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Mês</th>
                    {years.map(year => (
                      <th key={year} className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">{year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tableData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-1 px-3 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{row.label}</td>
                      {years.map(year => (
                        <td key={year} className={`py-1 px-3 text-xs font-black text-center ${row.values[year] > 0 ? 'text-[#883545]' : 'text-slate-300'}`}>
                          {row.values[year] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="z-20 bg-white">
                  <tr className="bg-slate-50/80 border-t-2 border-slate-100">
                    <td className="py-2 px-3 text-[10px] font-black text-[#883545] uppercase">Total Geral</td>
                    {years.map(year => (
                      <td key={year} className="py-2 px-3 text-sm font-black text-[#883545] text-center">{totals[year]}</td>
                    ))}
                  </tr>
                  <tr className="bg-[#883545] text-white">
                    <td className="py-2 px-3 text-[10px] font-black uppercase">Média Mensal</td>
                    {years.map(year => (
                      <td key={year} className="py-2 px-3 text-sm font-black text-center">{averages[year].replace('.', ',')}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-2 bg-slate-50 text-center shrink-0 border-t border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic tracking-[0.1em]">Valores baseados na data de criação do registro no sistema</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Brides View ---

const DistratoModal = ({ isOpen, onClose, onConfirm, bride, payments, goals }: { isOpen: boolean, onClose: () => void, onConfirm: (fine: number) => void, bride: Bride | null, payments: Payment[], goals: AppSettings['goals'] }) => {
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

const BridesView = ({ brides, payments, onEdit, onUpdateStatus, onDelete, settings }: { brides: Bride[], payments: Payment[], onEdit: (bride: Bride) => void, onUpdateStatus: (id: number, status: string, options?: any) => void, onDelete: (id: number) => void, settings: AppSettings, key?: string }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Ativa');
  const [yearFilter, setYearFilter] = useState('Todos');
  const [balanceFilter, setBalanceFilter] = useState('Todos');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isDistratoModalOpen, setIsDistratoModalOpen] = useState(false);
  const [brideForDistrato, setBrideForDistrato] = useState<Bride | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
                      placeholder="Nome ou email..."
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
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('Ativa'); setYearFilter('Todos'); setBalanceFilter('Todos'); }}
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
              placeholder="Nome ou email..."
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
        <button
          onClick={() => { setSearchTerm(''); setStatusFilter('Ativa'); setYearFilter('Todos'); setBalanceFilter('Todos'); }}
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
              <div key={bride.id} className={`${settings.ui.compactMode ? 'p-3' : 'p-5'} bg-white rounded-2xl border border-[#883545]/10 shadow-sm space-y-4 relative group`}>
                <div className={`absolute top-0 right-0 w-1.5 h-full rounded-r-2xl ${bride.status === 'Ativa' ? 'bg-emerald-500' : bride.status === 'Concluído' ? 'bg-blue-400' : bride.status === 'Inativa' ? 'bg-slate-300' : 'bg-rose-500'}`} />

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
                        <button onClick={() => { setBrideForDistrato(bride); setIsDistratoModalOpen(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
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
                    <tr key={bride.id} className={`${settings.ui.compactMode ? 'hover:bg-[#883545]/5' : 'hover:bg-[#883545]/5'} transition-colors group`}>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'}`}>
                        <div className="flex flex-col">
                          <span className={`${settings.ui.compactMode ? 'text-xs' : 'text-sm'} font-extrabold text-slate-900 group-hover:text-[#883545] transition-colors`}>{bride.name}</span>
                          <span className="text-[10px] text-slate-500">{bride.email}</span>
                        </div>
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'}`}>
                        <div className="flex items-center gap-2 text-slate-700 text-xs">
                          <Calendar className={`${settings.ui.compactMode ? 'w-3 h-3' : 'w-4 h-4'} text-slate-400`} />
                          {bride.event_date && new Date(bride.event_date).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'} text-xs font-bold text-slate-600`}>
                        {bride.service_type || 'Não definido'}
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'} text-xs font-black text-slate-700`}>
                        {bride.status === 'Cancelado' && bride.original_value > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-rose-600">Multa: R$ {bride.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-slate-400 line-through font-medium">Orig: R$ {bride.original_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ) : (
                          <>R$ {(bride.contract_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                        )}
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'} text-xs font-bold text-emerald-600`}>
                        R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`${settings.ui.compactMode ? 'px-4 py-2' : 'px-4 lg:px-6 py-4'} text-xs font-black text-[#883545]`}>
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
        goals={settings.goals}
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

const FinanceView = ({ payments, expenses, brides, stats, settings, onAddPayment, onAddExpense }: { payments: Payment[], expenses: Expense[], brides: Bride[], stats: DashboardStats | null, settings: AppSettings, onAddPayment: (p: any) => void, onAddExpense: (e: any) => void, key?: string }) => {
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  // Filtros para lançamentos recentes
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [dateFilter, setDateFilter] = useState('Todos');
  const [partnerFilter, setPartnerFilter] = useState('Todos');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  // Filtragem dos lançamentos recentes
  const allItems = [
    ...payments.map(p => ({ ...p, isExpense: false })),
    ...expenses.map(e => ({ ...e, bride_name: `Despesa: ${e.category}`, isExpense: true, amount_paid: e.amount, payment_date: e.date }))
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
      // Filtro de data
      let dateMatch = true;
      const itemDate = new Date(item.payment_date);
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
          const start = new Date(customStart);
          const end = new Date(customEnd);
          dateMatch = itemDate >= start && itemDate <= end;
        } else {
          dateMatch = true;
        }
      }
      return searchMatch && typeMatch && dateMatch;
    })
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    .slice(0, 30);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  const totalRecebidoAno = payments
    .filter(p => {
      const isPaid = (p.status || '').trim().toLowerCase() === 'pago';
      const year = p.payment_date ? new Date(p.payment_date).getFullYear() : null;
      return isPaid && year === currentYear;
    })
    .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

  const totalDespesasAno = expenses
    .filter(e => {
      const year = e.date ? new Date(e.date).getFullYear() : null;
      return year === currentYear;
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalPendenteAno = brides
    .filter(b => {
      const isActiveOrCancelled = (b.status === 'Ativa' || b.status === 'Cancelado') && b.id !== 58;
      const year = b.event_date ? new Date(b.event_date).getFullYear() : null;
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
        {isFinanceModalOpen && (
          <FinanceModal
            isOpen={isFinanceModalOpen}
            onClose={() => setIsFinanceModalOpen(false)}
            brides={brides}
            partners={settings.partners}
            onAddPayment={onAddPayment}
            onAddExpense={onAddExpense}
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
                      {settings.partners.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <button
                  onClick={() => { setSearchTerm(''); setTypeFilter('Todos'); setDateFilter('Todos'); setPartnerFilter('Todos'); setCustomStart(''); setCustomEnd(''); }}
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
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition-all"><Search className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition-all"><MoreVertical className="w-5 h-5" /></button>
              </div>
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
                ))
              )}
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
                          {item.payment_date && new Date(item.payment_date).toLocaleDateString('pt-BR')}
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

const FinanceModal = ({ isOpen, onClose, brides, partners, onAddPayment, onAddExpense }: { isOpen: boolean, onClose: () => void, brides: Bride[], partners: string[], onAddPayment: (p: any) => void, onAddExpense: (e: any) => void }) => {
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
    onClose();
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
              <Plus className={`w-6 h-6 p-1 rounded-full ${type === 'entrada' ? 'bg-[#883545] text-white' : 'bg-rose-500 text-white'}`} />
              {type === 'entrada' ? 'Nova Receita' : 'Nova Despesa'}
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
                          {b.name} {b.status === 'Cancelado' ? '(Cancelado/Multa)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parceiro / Fornecedor</label>
                  <select
                    required
                    value={formData.partner_name}
                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                    className="w-full rounded-xl border-none bg-emerald-50/30 text-sm p-4 focus:ring-2 focus:ring-emerald-500/20 font-bold shadow-inner"
                  >
                    <option value="">Selecione um parceiro...</option>
                    {partners.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="custom">+ Outro (Digitar na descrição)</option>
                  </select>
                </div>
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
              {type === 'entrada' ? 'LANÇAR RECEITA' : 'REGISTRAR DESPESA'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const SettingsView = ({ settings, setSettings, data, userProfile, setUserProfile }: { settings: AppSettings, setSettings: (s: AppSettings) => void, data: { brides: Bride[], payments: Payment[], expenses: Expense[] }, userProfile: any, setUserProfile: (u: any) => void, key?: string }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'goals' | 'system'>('profile');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPass, setNewPass] = useState('');

  const handleExport = () => {
    const backup = {
      settings,
      data,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wedding_adviser_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addItem = (list: 'services' | 'partners', value: string) => {
    if (!value) return;
    setSettings({ ...settings, [list]: [...settings[list], value] });
  };

  const removeItem = (list: 'services' | 'partners', index: number) => {
    const newList = [...settings[list]];
    newList.splice(index, 1);
    setSettings({ ...settings, [list]: newList });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 pb-20 lg:pb-0"
    >
      <Header title="Configurações" subtitle="Gerencie as preferências da sua conta e do sistema." />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="lg:w-64 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-[#883545] text-white shadow-lg' : 'bg-white text-slate-600 border border-[#883545]/5 hover:bg-slate-50'}`}
          >
            <Users className="w-5 h-5" /> Perfil
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'services' ? 'bg-[#883545] text-white shadow-lg' : 'bg-white text-slate-600 border border-[#883545]/5 hover:bg-slate-50'}`}
          >
            <Plus className="w-5 h-5" /> Serviços & Parceiros
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'goals' ? 'bg-[#883545] text-white shadow-lg' : 'bg-white text-slate-600 border border-[#883545]/5 hover:bg-slate-50'}`}
          >
            <TrendingUp className="w-5 h-5" /> Metas & Regras
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'system' ? 'bg-[#883545] text-white shadow-lg' : 'bg-white text-slate-600 border border-[#883545]/5 hover:bg-slate-50'}`}
          >
            <Settings className="w-5 h-5" /> Sistema
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white p-6 lg:p-10 rounded-3xl border border-[#883545]/10 shadow-sm min-h-[500px]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Perfil da Assessoria</h3>
                <button
                  onClick={() => {
                    localStorage.setItem('wedding_settings', JSON.stringify(settings));
                    alert('Configurações de perfil salvas com sucesso! ✓');
                  }}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                >
                  Salvar Perfil
                </button>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 flex items-center gap-6">
                <div className="size-20 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center overflow-hidden relative group">
                  {settings.profile.logo ? (
                    <img src={settings.profile.logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Heart className="w-8 h-8 text-slate-200" />
                  )}
                  <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Plus className="w-5 h-5" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSettings({ ...settings, profile: { ...settings.profile, logo: reader.result as string } });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-700">Logo da Assessoria</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recomendado: PNG ou JPG (quadrado)</p>
                  {settings.profile.logo && (
                    <button
                      onClick={() => setSettings({ ...settings, profile: { ...settings.profile, logo: '' } })}
                      className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-2 hover:underline"
                    >
                      Remover Logo
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Assessoria</label>
                  <input
                    type="text"
                    value={settings.profile.name}
                    onChange={e => setSettings({ ...settings, profile: { ...settings.profile, name: e.target.value } })}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slogan / Descrição Curta</label>
                  <input
                    type="text"
                    value={settings.profile.description}
                    onChange={e => setSettings({ ...settings, profile: { ...settings.profile, description: e.target.value } })}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-3">
                  <User className="text-[#883545] w-6 h-6" />
                  Perfil do Usuário
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail de Acesso</label>
                    <input
                      type="email"
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-6 lg:p-8 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-[#883545]/10 rounded-xl flex items-center justify-center text-[#883545]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Segurança da Conta</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Altere sua senha de acesso ao portal</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Senha</label>
                      <div className="relative group">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className="w-full p-4 pr-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#883545]/20 group-hover:border-[#883545]/20 transition-all outline-none"
                          placeholder="Min. 8 caracteres"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#883545] transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          if (newPass.length < 8) {
                            alert('A senha deve ter pelo menos 8 caracteres!');
                            return;
                          }
                          setUserProfile({ ...userProfile, password: newPass });
                          setNewPass('');
                          setShowNewPassword(false);
                          alert('Senha alterada com sucesso! ✓');
                        }}
                        className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-[#883545] transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Atualizar Senha
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-10">
              <section className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="p-1.5 bg-[#883545]/10 rounded-lg text-[#883545]">
                    <Plus className="w-4 h-4" />
                  </span>
                  Serviços Oferecidos
                </h3>
                <div className="flex gap-2">
                  <input
                    id="new-service"
                    type="text"
                    placeholder="Ex: Cerimonial Completo"
                    className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem('services', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('new-service') as HTMLInputElement;
                      addItem('services', input.value);
                      input.value = '';
                    }}
                    className="px-6 bg-[#883545] text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {settings.services.map((service, idx) => (
                    <span key={idx} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                      {service}
                      <button onClick={() => removeItem('services', idx)} className="hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                    <Users className="w-4 h-4" />
                  </span>
                  Parceiros Recorrentes (BV)
                </h3>
                <div className="flex gap-2">
                  <input
                    id="new-partner"
                    type="text"
                    placeholder="Ex: Floricultura Modelo"
                    className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem('partners', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('new-partner') as HTMLInputElement;
                      addItem('partners', input.value);
                      input.value = '';
                    }}
                    className="px-6 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {settings.partners.map((partner, idx) => (
                    <span key={idx} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                      {partner}
                      <button onClick={() => removeItem('partners', idx)} className="hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-8">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Metas & Regras Financeiras</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta de Faturamento Anual (R$)</label>
                  <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#883545]" />
                    <input
                      type="number"
                      value={settings.goals.annualRevenue}
                      onChange={e => setSettings({ ...settings, goals: { ...settings.goals, annualRevenue: Number(e.target.value) } })}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black shadow-inner"
                    />
                  </div>
                </div>
                {/* Removido Multa Geral Padrão pois a Regra de Escalonamento já cobre tudo */}
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Regra de Escalonamento (Sugestão Inteligente)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prazo Crítico (Dias)</label>
                    <input
                      type="number"
                      value={settings.goals.fineThresholdDays}
                      onChange={e => setSettings({ ...settings, goals: { ...settings.goals, fineThresholdDays: Number(e.target.value) } })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">% Longe do Evento</label>
                    <input
                      type="number"
                      value={settings.goals.fineEarlyPercent}
                      onChange={e => setSettings({ ...settings, goals: { ...settings.goals, fineEarlyPercent: Number(e.target.value) } })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">% Próximo ao Evento</label>
                    <input
                      type="number"
                      value={settings.goals.fineLatePercent}
                      onChange={e => setSettings({ ...settings, goals: { ...settings.goals, fineLatePercent: Number(e.target.value) } })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black shadow-inner"
                    />
                  </div>
                </div>
                <p className="text-[10px] font-medium text-slate-400 italic">
                  * Atualmente: {settings.goals.fineEarlyPercent}% se faltar mais de {settings.goals.fineThresholdDays} dias, senão {settings.goals.fineLatePercent}%.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-10">
              <section className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Preferências do Sistema</h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <LayoutDashboard className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700">Modo Compacto</p>
                      <p className="text-[10px] font-bold text-slate-400">Ver mais dados na mesma visualização</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, ui: { ...settings.ui, compactMode: !settings.ui.compactMode } })}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.ui.compactMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.ui.compactMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </section>

              <section className="space-y-6 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-black text-rose-800 uppercase tracking-widest">Backup & Segurança</h3>
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 space-y-4">
                  <p className="text-xs font-bold text-rose-900/60 leading-relaxed">
                    Exporte todos os seus dados (clientes, pagamentos, despesas e configurações) para um arquivo JSON. Recomendamos fazer um backup externo uma vez por mês.
                  </p>
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white text-rose-700 border border-rose-200 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-rose-100 transition-all"
                  >
                    <LogOut className="w-4 h-4 rotate-90" /> Exportar Todos os Dados
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </motion.div >
  );
};

const BrideModal = ({ isOpen, onClose, onSave, brideToEdit, serviceTypes }: { isOpen: boolean, onClose: () => void, onSave: (bride: any) => void, brideToEdit?: Bride | null, serviceTypes: string[] }) => {
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
                <select
                  required
                  className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-bold shadow-inner"
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                >
                  <option value="">Selecione o serviço...</option>
                  {serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('wedding_auth') === 'true');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('wedding_user');
    return saved ? JSON.parse(saved) : {
      name: 'Rodrigo Indalecio',
      email: 'rodrigoindalecio@hotmail.com',
      password: '12345678'
    };
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [brides, setBrides] = useState<Bride[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isBrideModalOpen, setIsBrideModalOpen] = useState(false);
  const [brideToEdit, setBrideToEdit] = useState<Bride | null>(null);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('wedding_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('wedding_auth', isAuthenticated.toString());
    localStorage.setItem('wedding_user', JSON.stringify(userProfile));
  }, [isAuthenticated, userProfile]);

  useEffect(() => {
    // Simulando carregamento inicial premium
    const timer = setTimeout(() => setIsInitialLoading(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('wedding_settings', JSON.stringify(settings));
  }, [settings]);

  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());

  // Reset scroll to top and filters when tab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Always reset dashboard to current period when entering the tab
    if (activeTab === 'dashboard') {
      setFilterYear(new Date().getFullYear().toString());
      setFilterMonth((new Date().getMonth() + 1).toString());
    }
  }, [activeTab]);

  const fetchData = async (year?: string, month?: string) => {
    try {
      const y = year || filterYear;
      const m = month || filterMonth;
      const [statsRes, bridesRes, paymentsRes, expensesRes] = await Promise.all([
        fetch(`/api/dashboard/stats?year=${y}&month=${m}`),
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
  }, [filterYear, filterMonth]);

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
      {isAuthenticated && (
        <aside className="hidden lg:flex w-72 bg-white border-r border-[#883545]/10 flex-col p-6 shadow-2xl shadow-[#883545]/5 z-20">
          <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
            <div className="size-12 bg-white rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-[#883545]/10 group-hover:rotate-6 transition-transform overflow-hidden border border-[#883545]/5">
              {settings.profile.logo ? (
                <img src={settings.profile.logo} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="size-full bg-[#883545] flex items-center justify-center">
                  <Heart className="text-white w-7 h-7" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm lg:text-base font-black text-[#883545] tracking-tight leading-tight uppercase">
                {settings.profile.name}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mt-1">
                {settings.profile.description}
              </p>
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
              <div className="size-10 bg-[#883545]/10 rounded-xl flex items-center justify-center text-[#883545] font-black group-hover:bg-[#883545]/20 transition-colors uppercase">
                {userProfile.name.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black text-slate-800 truncate leading-none mb-1 uppercase tracking-tighter">{userProfile.name}</p>
                <button onClick={() => { setIsAuthenticated(false); setActiveTab('dashboard'); }} className="flex items-center gap-1 text-[10px] font-bold text-[#883545]/60 hover:text-[#883545] transition-colors">
                  <LogOut className="w-3 h-3" />
                  SAIR DA CONTA
                </button>
              </div>
            </div>
            {activeTab === 'brides' && (
              <button
                onClick={() => { setBrideToEdit(null); setIsBrideModalOpen(true); }}
                className="w-full bg-[#883545] text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#883545]/25"
              >
                <Plus className="w-5 h-5" />
                <span className="uppercase tracking-widest text-xs">Novo Evento</span>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative w-full">
        <AnimatePresence mode="wait">
          {isInitialLoading ? (
            <LoadingScreen key="loading" logo={settings.profile.logo} />
          ) : !isAuthenticated ? (
            <LoginView
              key="login"
              onLogin={(user) => {
                setUserProfile(user);
                setActiveTab('dashboard');
                setIsInitialLoading(true);
                setIsAuthenticated(true);
                // Pequeno delay para exibir a experiência de transição premium
                setTimeout(() => setIsInitialLoading(false), 2000);
              }}
              logo={settings.profile.logo}
              companyName={settings.profile.name}
            />
          ) : (
            <motion.div
              key="app-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Mobile Top Branding */}
              <div className="lg:hidden bg-white/90 backdrop-blur-md border-b border-[#883545]/10 px-6 py-4 flex items-center justify-between z-30 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="size-11 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#883545]/5 overflow-hidden border border-[#883545]/10">
                    {settings.profile.logo ? (
                      <img src={settings.profile.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="size-full bg-[#883545] flex items-center justify-center">
                        <Heart className="text-white w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-xs font-black text-[#883545] uppercase tracking-tighter leading-tight">
                      {settings.profile.name}
                    </h2>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                      {settings.profile.description}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-9 bg-[#883545]/5 rounded-xl flex items-center justify-center text-[#883545] text-xs font-black border border-[#883545]/5 uppercase">
                    {userProfile.name.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                  </div>
                  <button
                    onClick={() => { setIsAuthenticated(false); setActiveTab('dashboard'); }}
                    className="p-2 text-slate-400 hover:text-[#883545] transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div
                ref={mainContentRef}
                className="flex-1 overflow-y-auto p-4 lg:p-10 scrollbar-hide"
              >
                <AnimatePresence mode="wait">
                  {activeTab === 'dashboard' && (
                    <DashboardView
                      key="dash"
                      stats={stats}
                      payments={payments}
                      brides={brides}
                      onViewAll={() => setActiveTab('brides')}
                      filterYear={filterYear}
                      setFilterYear={setFilterYear}
                      filterMonth={filterMonth}
                      setFilterMonth={setFilterMonth}
                      settings={settings}
                      userProfile={userProfile}
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
                      settings={settings}
                    />
                  )}
                  {activeTab === 'finance' && (
                    <FinanceView
                      key="finance"
                      payments={payments}
                      expenses={expenses}
                      brides={brides}
                      stats={stats}
                      settings={settings}
                      onAddPayment={handleAddPayment}
                      onAddExpense={handleAddExpense}
                    />
                  )}
                  {activeTab === 'settings' && (
                    <SettingsView
                      key="settings"
                      settings={settings}
                      setSettings={setSettings}
                      data={{ brides, payments, expenses }}
                      userProfile={userProfile}
                      setUserProfile={setUserProfile}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Floating Action Button */}
              {activeTab === 'brides' && (
                <button
                  onClick={() => { setBrideToEdit(null); setIsBrideModalOpen(true); }}
                  className="lg:hidden fixed bottom-24 right-6 size-14 bg-[#883545] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white"
                >
                  <Plus className="w-8 h-8" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BrideModal
        isOpen={isBrideModalOpen}
        onClose={() => { setIsBrideModalOpen(false); setBrideToEdit(null); }}
        onSave={handleSaveBride}
        brideToEdit={brideToEdit}
        serviceTypes={settings.services}
      />
      {isAuthenticated && <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />}
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
      <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
    </button>
    <button
      onClick={() => setActiveTab('brides')}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'brides' ? 'text-[#883545] scale-110' : 'text-slate-400 opacity-60'}`}
    >
      <Users className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Clientes</span>
    </button>
    <button
      onClick={() => setActiveTab('finance')}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'finance' ? 'text-[#883545] scale-110' : 'text-slate-400 opacity-60'}`}
    >
      <CircleDollarSign className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Financeiro</span>
    </button>
    <button
      onClick={() => setActiveTab('settings')}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'settings' ? 'text-[#883545] scale-110' : 'text-slate-400 opacity-60'}`}
    >
      <Settings className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Configurações</span>
    </button>
  </div>
);
