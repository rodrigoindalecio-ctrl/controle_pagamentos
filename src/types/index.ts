export interface Bride {
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

export interface Contract {
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

export interface ContractTemplate {
  id: number;
  name: string;
  template_text: string;
}

export interface Payment {
  id: number;
  bride_id: number;
  bride_name: string;
  description: string;
  amount_paid: number;
  payment_date: string;
  status: string;
  revenue_type?: 'assessoria' | 'bv';
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface DashboardStats {
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

export interface AppSettings {
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

export const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    name: 'Vanessa Bidinotti',
    logo: '',
    description: 'Assessoria & Cerimonial'
  },
  services: ['Assessoria Completa', 'Assessoria Final', 'Cerimonial do Dia'],
  partners: [],
  locations: [],
  goals: {
    annualRevenue: 150000,
    fineThresholdDays: 180,
    fineEarlyPercent: 20,
    fineLatePercent: 50
  },
  ui: {
    darkMode: false,
    compactMode: false
  },
  extraHourRate: 350,
  zapsignToken: '',
  isSandbox: true
};
