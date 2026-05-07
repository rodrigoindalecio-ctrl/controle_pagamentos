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
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'motion/react';
import { SettingsView, BrideModal, ConfirmModal } from './components/views/SettingsView';
import { FinanceView } from './components/views/FinanceView';
import { LoginView } from './components/views/LoginView';
import { BridesView, DistratoModal, ContractModal, ClientSummaryModal } from './components/views/BridesView';
import { DashboardView } from './components/views/DashboardView';
import { ContractTemplatesView } from './components/views/ContractTemplatesView';
import DoughnutChart from './DoughnutChart';
import VolumeValorBarChart from './VolumeValorBarChart';
import OcupacaoAgendaBarChart from './OcupacaoAgendaBarChart';
import GhostLinesChart from './GhostLinesChart';
import { vanessaSignature } from './signatures';
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
  MapPin,
  X,
  FileText,
  Send,
  ExternalLink,
  Copy,
  ChevronRight,
  Save,
  AlertCircle,
  Download,
  RotateCcw,
  Check,
  RefreshCw
} from 'lucide-react';
import { 
  Bride, 
  Contract, 
  ContractTemplate, 
  Payment, 
  Expense, 
  DashboardStats, 
  AppSettings, 
  DEFAULT_SETTINGS as BASE_DEFAULT_SETTINGS 
} from './types';

// --- PDF Helper ---
export async function generateContractPDF(brideName: string, text: string, signatures: any[] = [], token?: string, settings?: any) {
  try {
    if (!text) return;

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = pageWidth - (margin * 2);
    let currentY = 25;

    // Divide o texto em parágrafos
    const paragraphs = text.split('\n');
    let inCenterBlock = false;

    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(40, 40, 40);

    for (let pText of paragraphs) {
      const trimmed = pText.trim();
      
      if (trimmed.includes('<center>')) inCenterBlock = true;
      
      const cleanText = trimmed
        .replace(/<center>/gi, '')
        .replace(/<\/center>/gi, '')
        .replace(/\*\*/g, '');
      
      if (cleanText === "" && trimmed === "") {
          currentY += 4;
          continue;
      }

      const isExplicitCenter = trimmed.toLowerCase().includes('<center>') || trimmed.toLowerCase().includes('</center>');
      const isCenter = inCenterBlock || isExplicitCenter;
      const isBold = trimmed.includes('**') || 
                     cleanText.toUpperCase().startsWith('CLÁUSULA') || 
                     cleanText.toUpperCase().startsWith('PARÁGRAFO') ||
                     cleanText.toUpperCase().startsWith('CONTRATO');

      doc.setFont("times", isBold ? "bold" : "normal");
      doc.setFontSize(isBold ? 11 : 10.5);
      
      const splitLines = doc.splitTextToSize(cleanText, maxWidth);
      
      // Check page break
      if (currentY + (splitLines.length * 5.5) > pageHeight - 20) {
        doc.addPage();
        currentY = 25;
      }

      splitLines.forEach((line: string) => {
          if (isCenter) {
              doc.text(line, pageWidth / 2, currentY, { align: 'center' });
          } else {
              doc.text(line, margin, currentY, { maxWidth: maxWidth, align: 'justify' });
          }
          currentY += 5.5;
      });

      if (trimmed.includes('</center>')) inCenterBlock = false;
    }

    doc.save(`Contrato_${brideName.replace(/\s+/g, '_')}.pdf`);
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
  }
}






const DEFAULT_SETTINGS: AppSettings = BASE_DEFAULT_SETTINGS;

// Implementação mínima de StatCard
export const StatCard = ({ label, value, icon: Icon, color, trend, children }: any) => {
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
    <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col h-full hover:shadow-[0_10px_30px_-10px_rgba(136,53,69,0.15)] hover:border-[#883545]/20 transition-all duration-500 group relative overflow-hidden pl-7">
      {/* Accent line on the left */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-1.5 group-hover:w-2 transition-all duration-500 ${!color.startsWith('text-[') ? color.replace('text-', 'bg-') : ''}`}
        style={color.startsWith('text-[') ? { backgroundColor: color.match(/\[(.*?)\]/)?.[1] } : {}}
      />
      
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#883545]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex justify-between items-start mb-3 shrink-0 relative z-10">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">{label}</span>
        <div className={`p-2.5 rounded-xl ${color.replace('text-', 'bg-').split('-')[0]}-50/50 ${color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm`}>
          {Icon && <Icon className="size-4" />}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10">
        <div className="flex items-center justify-center gap-1 w-full min-h-[44px]">
          {currency && <span className="text-xs font-bold text-slate-400 mt-1">{currency}</span>}
          <span className={`${fontSizeClass} font-black text-slate-900 leading-tight tracking-tight break-words group-hover:text-[#883545] transition-colors duration-500`}>
            {amount}
          </span>
        </div>

        {trend && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isPositive ? 'bg-emerald-50 text-emerald-600 shadow-[0_2px_10px_-2px_rgba(16,185,129,0.1)]' : isNegative ? 'bg-rose-50 text-rose-500 shadow-[0_2px_10px_-2px_rgba(244,63,94,0.1)]' : 'bg-slate-50 text-slate-400'}`}>
              {isPositive && <TrendingUp className="size-2.5" />}
              {trend.split(' ')[0]}
            </div>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
              {trend.split(' ').slice(1).join(' ')}
            </span>
          </div>
        )}
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-slate-50 relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};

// --- Helpers de Data para Evitar Fuso Horário (Problema de 1 dia a menos) ---
export const parseDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
};

export const formatDisplayDate = (dateStr: string | null | undefined) => {
  const d = parseDate(dateStr);
  return d ? d.toLocaleDateString('pt-BR') : '-';
};

export const normalizeString = (str: string) => 
  (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Implementação mínima de Header
export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
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
export default function App() {
  const mainContentRef = React.useRef<HTMLDivElement>(null);

  // Autenticação: token fica em localStorage para persistir entre sessões (mesmo fechando o browser)
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('wedding_token'));
  const isAuthenticated = !!authToken;

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('wedding_user_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Rodrigo Indalecio',
      email: 'rodrigoindalecio@hotmail.com'
      // NUNCA armazenar senha aqui
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'brides' | 'finance' | 'settings' | 'templates'>('dashboard');
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'services' | 'goals' | 'system'>('profile');
  const [stats, setStats] = useState<DashboardStats | null>(() => {
    const saved = localStorage.getItem('wedding_stats');
    return saved ? JSON.parse(saved) : null;
  });
  const [brides, setBrides] = useState<Bride[]>(() => {
    const saved = localStorage.getItem('wedding_brides');
    return saved ? JSON.parse(saved) : [];
  });
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('wedding_payments');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('wedding_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isPublicBrandingLoaded, setIsPublicBrandingLoaded] = useState(false);
  const [isBrideModalOpen, setIsBrideModalOpen] = useState(false);
  const [brideToEdit, setBrideToEdit] = useState<Bride | null>(null);
  const [isContractFlow, setIsContractFlow] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm?: () => void, type: 'confirm' | 'alert' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm'
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm, type: 'confirm' });
  };

  const showAlert = (title: string, message: string) => {
    setConfirmConfig({ isOpen: true, title, message, type: 'alert' });
  };

  const handleTabChange = (newTab: string) => {
    if (activeTab === 'settings' && newTab !== 'settings' && hasUnsavedSettings) {
      showConfirm(
        "Alterações Não Salvas",
        "Você tem alterações nas configurações que não foram salvas. Deseja sair sem salvar e perder essas alterações?",
        () => {
          setHasUnsavedSettings(false);
          fetchData();
          setActiveTab(newTab);
        }
      );
      return;
    }
    setActiveTab(newTab);
  };

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('wedding_settings');
    if (!saved) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
        services: Array.isArray(parsed.services) ? parsed.services : DEFAULT_SETTINGS.services,
        partners: Array.isArray(parsed.partners) ? parsed.partners : DEFAULT_SETTINGS.partners,
        locations: Array.isArray(parsed.locations) ? parsed.locations : DEFAULT_SETTINGS.locations
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Lock para evitar múltiplos refresh simultâneos
  const refreshPromiseRef = React.useRef<Promise<string | null> | null>(null);

  // Helper para fazer fetch autenticado
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };
    // Lê sempre do localStorage para evitar problemas de closure stale no React state
    let currentToken = authToken || localStorage.getItem('wedding_token');
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    try {
      const authHeader = headers['Authorization'] || '';
      if (authHeader.length > 1000) {
        console.warn(`[Auth] Header Authorization grande detectado: ${authHeader.length} bytes.`);
      }

      let res = await fetch(url, { ...options, headers });

      // Se token expirou, tenta renovar com refresh token
      if (res.status === 401) {
        const refreshToken = localStorage.getItem('wedding_refresh_token');
        if (refreshToken) {
          // Se já houver um refresh em andamento, aguarda ele
          if (!refreshPromiseRef.current) {
            console.log('[Auth] Token expirado, iniciando refresh...');
            refreshPromiseRef.current = (async () => {
              try {
                const refreshRes = await fetch('/api/auth/refresh', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refresh_token: refreshToken })
                });
                if (refreshRes.ok) {
                  const refreshData = await refreshRes.json();
                  localStorage.setItem('wedding_token', refreshData.access_token);
                  localStorage.setItem('wedding_refresh_token', refreshData.refresh_token);
                  setAuthToken(refreshData.access_token);
                  return refreshData.access_token;
                }
              } catch (refreshErr) {
                console.warn('[Auth] Falha no refresh de token:', refreshErr);
              } finally {
                refreshPromiseRef.current = null;
              }
              return null;
            })();
          }

          const newToken = await refreshPromiseRef.current;
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            return fetch(url, { ...options, headers });
          }
        }
        
        // Sem refresh token ou falha no refresh: faz logout limpo sem travar
        console.warn(`[Auth] 401 em ${url} sem refresh token. Fazendo logout.`);
        handleLogout();
        return res;
      }
      return res;
    } catch (error: any) {
      console.error(`[authFetch ERROR] URL: ${url}`, error);
      throw error;
    }
  };

  // Salva perfil (sem senha) no localStorage para persistir nome/preferências
  useEffect(() => {
    localStorage.setItem('wedding_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    // Busca informações públicas de branding (para guia anônima/primeiro acesso)
    if (!isAuthenticated && !isPublicBrandingLoaded) {
      fetch('/api/public/settings')
        .then(async (res) => {
          if (!res.ok) throw new Error('Falha ao buscar settings públicos');
          return res.json();
        })
        .then(data => {
          if (data && data.profile) {
            setSettings(prev => ({
              ...prev,
              profile: { ...prev.profile, ...data.profile }
            }));
          }
        })
        .catch(err => {
          console.warn('[App] Erro ao carregar branding público, usando fallback.', err);
        })
        .finally(() => {
          setIsPublicBrandingLoaded(true);
          // Se não está autenticado, o loading termina aqui
          setIsInitialLoading(false);
        });
    }
  }, [isAuthenticated, isPublicBrandingLoaded]);

  useEffect(() => {
    // Se NÃO está autenticado: o fetchPublicBranding controla o loading
    // Se está autenticado: o fetchData controla o loading
    // Se tem cache E não está autenticado: libera o loading rapidamente (só para a tela de login)
    const hasCache = localStorage.getItem('wedding_stats') !== null;
    if (hasCache && !authToken) {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [authToken]);

  useEffect(() => {
    localStorage.setItem('wedding_settings', JSON.stringify(settings));

    // Atualiza o favicon e ícone de app dinamicamente com a logo configurada
    const faviconEl = document.getElementById('favicon') as HTMLLinkElement;
    const appleIconEl = document.getElementById('apple-icon') as HTMLLinkElement;

    if (faviconEl) {
      if (settings.profile.logo) {
        faviconEl.href = settings.profile.logo;
        faviconEl.type = 'image/png';
        if (appleIconEl) appleIconEl.href = settings.profile.logo;
      } else {
        // Favicon padrão (coração via SVG embutido)
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23883545"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>`;
        faviconEl.href = `data:image/svg+xml,${svg}`;
        faviconEl.type = 'image/svg+xml';
        if (appleIconEl) appleIconEl.href = `data:image/svg+xml,${svg}`;
      }
    }

    // Atualiza o título da aba do navegador
    const name = settings.profile.name || 'Gestão Premium';
    document.title = name;
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

  const isFetchingDataRef = React.useRef(false);

  const fetchData = async (year?: string, month?: string) => {
    if (isFetchingDataRef.current) {
      console.warn('[App] ⏳ fetchData já em execução, ignorando chamada duplicada.');
      return;
    }
    
    isFetchingDataRef.current = true;
    try {
      const y = year || filterYear;
      const m = month || filterMonth;

      console.log(`[App] 🔄 Buscando dados: ${m}/${y}...`);

      // Segurança: Se algo travar, liberamos o loading em 3 segundos
      const safetyTimer = setTimeout(() => {
        setIsInitialLoading(false);
        console.warn('[App] ⚠️ Loading removido por timeout (3s).');
      }, 3000);

      // Limpa cache local antes de buscar para garantir que não usemos dados truncados antigos
      localStorage.removeItem('wedding_payments');
      localStorage.removeItem('wedding_expenses');
      localStorage.removeItem('wedding_brides');

      // Busca dados essenciais em paralelo
      console.log('[App] 📡 Chamando APIs (stats, brides, payments, expenses, settings)...');
      
      const results = await Promise.allSettled([
        authFetch(`/api/dashboard/stats?year=${y}&month=${m}&_t=${Date.now()}`),
        authFetch(`/api/brides?_t=${Date.now()}`),
        authFetch(`/api/payments?_t=${Date.now()}`),
        authFetch(`/api/expenses?_t=${Date.now()}`),
        authFetch('/api/settings')
      ]);

      clearTimeout(safetyTimer);

      const [statsRes, bridesRes, paymentsRes, expensesRes, settingsRes] = results.map(r => r.status === 'fulfilled' ? r.value : null) as [Response | null, Response | null, Response | null, Response | null, Response | null];

      if (statsRes && statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
        localStorage.setItem('wedding_stats', JSON.stringify(data));
        console.log('[App] ✅ Stats carregados');
      }
      if (bridesRes && bridesRes.ok) {
        const data = await bridesRes.json();
        setBrides(data);
        localStorage.setItem('wedding_brides', JSON.stringify(data));
        console.log('[App] ✅ Clientes carregados');
      }
      if (paymentsRes && paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data);
        localStorage.setItem('wedding_payments', JSON.stringify(data));
      }
      if (expensesRes && expensesRes.ok) {
        const data = await expensesRes.json();
        setExpenses(data);
        localStorage.setItem('wedding_expenses', JSON.stringify(data));
      }
      if (settingsRes && settingsRes.ok) {
        const dbSettings = await settingsRes.json();
        if (dbSettings && Object.keys(dbSettings).length > 0) {
          const merged = {
            ...DEFAULT_SETTINGS,
            ...dbSettings,
            profile: { ...DEFAULT_SETTINGS.profile, ...(dbSettings.profile || {}) },
            services: Array.isArray(dbSettings.services) ? dbSettings.services : (settings.services || DEFAULT_SETTINGS.services),
            partners: Array.isArray(dbSettings.partners) ? dbSettings.partners : (settings.partners || DEFAULT_SETTINGS.partners),
            locations: Array.isArray(dbSettings.locations) ? dbSettings.locations : (settings.locations || DEFAULT_SETTINGS.locations)
          };
          setSettings(merged);
          localStorage.setItem('wedding_settings', JSON.stringify(merged));
          console.log('[App] ✅ Settings carregados');
        }
      }
      setIsDataLoaded(true);
      setIsInitialLoading(false); // Só libera agora que TUDO foi setado
    } catch (error) {
      console.error('[App] ❌ Erro crítico no fetchData:', error);
      setIsInitialLoading(false);
    } finally {
      isFetchingDataRef.current = false;
    }
  };

  useEffect(() => {
    // Só busca dados se o usuário estiver autenticado
    if (!authToken) return;
    fetchData();
  }, [filterYear, filterMonth, authToken]);




  const handleSaveBride = async (brideData: any) => {
    try {
      const url = brideToEdit ? `/api/brides/${brideToEdit.id}` : '/api/brides';
      const method = brideToEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(brideData)
      });
      if (res.ok) {
        const savedBride = await res.json();
        await fetchData();
        setBrideToEdit(null);

        if (!isContractFlow) {
          showAlert('Sucesso', brideToEdit ? 'Cliente atualizado com sucesso! ✓' : 'Cliente cadastrado com sucesso! ✓');
        }
        return savedBride;
      } else {
        const contentType = res.headers.get("content-type");
        let errorData: any = {};
        if (contentType && contentType.indexOf("application/json") !== -1) {
          errorData = await res.json();
        } else {
          const text = await res.text();
          errorData = { message: "Resposta não é JSON", details: text.substring(0, 100) };
        }
        console.error('Erro ao salvar cliente:', errorData);
        showAlert('Erro ao Salvar', `Erro: ${errorData.message || errorData.error || 'Erro desconhecido'}`);
        return null;
      }
    } catch (e: any) {
      console.error('[handleSaveBride Error]', e);
      showAlert('Erro Inesperado', `O servidor não respondeu (Failed to fetch). Verifique se o servidor local está rodando. Detalhe: ${e.message}`);
      return null;
    }
  };

  const handleAddPayment = async (paymentData: any) => {
    try {
      const res = await authFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      if (res.ok) {
        await fetchData();
        showAlert('Pagamento', 'Pagamento registrado com sucesso! ✓');
        return true;
      } else {
        const errorData = await res.json();
        showAlert('Erro no Pagamento', `Erro: ${errorData.message || errorData.error || 'Erro desconhecido'}`);
        return false;
      }
    } catch (e) {
      console.error(e);
      showAlert('Erro de Conexão', 'Erro de conexão ao tentar registrar pagamento.');
      return false;
    }
  };

  const handleAddExpense = async (expenseData: any) => {
    try {
      const res = await authFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(expenseData)
      });
      if (res.ok) {
        await fetchData();
        showAlert('Despesa', 'Despesa registrada com sucesso! ✓');
        return true;
      } else {
        const errorData = await res.json();
        showAlert('Erro na Despesa', `Erro: ${errorData.message || errorData.error || 'Erro desconhecido'}`);
        return false;
      }
    } catch (e) {
      console.error(e);
      showAlert('Erro de Conexão', 'Erro de conexão ao tentar registrar despesa.');
      return false;
    }
  };

  const handleUpdatePayment = async (id: number, paymentData: any) => {
    try {
      const res = await authFetch(`/api/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(paymentData)
      });
      if (res.ok) {
        await fetchData();
        showAlert('Pagamento', 'Pagamento atualizado com sucesso! ✓');
        return true;
      } else {
        const errorData = await res.json();
        showAlert('Erro', `Erro: ${errorData.message || errorData.error || 'Erro desconhecido'}`);
        return false;
      }
    } catch (e) {
      console.error(e);
      showAlert('Erro', 'Erro de conexão.');
      return false;
    }
  };

  const handleDeletePayment = async (id: number) => {
    showConfirm(
      "Excluir Lançamento",
      "Tem certeza que deseja excluir este pagamento?",
      async () => {
        try {
          const res = await authFetch(`/api/payments/${id}`, { method: 'DELETE' });
          if (res.ok) {
            await fetchData();
            showAlert('Sucesso', 'Pagamento excluído com sucesso! ✓');
          } else {
            showAlert('Erro', 'Erro ao excluir pagamento.');
          }
        } catch (e) {
          console.error(e);
          showAlert('Erro', 'Erro de conexão.');
        }
      }
    );
  };

  const handleUpdateExpense = async (id: number, expenseData: any) => {
    try {
      const res = await authFetch(`/api/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(expenseData)
      });
      if (res.ok) {
        await fetchData();
        showAlert('Despesa', 'Despesa atualizada com sucesso! ✓');
        return true;
      } else {
        const errorData = await res.json();
        showAlert('Erro', `Erro: ${errorData.message || errorData.error || 'Erro desconhecido'}`);
        return false;
      }
    } catch (e) {
      console.error(e);
      showAlert('Erro', 'Erro de conexão.');
      return false;
    }
  };

  const handleDeleteExpense = async (id: number) => {
    showConfirm(
      "Excluir Despesa",
      "Tem certeza que deseja excluir esta despesa?",
      async () => {
        try {
          const res = await authFetch(`/api/expenses/${id}`, { method: 'DELETE' });
          if (res.ok) {
            await fetchData();
            showAlert('Sucesso', 'Despesa excluída com sucesso! ✓');
          } else {
            showAlert('Erro', 'Erro ao excluir despesa.');
          }
        } catch (e) {
          console.error(e);
          showAlert('Erro', 'Erro de conexão.');
        }
      }
    );
  };

  const handleUpdateBrideStatus = async (id: number, status: string, options: any = {}) => {
    try {
      const res = await authFetch(`/api/brides/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          fine_amount: options.fine_amount,
          original_value: options.original_value
        })
      });
      if (res.ok) {
        await fetchData();
        showAlert('Status Atualizado', `Status do cliente atualizado para: ${status} ✓`);
      } else {
        const errorData = await res.json();
        showAlert('Erro no Status', `Erro: ${errorData.message || errorData.error || 'Erro desconhecido'}`);
      }
    } catch (e) {
      console.error(e);
      showAlert('Erro de Conexão', 'Erro de conexão ao tentar atualizar status.');
    }
  };

  const handleDeleteBride = async (id: number) => {
    showConfirm(
      "Excluir Cliente",
      "Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.",
      async () => {
        try {
          const res = await authFetch(`/api/brides/${id}`, { method: 'DELETE' });
          if (res.ok) {
            await fetchData();
            showAlert('Sucesso', 'Cliente excluído com sucesso! ✓');
          } else {
            const errorData = await res.json();
            showAlert('Erro', `Erro ao excluir cliente: ${errorData.message || errorData.error || 'Erro desconhecido'}`);
          }
        } catch (e) {
          console.error(e);
          showAlert('Erro', 'Erro de conexão ao tentar excluir cliente.');
        }
      }
    );
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setSettings(newSettings);
        setHasUnsavedSettings(false);
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erro retornado pela API de settings:', errorData);
      }
    } catch (e) {
      console.error('Erro de rede ao salvar settings:', e);
    }
    return false;
  };

  const handleSaveProfile = async (newProfile: any) => {
    try {
      const res = await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify(newProfile)
      });
      if (res.ok) {
        setUserProfile(newProfile);
        setHasUnsavedSettings(false);
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erro retornado pela API de profile:', errorData);
      }
    } catch (e) {
      console.error('Erro de rede ao salvar profile:', e);
    }
    return false;
  };

  // Logout: invalida a sessão no backend e limpa o token local
  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      }
    } catch (_) { /* ignora erros de rede no logout */ }
    localStorage.removeItem('wedding_token');
    localStorage.removeItem('wedding_refresh_token');
    setAuthToken(null);
    setHasUnsavedSettings(false);
    setActiveTab('dashboard');
  };


  return (
    <div className="flex h-screen bg-[#FDF8F8] text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      {isAuthenticated && (
        <aside className="hidden lg:flex w-72 bg-white border-r border-[#883545]/10 flex-col p-6 shadow-2xl shadow-[#883545]/5 z-20">
          <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
            <div className="size-12 bg-white rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-[#883545]/10 group-hover:rotate-6 transition-transform overflow-hidden border border-[#883545]/5">
              {settings.profile.logo ? (
                <img 
                  src={settings.profile.logo} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-1" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = "size-full bg-[#883545] flex items-center justify-center";
                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.54 4.05 3 5.5l7 7Z"/></svg>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
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
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
            <SidebarItem icon={Users} label="Clientes" active={activeTab === 'brides'} onClick={() => handleTabChange('brides')} />
            <SidebarItem icon={FileText} label="Contratos" active={activeTab === 'templates'} onClick={() => handleTabChange('templates')} />
            <SidebarItem icon={CircleDollarSign} label="Financeiro" active={activeTab === 'finance'} onClick={() => handleTabChange('finance')} />
            <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} />
          </nav>

          <div className="mt-auto pt-6 border-t border-[#883545]/10">
            <div className="flex items-center gap-4 px-2 mb-6 group cursor-pointer">
              <div className="size-10 bg-[#883545]/10 rounded-xl flex items-center justify-center text-[#883545] font-black group-hover:bg-[#883545]/20 transition-colors uppercase">
                {userProfile.name.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black text-slate-800 truncate leading-none mb-1 uppercase tracking-tighter">{userProfile.name}</p>
                <button onClick={() => handleLogout()} className="flex items-center gap-1 text-[10px] font-bold text-[#883545]/60 hover:text-[#883545] transition-colors">
                  <LogOut className="w-3 h-3" />
                  SAIR DA CONTA
                </button>
              </div>
            </div>
            {activeTab === 'brides' && (
              <div className="space-y-3">
                <button
                  onClick={() => { setIsContractFlow(false); setBrideToEdit(null); setIsBrideModalOpen(true); }}
                  className="w-full bg-white text-[#883545] border-2 border-[#883545] p-3.5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-[#883545]/5 active:scale-95 transition-all shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span className="uppercase tracking-widest text-[10px]">Novo Cliente</span>
                </button>
                <button
                  onClick={() => { setIsContractFlow(true); setBrideToEdit(null); setIsBrideModalOpen(true); }}
                  className="w-full bg-[#883545] text-white p-3.5 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#883545]/25"
                >
                  <FileText className="w-5 h-5" />
                  <span className="uppercase tracking-widest text-[10px]">Novo Contrato</span>
                </button>
              </div>
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
              onLogin={(user, token, refreshToken) => {
                // Salva token no localStorage (mantém o acesso mesmo após fechar o browser)
                localStorage.setItem('wedding_token', token);
                localStorage.setItem('wedding_refresh_token', refreshToken);
                setAuthToken(token);
                setUserProfile({ name: user.name, email: user.email }); // sem senha
                setActiveTab('dashboard');
                // Mantém o loading ativo: o fetchData() (disparado pelo efeito [authToken])
                // vai chamar setIsInitialLoading(false) quando terminar com os dados prontos.
                setIsInitialLoading(true);
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
                      <img 
                        src={settings.profile.logo} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-1" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = "size-full bg-[#883545] flex items-center justify-center";
                            fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.54 4.05 3 5.5l7 7Z"/></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
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
                    onClick={() => handleLogout()}
                    className="p-2 text-slate-400 hover:text-[#883545] transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div
                ref={mainContentRef}
                className="flex-1 overflow-auto p-4 lg:p-10 scrollbar-hide"
              >
                <AnimatePresence mode="wait">
                  {activeTab === 'dashboard' && (
                    <DashboardView
                      key="dash"
                      stats={stats}
                      payments={payments}
                      brides={brides}
                      onViewAll={() => handleTabChange('brides')}
                      filterYear={filterYear}
                      setFilterYear={setFilterYear}
                      filterMonth={filterMonth}
                      setFilterMonth={setFilterMonth}
                      settings={settings}
                      userProfile={userProfile}
                      isLoading={!isDataLoaded}
                    />
                  )}
                  {activeTab === 'brides' && (
                    <BridesView
                      key="brides"
                      brides={brides}
                      payments={payments}
                      onEdit={(bride) => { setIsContractFlow(false); setBrideToEdit(bride); setIsBrideModalOpen(true); }}
                      onUpdateStatus={handleUpdateBrideStatus}
                      onDelete={handleDeleteBride}
                      settings={settings}
                      authFetch={authFetch}
                      showAlert={showAlert}
                      onNewContract={() => { setIsContractFlow(true); setBrideToEdit(null); setIsBrideModalOpen(true); }}
                      onNewBride={() => { setIsContractFlow(false); setBrideToEdit(null); setIsBrideModalOpen(true); }}
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
                      onUpdatePayment={handleUpdatePayment}
                      onDeletePayment={handleDeletePayment}
                      onUpdateExpense={handleUpdateExpense}
                      onDeleteExpense={handleDeleteExpense}
                      onGoToSettings={() => {
                        setSettingsSubTab('services');
                        handleTabChange('settings');
                      }}
                    />
                  )}
                  {/* CRM desativado pra Vercel */}
                  {activeTab === 'templates' && (
            <ContractTemplatesView authFetch={authFetch} showAlert={showAlert} />
          )}

          {activeTab === 'settings' && (
                    <SettingsView
                      key={`settings-${settingsSubTab}`}
                      data={{ brides, payments, expenses }}
                      settings={settings}
                      setSettings={(s) => { setSettings(s); setHasUnsavedSettings(true); }}
                      userProfile={userProfile}
                      setUserProfile={(p) => { setUserProfile(p); setHasUnsavedSettings(true); }}
                      authToken={authToken}
                      onSaveSettings={handleSaveSettings}
                      onSaveProfile={handleSaveProfile}
                      initialTab={settingsSubTab}
                      showAlert={showAlert}
                      showConfirm={showConfirm}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Floating Action Buttons */}
              {activeTab === 'brides' && (
                <div className="lg:hidden fixed bottom-24 right-6 flex flex-col gap-3 z-40">
                  <button
                    onClick={() => { setIsContractFlow(true); setBrideToEdit(null); setIsBrideModalOpen(true); }}
                    className="size-12 bg-[#883545] text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white active:scale-95 transition-all"
                    title="Novo Contrato"
                  >
                    <FileText className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => { setIsContractFlow(false); setBrideToEdit(null); setIsBrideModalOpen(true); }}
                    className="size-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white active:scale-95 transition-all"
                    title="Novo Cliente"
                  >
                    <Plus className="w-8 h-8" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BrideModal
        isOpen={isBrideModalOpen}
        onClose={() => { setIsBrideModalOpen(false); setBrideToEdit(null); setIsContractFlow(false); }}
        onSave={async (data) => {
          const saved = await handleSaveBride(data);
          if (saved) {
            setIsBrideModalOpen(false);
            if (isContractFlow) {
              setBrideToEdit(null);
              // Pequeno delay para a animação do modal anterior fechar
              setTimeout(() => {
                const event = new CustomEvent('open-contract', { detail: saved });
                window.dispatchEvent(event);
              }, 300);
            }
            return true;
          }
          return false;
        }}
        brideToEdit={brideToEdit}
        serviceTypes={settings.services}
        locations={settings.locations}
        isContractFlow={isContractFlow}
        onGoToSettings={() => {
          setIsBrideModalOpen(false);
          setSettingsSubTab('services');
          handleTabChange('settings');
        }}
      />
      {isAuthenticated && <MobileNav activeTab={activeTab} setActiveTab={handleTabChange} />}
      
      <ConfirmModal 
        {...confirmConfig} 
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} 
      />
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
