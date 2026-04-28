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
import { SigningView, SignaturePad } from './components/views/SigningView';
import { DashboardView } from './components/views/DashboardView';
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

// --- PDF Helper ---
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

    // --- RENDERIZAÇÃO MANUAL DO CONTRATO (SISTEMA DE PRECISÃO) ---
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = pageWidth - (margin * 2);
    let currentY = 12; // Margem inicial super compacta
    let isFirstContent = true;

    const checkPageBreak = (needed: number) => {
      if (currentY + needed > 282) {
        doc.addPage();
        currentY = 12;
        return true;
      }
      return false;
    };

    // Divide o texto em parágrafos
    const paragraphs = text.split('\n');
    let inCenterBlock = false;
    let sigLineCounter = 0;

    for (let pText of paragraphs) {
      if (pText.includes('<center>')) inCenterBlock = true;
      
      let cleanText = pText.replace(/<center>/g, '').replace(/<\/center>/g, '').replace(/\*\*/g, '').trim();
      
      if (cleanText === "" && isFirstContent) continue;
      isFirstContent = false;

      // Ignora linhas totalmente vazias extras
      if (cleanText === "" && pText.trim() === "") {
          currentY += 1.5;
          continue;
      }

      const isExplicitCenter = pText.includes('<center>') || pText.includes('</center>');
      const isCenter = inCenterBlock || isExplicitCenter;
      const isBold = (pText.startsWith('**') && pText.endsWith('**')) || isCenter || isExplicitCenter;

      const isSignatureLine = cleanText.startsWith('____') || cleanText.includes('________________');
      if (isSignatureLine) {
          checkPageBreak(25); // Garante que a assinatura não quebre de página no meio
          currentY += 8; // Espaço reduzido antes da assinatura
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
                            // Sobe a assinatura para ficar EXATAMENTE em cima da linha anterior (evita cobrir o nome)
                            doc.addImage(sig.signature_image, 'PNG', (pageWidth / 2) - 25, currentY - 17, 50, 16);
                            sigLineCounter = 0;
                          } catch (imgErr) {
                            console.error("Erro ao adicionar imagem:", imgErr);
                          }
                      }
                  }
              }
          }

          currentY += 4.8; // Altura de linha reduzida (interlinhado mais elegante e compacto)
          if (sigLineCounter > 0) sigLineCounter--;
      });

      if (isSignatureLine) currentY += 1.5;
      else currentY += 0.8;

      if (pText.includes('</center>')) inCenterBlock = false;
    }

    // --- APLICAR RODAPÉS ---
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
            ip_address: "177.100.200.12 (Acesso Administrativo Seguro)",
            user_agent: navigator.userAgent,
            signer_email: "contato@vanessabidinotti.com.br",
            signer_phone: "+55 11 99999-9999",
            signer_location: "-23.5505, -46.6333 (Administração Central)",
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
        
        // Seção: Pontos de Autenticação
        doc.setFont("times", "bold");
        doc.text("PONTOS DE AUTENTICAÇÃO:", margin + 5, currentAuditY + 30);
        doc.setFont("times", "normal");
        doc.text(`Telefone: ${sig.signer_phone || "Proprietário do Sistema"}`, margin + 5, currentAuditY + 34);
        doc.text(`E-mail: ${sig.signer_email || "Autenticado via Painel Administrativo"}`, margin + 5, currentAuditY + 38);
        doc.text(`Localização: ${sig.signer_location || "Aproximada (via IP)"}`, margin + 5, currentAuditY + 42);

        doc.text(`IP: ${sig.ip_address}`, margin + 90, currentAuditY + 34);
        doc.text(`Dispositivo: ${(sig.user_agent || '').substring(0, 60)}...`, margin + 90, currentAuditY + 38, { maxWidth: maxWidth - 90 });
        
        // Desenha a imagem da assinatura no log para conferência visual
        if (sig.signature_image) {
            try {
                // Desenha a assinatura à direita das informações
                doc.addImage(sig.signature_image, 'PNG', margin + maxWidth - 55, currentAuditY + 15, 50, 20);
            } catch (e) {
                console.error("Erro no log de assinatura:", e);
            }
        }

        doc.setFontSize(9);
        doc.setTextColor(34, 197, 94);
        // Align to the right edge of the bounding box
        doc.text("✓ INTEGRIDADE GARANTIDA", margin + maxWidth - 5, currentAuditY + 10, { align: 'right' });
        doc.setTextColor(0, 0, 0);

        currentAuditY += 60;
    }

    // Texto final de conformidade legal
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
  event_location: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  address?: string;
  phone_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  spouse_name?: string;
  event_start_time?: string;
  event_end_time?: string;
  marital_status?: string;
  profession?: string;
  nationality?: string;
  couple_type?: 'tradicional' | 'noivas' | 'noivos';
  spouse_cpf?: string;
  spouse_rg?: string;
  event_address?: string;
  has_different_locations?: boolean;
  reception_location?: string;
  reception_address?: string;
  guest_count?: string | number;
  address_number?: string;
  address_complement?: string;
  extra_hour_value?: number;
}

interface Contract {
  id: number;
  bride_id: number;
  template_id: number;
  status: string;
  generated_text: string;
  zapsign_doc_id?: string;
  sign_url_admin?: string;
  sign_url_client?: string;
  signed_pdf_url?: string;
  created_at: string;
}

interface ContractTemplate {
  id: number;
  name: string;
  template_text: string;
}

interface Payment {
  id: number;
  bride_id: number;
  bride_name: string;
  description: string;
  amount_paid: number;
  payment_date: string;
  status: string;
  revenue_type?: 'assessoria' | 'bv';
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
  locations: { name: string; address: string }[];
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
  extraHourRate: number;
  zapsignToken: string;
  isSandbox: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    name: "WeddingAdviser",
    logo: "",
    description: "Gestão Premium"
  },
  services: ["Assessoria do dia", "Assessoria Completa", "Assessoria Parcial", "Consultoria"],
  partners: ["Papelaria Modelo", "Buffet X", "Uber", "Freelancer"],
  locations: [
    { name: "Espaço Villa Lobos", address: "" },
    { name: "Buffet Torres", address: "" },
    { name: "Fazenda Vila Rica", address: "" }
  ],
  goals: {
    annualRevenue: 100000,
    fineThresholdDays: 30,
    fineEarlyPercent: 50,
    fineLatePercent: 100
  },
  ui: {
    darkMode: false,
    compactMode: false
  },
  extraHourRate: 300,
  zapsignToken: '',
  isSandbox: true
};

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
  const urlParams = new URLSearchParams(window.location.search);
  const publicToken = urlParams.get('token');

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

  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [isSigningView, setIsSigningView] = useState(false);
  const [contractToSign, setContractToSign] = useState<any>(null);
  const [signatureToken, setSignatureToken] = useState<string | null>(publicToken);
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

  // Helper para fazer fetch autenticado
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    try {
      const res = await fetch(url, { ...options, headers });

      // Se token expirou, tenta renovar com refresh token
      if (res.status === 401) {
        const refreshToken = localStorage.getItem('wedding_refresh_token');
        if (refreshToken) {
          console.log('[Auth] Token expirado, tentando refresh...');
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
            // Retry a requisição original com novo token
            headers['Authorization'] = `Bearer ${refreshData.access_token}`;
            return fetch(url, { ...options, headers });
          }
        }
        // Não conseguiu renovar: faz logout
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
        .then(res => res.json())
        .then(data => {
          if (data && data.profile) {
            setSettings(prev => ({
              ...prev,
              profile: { ...prev.profile, ...data.profile }
            }));
          }
        })
        .finally(() => {
          setIsPublicBrandingLoaded(true);
          // Se não está autenticado, o loading termina aqui
          setIsInitialLoading(false);
        });
    }
  }, [isAuthenticated, isPublicBrandingLoaded]);

  useEffect(() => {
    // A tela de loading agora é controlada pelo fetchData ou fetchPublicBranding
    // Se já temos cache, podemos liberar o loading mais rápido para estética
    const hasCache = localStorage.getItem('wedding_stats') !== null;
    if (hasCache) {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    // Se não tem cache, o loading fica preso até o fetch terminar (feita nos effects acima)
  }, []);

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

  const fetchData = async (year?: string, month?: string) => {
    try {
      const y = year || filterYear;
      const m = month || filterMonth;

      // Busca dados essenciais em paralelo
      const [statsRes, bridesRes, paymentsRes, expensesRes, settingsRes] = await Promise.all([
        authFetch(`/api/dashboard/stats?year=${y}&month=${m}`),
        authFetch(`/api/brides?_t=${Date.now()}`),
        authFetch('/api/payments'),
        authFetch('/api/expenses'),
        authFetch('/api/settings')
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
        localStorage.setItem('wedding_stats', JSON.stringify(data));
      }
      if (bridesRes.ok) {
        const data = await bridesRes.json();
        setBrides(data);
        localStorage.setItem('wedding_brides', JSON.stringify(data));
      }
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data);
        localStorage.setItem('wedding_payments', JSON.stringify(data));
      }
      if (expensesRes.ok) {
        const data = await expensesRes.json();
        setExpenses(data);
        localStorage.setItem('wedding_expenses', JSON.stringify(data));
      }
      if (settingsRes.ok) {
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
        }
      }
      setIsDataLoaded(true);
      setIsInitialLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Se houver erro ou timeout, pelo menos paramos o loading para mostrar o cache
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterYear, filterMonth]);

  // Detector de Token Público (Assinatura de Contrato)
  useEffect(() => {
    if (signatureToken) {
      setIsInitialLoading(true);
      fetch(`/api/public/contract/${signatureToken}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.generated_text) {
            setContractToSign(data);
            setIsSigningView(true);
          } else {
            console.error('[SigningView] Contrato não encontrado ou sem texto gerado:', data);
          }
        })
        .catch(err => console.error('[SigningView] Erro ao buscar contrato:', err))
        .finally(() => setIsInitialLoading(false));
    }
  }, [signatureToken]);

  useEffect(() => {
    if (authToken) {
      fetchData();
    }
  }, [authToken]);

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

  if (publicToken) {
    return <SigningView token={publicToken} settings={settings} contract={contractToSign} />;
  }

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
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
            <SidebarItem icon={Users} label="Clientes" active={activeTab === 'brides'} onClick={() => handleTabChange('brides')} />
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
          ) : isSigningView ? (
            <SigningView
              key="signing"
              settings={settings}
              contract={contractToSign}
              token={signatureToken}
              onSigned={() => {
                // Opcional: recarregar dados se estiver logado
                if (isAuthenticated) fetchData();
              }}
            />
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
                setIsInitialLoading(true);
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
