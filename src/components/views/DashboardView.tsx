import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import DoughnutChart from "../../DoughnutChart";
import GhostLinesChart from "../../GhostLinesChart";
import { Header, StatCard, parseDate } from "../../App";
import { Bride, Payment, DashboardStats, AppSettings } from "../../types";
import { Calendar, TrendingUp, Wallet, Clock, Settings, Plus, CircleDollarSign, CheckCircle, XCircle, UserMinus, Award, Trophy, ChevronDown, X, Users, Heart } from "lucide-react";

const DashboardView = ({ stats, payments, brides, onViewAll, filterYear, setFilterYear, filterMonth, setFilterMonth, settings, userProfile, isLoading }: { stats: DashboardStats | null, payments: Payment[], brides: Bride[], onViewAll: () => void, filterYear: string, setFilterYear: (y: string) => void, filterMonth: string, setFilterMonth: (m: string) => void, settings: AppSettings, key?: string, userProfile: any, isLoading?: boolean }) => {
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
  const [showBVInMix, setShowBVInMix] = useState(false);

  if (!stats) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-4 border-[#883545]/10 border-t-[#883545] rounded-full"
      />
      <p className="text-slate-400 font-medium italic animate-pulse">Carregando painel pela primeira vez...</p>
    </div>
  );

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
  // Mix de cores para o gráfico
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
    const d = p.payment_date ? parseDate(p.payment_date) : null;
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
    const d = p.payment_date ? parseDate(p.payment_date) : null;
    return d && d.getFullYear() === Number(filterYear) && (p.status || '').trim().toLowerCase() === 'pago';
  }).reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

  // --- Mix de Receita (Alinhado 100% com o Card de Receita Principal) ---
  const mixMap = new Map();
  const clientsWithRevenueInPeriod = new Set();

  // 1. Pegar todos os pagamentos realizados no período selecionado (Geralmente entradas > 0)
  const paymentsInPeriod = payments.filter(p => {
    const d = p.payment_date ? parseDate(p.payment_date) : null;
    if (!d || (p.status || '').trim().toLowerCase() !== 'pago') return false;

    // Helper simples para valor numérico
    const amount = typeof p.amount_paid === 'number' ? p.amount_paid : parseFloat(String(p.amount_paid).replace(/[R$\s]/g, '').replace(',', '.')) || 0;
    if (amount <= 0) return false; // Sincroniza com o card de Receita que só mostra entradas

    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    const matchesYear = String(year) === filterYear;
    const matchesMonth = filterMonth === 'all' || String(month) === filterMonth;

    return matchesYear && matchesMonth;
  });

  // 2. Agrupar esses pagamentos por tipo de serviço do cliente
  paymentsInPeriod.forEach(p => {
    const amount = typeof p.amount_paid === 'number' ? p.amount_paid : parseFloat(String(p.amount_paid).replace(/[R$\s]/g, '').replace(',', '.')) || 0;

    if (String(p.bride_id) === '58') {
      if (showBVInMix) {
        clientsWithRevenueInPeriod.add('BV');
        const key = 'BV (Bonificação)';
        mixMap.set(key, (mixMap.get(key) || 0) + amount);
      }
    } else {
      const bride = brides.find(b => String(b.id) === String(p.bride_id));
      if (bride) {
        clientsWithRevenueInPeriod.add(bride.id);
        const rawKey = (bride.service_type || 'Não Definido').trim();
        const key = rawKey || 'Não Definido';
        mixMap.set(key, (mixMap.get(key) || 0) + amount);
      } else {
        // Se o cliente foi apagado mas existe pagamento, agrupar em 'Outro (Recebimentos de IDs excluídos)'
        const key = 'Outro (IDs excluídos)';
        mixMap.set(key, (mixMap.get(key) || 0) + amount);
      }
    }
  });

  const mixLabels = Array.from(mixMap.keys());
  const mixData = Array.from(mixMap.values());
  const totalMixValue = Array.from(mixMap.values()).reduce((a, b) => a + b, 0);

  // Ghost Lines: comparativo de receita por mês para o ano atual + 1 anterior
  const ghostYears = [String(currentYear - 1), String(currentYear)];
  const ghostMonths = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const ghostColors = ["#F59E42", "#883545"]; // Laranja, Vinho
  const ghostDatasets = ghostYears.map((year, idx) => {
    const data = ghostMonths.map((month, mIdx) => {
      const monthNum = mIdx + 1;
      const total = payments
        .filter(p => {
          const d = p.payment_date ? parseDate(p.payment_date) : null;
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
      className="space-y-4 lg:space-y-8 pb-10"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Header title={`Olá, ${userProfile.name.split(' ')[0]}! 👋`} subtitle={`Resumo Estratégica • ${periodLabel}`} />
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100"
            >
              <div className="size-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Sincronizando</span>
            </motion.div>
          )}
        </div>

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
                    eventDate: parseDate(b.event_date) || new Date(),
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


      {/* Mix de Receita por Serviço — Card expandido */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#883545]/10 overflow-hidden">
        <div className="p-5 lg:p-8 border-b border-[#883545]/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">Mix de Receita por Serviço</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Distribuição baseada em recebimentos de caixa no período</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBVInMix(!showBVInMix)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${showBVInMix ? 'bg-[#883545] text-white border-[#883545]' : 'bg-white text-slate-400 border-slate-200 hover:border-[#883545]/30'}`}
            >
              <div className={`w-2 h-2 rounded-full ${showBVInMix ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest">Incluir BV</span>
            </button>
            <span className="text-[10px] font-black text-[#883545] bg-[#883545]/5 px-3 py-1.5 rounded-full uppercase tracking-widest">
              {clientsWithRevenueInPeriod.size} Clientes Recebidos
            </span>
          </div>
        </div>

        {mixLabels.length > 0 ? (
          <div className="flex flex-col lg:flex-row">
            {/* Rosca à esquerda */}
            <div className="flex items-center justify-center p-6 lg:p-10 lg:w-2/5 border-b lg:border-b-0 lg:border-r border-[#883545]/5">
              <DoughnutChart
                labels={mixLabels}
                data={mixData}
                colors={mixLabels.map((_, i) => mixColors[i % mixColors.length])}
                title="Receita por Tipo de Serviço"
              />
            </div>

            {/* Lista ranqueada à direita */}
            <div className="flex-1 p-6 lg:p-8 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Ranking por Receita Gerada</p>
              {(() => {
                const total = mixData.reduce((s, v) => s + v, 0);
                const sorted = mixLabels
                  .map((label, i) => ({ label, value: mixData[i], color: mixColors[i % mixColors.length] }))
                  .sort((a, b) => b.value - a.value);
                return sorted.map((item, i) => {
                  const pct = total > 0 ? (item.value / total) * 100 : 0;
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[9px] font-black shrink-0"
                            style={{ backgroundColor: item.color }}
                          >
                            {i + 1}
                          </div>
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[160px]">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-black text-slate-400">{pct.toFixed(1)}%</span>
                          <span className="text-sm font-black text-slate-800">
                            R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-base font-black text-[#883545]">
                  R$ {mixData.reduce((s, v) => s + v, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm italic font-medium">
            Sem contratos no período selecionado.
          </div>
        )}
      </div>

      {/* Fluxo de Caixa */}
      <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border border-[#883545]/10 flex flex-col">
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
      <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border border-[#883545]/10 flex flex-col">
        <h3 className="text-lg lg:text-xl font-bold mb-4">Comparativo de Receita por Ano</h3>
        <GhostLinesChart
          labels={ghostMonths}
          datasets={ghostDatasets}
          title="Receita Mensal por Ano"
        />
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
    </motion.div >
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

export { DashboardView };
