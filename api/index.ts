import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { zapsignService } from "./zapsignService.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cliente padrão (anon) para operações de dados
const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || ""
);

// Cliente admin (service_role) para autenticação server-side - NUNCA expor no front-end
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Middleware de Autenticação ---
const requireAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Não autorizado. Faça login novamente.' });
    }

    // Valida o token JWT com o Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    }

    (req as any).user = user;
    next();
};

// --- Rota de Login ---
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
        console.error('[AUTH] Login falhou:', error?.message);
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    // Retorna apenas o token e dados básicos do usuário - SEM SENHA
    return res.json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email
        }
    });
});

// --- Rota de Logout ---
app.post("/api/auth/logout", requireAuth, async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.slice(7);
    if (token) await supabaseAdmin.auth.admin.signOut(token);
    return res.json({ success: true });
});

// --- Rota de Refresh Token ---
app.post("/api/auth/refresh", async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'refresh_token é obrigatório.' });

    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
    if (error || !data.session) {
        return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }

    return res.json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
    });
});
// --- Rota Pública de Configurações (para branding na tela de login) ---
app.get("/api/public/settings", async (req, res) => {
    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error || !users || users.length === 0) return res.json({});

        // Pega o rodrigo ou o primeiro usuário da lista
        const owner = users.find((u: any) => u.email === 'rodrigoindalecio@hotmail.com') || users[0];

        const settings = owner.user_metadata?.app_settings || {};
        // Retorna apenas os dados de branding necessários
        res.json({
            profile: settings.profile || {}
        });
    } catch (e) {
        res.json({});
    }
});

// --- Rota de Alteração de Senha ---
app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    const { new_password } = req.body;
    const user = (req as any).user;

    if (!new_password || new_password.length < 8) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: new_password
    });

    if (error) {
        console.error('[AUTH] Erro ao alterar senha:', error.message);
        return res.status(500).json({ error: 'Não foi possível alterar a senha. Tente novamente.' });
    }

    return res.json({ success: true, message: 'Senha alterada com sucesso!' });
});

// --- Rotas de Configurações e Perfil (Persistência no DB via User Metadata) ---
app.get("/api/settings", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const { data: { user: latestUser }, error } = await supabaseAdmin.auth.admin.getUserById(user.id);

    if (error || !latestUser) return res.status(500).json({ error: 'Erro ao buscar configurações' });
    res.json(latestUser.user_metadata?.app_settings || {});
});

app.post("/api/settings", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const settings = req.body;

    const { data: { user: latestUser }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (fetchError || !latestUser) return res.status(500).json({ error: 'Erro ao buscar usuário' });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...latestUser.user_metadata, app_settings: settings }
    });

    if (error) return res.status(500).json(error);
    res.json({ success: true });
});

app.post("/api/profile", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const { name } = req.body;

    const { data: { user: latestUser }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (fetchError || !latestUser) return res.status(500).json({ error: 'Erro ao buscar usuário' });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...latestUser.user_metadata, name }
    });

    if (error) return res.status(500).json(error);
    res.json({ success: true });
});

// === API Routes (todas protegidas por autenticação) ===
app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
        const now = new Date();
        const queryYear = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
        const queryMonth = req.query.month ? (req.query.month === 'all' ? 'all' : parseInt(req.query.month as string)) : (now.getMonth() + 1);

        const targetYear = queryYear;
        const targetMonth = queryMonth === 'all' ? null : queryMonth - 1; // 0-indexed if not 'all'

        // Log for debugging
        console.log(`[DASHBOARD FETCH] Year: ${targetYear}, Month: ${queryMonth}`);

        // Fetch data from the beginning of the previous year to ensure we have enough context for trends
        const fetchFromDate = `${targetYear - 1}-01-01`;

        const [pastPaymentsRes, unpaidPaymentsRes, expensesRes, bridesRes] = await Promise.all([
            supabase.from("payments").select("*").gte("payment_date", fetchFromDate),
            supabase.from("payments").select("*").neq("status", "pago"),
            supabase.from("expenses").select("*").gte("date", fetchFromDate),
            supabase.from("brides").select("id, status, balance, contract_value, event_date, original_value")
        ]);

        if (bridesRes.error) throw bridesRes.error;
        const brides = bridesRes.data || [];

        // Combine unique payments
        const paymentMap = new Map();
        (pastPaymentsRes.data || []).forEach(p => paymentMap.set(p.id, p));
        (unpaidPaymentsRes.data || []).forEach(p => paymentMap.set(p.id, p));
        const allPayments = Array.from(paymentMap.values());

        const allExpenses = expensesRes.data || [];

        // Unified Number Parser (handles R$, dots, commas, spaces, strings, numbers)
        const pureNum = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            let s = val.toString().replace(/[R$\s]/g, '');
            if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
            else if (s.includes(',')) s = s.replace(',', '.');
            return parseFloat(s) || 0;
        };

        const isPaid = (status: string) => (status || '').trim().toLowerCase() === 'pago';

        const parseDateRobust = (d: any): { y: number, m: number } | null => {
            if (!d) return null;
            const s = String(d).split('T')[0];
            const parts = s.includes('-') ? s.split('-') : s.split('/');
            if (parts.length < 2) return null;

            let y = parseInt(parts[0]);
            let m = parseInt(parts[1]);

            if (y < 1000) { // Format is DD/MM/YYYY
                y = parseInt(parts[2]);
                m = parseInt(parts[1]);
            }
            return { y, m };
        };

        const isSelectedPeriod = (d: any) => {
            const parsed = parseDateRobust(d);
            if (!parsed) return false;

            if (queryMonth === 'all') return parsed.y === targetYear;
            return parsed.y === targetYear && (parsed.m - 1) === targetMonth; // parsed.m is 1-12, targetMonth is 0-11
        };

        const isThisYear = (dateStr: string) => {
            const parsed = parseDateRobust(dateStr);
            if (!parsed) return false;
            return parsed.y === targetYear;
        };

        // For trend calculation, we need "Previous Period"
        // If month is selected: Previous Month
        // If year is selected: Previous Year
        let prevPeriodRevenue = 0;
        let prevPeriodExpenses = 0;

        if (queryMonth === 'all') {
            const prevYear = targetYear - 1;
            prevPeriodRevenue = allPayments
                .filter(p => p.payment_date?.startsWith(prevYear.toString()) && isPaid(p.status) && pureNum(p.amount_paid) > 0)
                .reduce((sum, p) => sum + pureNum(p.amount_paid), 0);

            // Expenses for prev year
            const expT = allExpenses.filter(e => e.date?.startsWith(prevYear.toString())).reduce((sum, e) => sum + pureNum(e.amount), 0);
            const expL = allPayments.filter(p => p.payment_date?.startsWith(prevYear.toString()) && (String(p.bride_id) === '212' || pureNum(p.amount_paid) < 0))
                .reduce((sum, p) => sum + Math.abs(pureNum(p.amount_paid)), 0);
            prevPeriodExpenses = expT + expL;
        } else {
            const prevDate = new Date(targetYear, targetMonth! - 1, 1);
            const pY = prevDate.getFullYear();
            const pM = prevDate.getMonth();
            const isPrevMonth = (d: string) => {
                const parsed = parseDateRobust(d);
                if (!parsed) return false;
                return parsed.y === pY && (parsed.m - 1) === pM;
            };
            prevPeriodRevenue = allPayments
                .filter(p => isPrevMonth(p.payment_date) && isPaid(p.status) && pureNum(p.amount_paid) > 0)
                .reduce((sum, p) => sum + pureNum(p.amount_paid), 0);

            const expT = allExpenses.filter(e => isPrevMonth(e.date)).reduce((sum, e) => sum + pureNum(e.amount), 0);
            const expL = allPayments.filter(p => isPrevMonth(p.payment_date) && (String(p.bride_id) === '212' || pureNum(p.amount_paid) < 0))
                .reduce((sum, p) => sum + Math.abs(pureNum(p.amount_paid)), 0);
            prevPeriodExpenses = expT + expL;
        }

        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? "+100,0%" : "0,0%";
            const diff = ((curr - prev) / prev) * 100;
            return (diff >= 0 ? "+" : "") + diff.toFixed(1).replace('.', ',') + "%";
        };

        // Monthly Revenue Breakdown (Now "Selected Period")
        const monthlyRevenue = allPayments
            .filter(p => isSelectedPeriod(p.payment_date) && isPaid(p.status) && pureNum(p.amount_paid) > 0)
            .reduce((sum, p) => sum + pureNum(p.amount_paid), 0);

        const monthlyAssessoriaRevenue = allPayments
            .filter(p => isSelectedPeriod(p.payment_date) && isPaid(p.status) && pureNum(p.amount_paid) > 0 && (p.revenue_type === 'assessoria' || (!p.revenue_type && String(p.bride_id) !== '58')))
            .reduce((sum, p) => sum + pureNum(p.amount_paid), 0);

        const monthlyBVRevenue = allPayments
            .filter(p => isSelectedPeriod(p.payment_date) && isPaid(p.status) && pureNum(p.amount_paid) > 0 && (p.revenue_type === 'bv' || (!p.revenue_type && String(p.bride_id) === '58')))
            .reduce((sum, p) => sum + pureNum(p.amount_paid), 0);

        const yearlyRevenue = allPayments
            .filter(p => isThisYear(p.payment_date) && isPaid(p.status) && pureNum(p.amount_paid) > 0)
            .reduce((sum, p) => sum + pureNum(p.amount_paid), 0);

        const revenueTrend = calcTrend(monthlyRevenue, prevPeriodRevenue);

        // Monthly Expenses (Now "Selected Period")
        const currentExpensesTable = allExpenses
            .filter(e => isSelectedPeriod(e.date))
            .reduce((sum, e) => sum + pureNum(e.amount), 0);

        const currentExpensesLegacy = allPayments
            .filter(p => isSelectedPeriod(p.payment_date) && (String(p.bride_id) === '212' || pureNum(p.amount_paid) < 0))
            .reduce((sum, p) => sum + Math.abs(pureNum(p.amount_paid)), 0);

        const currentExpenses = currentExpensesTable + currentExpensesLegacy;

        const yearlyExpensesTable = allExpenses
            .filter(e => isThisYear(e.date))
            .reduce((sum, e) => sum + pureNum(e.amount), 0);
        const yearlyExpensesLegacy = allPayments
            .filter(p => isThisYear(p.payment_date) && (String(p.bride_id) === '212' || pureNum(p.amount_paid) < 0))
            .reduce((sum, p) => sum + Math.abs(pureNum(p.amount_paid)), 0);
        const yearlyExpenses = yearlyExpensesTable + yearlyExpensesLegacy;

        const expensesTrend = calcTrend(currentExpenses, prevPeriodExpenses);

        // PENDING CALCULATION: Based on balance of active brides, using payment deadline
        // Payment deadline = event_date - PAYMENT_ALERT_DAYS (configurable)
        const PAYMENT_ALERT_DAYS = 10; // days before event that payment is due

        const activeBrides = (brides || []).filter(b => {
            const st = (b.status || '').toLowerCase().trim();
            // Just exclude specifically canceled ones and the test ID 58
            return st !== 'cancelado' && String(b.id) !== '58';
        });
        const bridesWithBalance = activeBrides.filter(b => (b.status || '').toLowerCase().trim() === 'ativa' && pureNum(b.balance) > 0);

        // Calculate payment deadline for each bride
        const getDeadline = (eventDate: string) => {
            if (!eventDate) return null;
            const d = new Date(eventDate.split('T')[0] + 'T12:00:00');
            if (isNaN(d.getTime())) return null;
            d.setDate(d.getDate() - PAYMENT_ALERT_DAYS);
            return d;
        };

        // Main card value: balance of brides whose payment deadline falls in the selected period
        const pendingSelectedPeriod = bridesWithBalance
            .filter(b => {
                const dl = getDeadline(b.event_date);
                if (!dl) return false;

                if (queryMonth === 'all') {
                    return dl.getFullYear() === targetYear;
                } else {
                    // Specific month: show what is due in that month OR overdue if we are in that month
                    const isDueInMonth = dl.getFullYear() === targetYear && dl.getMonth() === targetMonth;

                    // If we are looking at the REAL current month, include overdue
                    const realToday = new Date();
                    const isLookingAtRealCurrentMonth = targetYear === realToday.getFullYear() && targetMonth === realToday.getMonth();

                    if (isLookingAtRealCurrentMonth) {
                        const endOfTargetMonth = new Date(targetYear, targetMonth! + 1, 0, 23, 59, 59);
                        return dl <= endOfTargetMonth;
                    }

                    return isDueInMonth;
                }
            })
            .reduce((sum, b) => sum + pureNum(b.balance), 0);

        const yearlyPending = bridesWithBalance
            .filter(b => {
                const dl = getDeadline(b.event_date);
                return dl && dl.getFullYear() === targetYear;
            })
            .reduce((sum, b) => sum + pureNum(b.balance), 0);

        const pendingPayments = pendingSelectedPeriod;

        // Breakdown by year of payment deadline
        const pending2026 = bridesWithBalance
            .filter(b => { const dl = getDeadline(b.event_date); return dl && dl.getFullYear() === 2026; })
            .reduce((sum, b) => sum + pureNum(b.balance), 0);
        const pending2027 = bridesWithBalance
            .filter(b => { const dl = getDeadline(b.event_date); return dl && dl.getFullYear() === 2027; })
            .reduce((sum, b) => sum + pureNum(b.balance), 0);
        const pending2028 = bridesWithBalance
            .filter(b => { const dl = getDeadline(b.event_date); return dl && dl.getFullYear() === 2028; })
            .reduce((sum, b) => sum + pureNum(b.balance), 0);

        // BRIDES/EVENTS CALCULATION: Grouped by event year (ONLY ATIVA)
        const strictlyActiveBrides = activeBrides.filter(b => (b.status || '').toLowerCase().trim() === 'ativa');

        const activeEventsInPeriod = strictlyActiveBrides
            .filter(b => isSelectedPeriod(b.event_date)).length;

        const activeEventsY1 = strictlyActiveBrides.filter(b => parseDateRobust(b.event_date)?.y === targetYear).length;
        const activeEventsY2 = strictlyActiveBrides.filter(b => parseDateRobust(b.event_date)?.y === (targetYear + 1)).length;
        const activeEventsY3 = strictlyActiveBrides.filter(b => parseDateRobust(b.event_date)?.y === (targetYear + 2)).length;
        const activeBridesTrend = "0%";



        // E. CHART DATA
        const chartData = [];
        const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

        if (queryMonth === 'all') {
            // Show all 12 months of the selected year
            for (let m = 0; m < 12; m++) {
                const y = targetYear;

                const rev = allPayments.filter(p => {
                    const parsed = parseDateRobust(p.payment_date);
                    return parsed && parsed.y === y && (parsed.m - 1) === m && isPaid(p.status) && pureNum(p.amount_paid) > 0;
                }).reduce((s, p) => s + pureNum(p.amount_paid), 0);

                const expT = allExpenses.filter(e => {
                    const parsed = parseDateRobust(e.date);
                    return parsed && parsed.y === y && (parsed.m - 1) === m;
                }).reduce((s, e) => s + pureNum(e.amount), 0);

                const expL = allPayments.filter(p => {
                    const parsed = parseDateRobust(p.payment_date);
                    const isM = parsed && parsed.y === y && (parsed.m - 1) === m;
                    return isM && (String(p.bride_id) === '212' || pureNum(p.amount_paid) < 0);
                }).reduce((s, p) => s + Math.abs(pureNum(p.amount_paid)), 0);

                chartData.push({ month: monthNames[m], revenue: rev, expenses: expT + expL });
            }
        } else {
            // Show last 6 months leading up to the selected month
            for (let i = 5; i >= 0; i--) {
                const d = new Date(targetYear, targetMonth! - i, 1);
                const m = d.getMonth(); const y = d.getFullYear();

                const rev = allPayments.filter(p => {
                    const parsed = parseDateRobust(p.payment_date);
                    return parsed && parsed.y === y && (parsed.m - 1) === m && isPaid(p.status) && pureNum(p.amount_paid) > 0;
                }).reduce((s, p) => s + pureNum(p.amount_paid), 0);

                const expT = allExpenses.filter(e => {
                    const parsed = parseDateRobust(e.date);
                    return parsed && parsed.y === y && (parsed.m - 1) === m;
                }).reduce((s, e) => s + pureNum(e.amount), 0);

                const expL = allPayments.filter(p => {
                    const parsed = parseDateRobust(p.payment_date);
                    const isM = parsed && parsed.y === y && (parsed.m - 1) === m;
                    return isM && (String(p.bride_id) === '212' || pureNum(p.amount_paid) < 0);
                }).reduce((s, p) => s + Math.abs(pureNum(p.amount_paid)), 0);

                chartData.push({ month: monthNames[m], revenue: rev, expenses: expT + expL });
            }
        }

        // F. PHASE 1 & CANCELLATIONS - Cálculo de Ticket Médio e Volume de Eventos
        const matchedBrides = activeBrides.filter(b => {
            if (!b.event_date) return false;
            // Extração robusta de Ano e Mês da string de data
            const datePart = String(b.event_date).split('T')[0];
            const parts = datePart.includes('-') ? datePart.split('-') : datePart.split('/');

            if (parts.length < 2) return false;

            // Assume formato YYYY-MM-DD ou DD/MM/YYYY
            let y = parseInt(parts[0]);
            let m = parseInt(parts[1]);

            if (y < 1000) { // Provavelmente DD/MM/YYYY
                y = parseInt(parts[2]);
                m = parseInt(parts[1]);
            }

            if (queryMonth === 'all') {
                return y === targetYear;
            } else {
                return y === targetYear && m === (targetMonth + 1);
            }
        });

        const totalValue = matchedBrides.reduce((sum, b) => {
            const val = Math.max(pureNum(b.contract_value), pureNum(b.original_value));
            return sum + val;
        }, 0);

        const ticketMedio = matchedBrides.length > 0 ? (totalValue / matchedBrides.length) : 0;
        const totalEventsInPeriod = matchedBrides.length;

        const efficiency = monthlyRevenue > 0 ? ((monthlyRevenue - currentExpenses) / monthlyRevenue) * 100 : 0;
        const mediaMensal = yearlyRevenue / 12;

        // YoY (Year Over Year) Growth - Baseado em CONTRATOS FECHADOS (Volume de Negócios)
        const currentYearBookings = (brides || [])
            .filter(b => parseDateRobust(b.event_date)?.y === targetYear)
            .reduce((sum, b) => sum + pureNum(b.contract_value), 0);

        const prevYearBookings = (brides || [])
            .filter(b => parseDateRobust(b.event_date)?.y === (targetYear - 1))
            .reduce((sum, b) => sum + pureNum(b.contract_value), 0);

        const growthYoY = calcTrend(currentYearBookings, prevYearBookings);

        // Cancellations Analysis
        const canceledBrides = (brides || []).filter(b => (b.status || '').toLowerCase() === 'cancelado');
        const canceledInPeriod = canceledBrides.filter(b => isSelectedPeriod(b.event_date));
        const canceledRevenue = canceledInPeriod.reduce((sum, b) => sum + pureNum(b.contract_value), 0); // Contract value for canceled is the fine
        const lostRevenue = canceledInPeriod.reduce((sum, b) => sum + (pureNum(b.original_value) - pureNum(b.contract_value)), 0);

        res.json({
            activeBrides: activeEventsInPeriod,
            activeBridesBreakdown: { year1: activeEventsY1, year2: activeEventsY2, year3: activeEventsY3, label1: targetYear.toString(), label2: (targetYear + 1).toString(), label3: (targetYear + 2).toString() },
            activeBridesTrend,
            monthlyRevenue,
            yearlyRevenue,
            revenueTrend,
            revenueBreakdown: { assessoria: monthlyAssessoriaRevenue, bv: monthlyBVRevenue },
            pendingPayments,
            yearlyPending,
            pendingBreakdown: { year2026: pending2026, year2027: pending2027, year2028: pending2028 },
            monthlyExpenses: currentExpenses,
            yearlyExpenses,
            expensesTrend,
            chartData: chartData,
            // Phase 1 Extras
            ticketMedio,
            efficiency: efficiency.toFixed(1).replace('.', ',') + "%",
            mediaMensal,
            growthYoY,
            growthYoYBreakdown: {
                current: currentYearBookings,
                previous: prevYearBookings
            },
            // Cancellation Extras
            cancellations: {
                count: canceledInPeriod.length,
                revenue: canceledRevenue,
                lost: lostRevenue
            }
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

const pureNum = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    let s = val.toString().replace(/[R$\s]/g, '');
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.includes(',')) s = s.replace(',', '.');
    return parseFloat(s) || 0;
};

// Helper function to keep balance in sync based on ALL payments
const refreshBrideBalance = async (brideId: any) => {
    if (!brideId || String(brideId) === '58') return;

    // 1. Get all paid assessoria payments for this bride
    const { data: payments } = await supabase
        .from("payments")
        .select("amount_paid")
        .eq("bride_id", brideId)
        .ilike("status", "pago")
        .eq("revenue_type", "assessoria");

    const totalPaid = (payments || []).reduce((sum, p) => sum + pureNum(p.amount_paid), 0);

    // 2. Get bride contract value
    const { data: bride } = await supabase
        .from("brides")
        .select("contract_value, status")
        .eq("id", brideId)
        .single();

    if (bride) {
        // Se cancelado, o contract_value já é o valor da multa
        const newBalance = Math.max(0, pureNum(bride.contract_value) - totalPaid);
        await supabase.from("brides").update({ balance: newBalance }).eq("id", brideId);
    }
};

app.get("/api/brides", requireAuth, async (req, res) => {
    const { data, error } = await supabase
        .from("brides")
        .select("*")
        .order("name", { ascending: true });

    if (error) return res.status(500).json(error);
    res.json(data);
});

app.post("/api/brides", requireAuth, async (req, res) => {
    const {
        name, email, event_date, service_type, contract_value, original_value,
        cpf, rg, birth_date, address, phone_number, neighborhood, city, state, zip_code,
        spouse_name, event_start_time, event_end_time, event_location, signer_type,
        marital_status, profession, nationality, couple_type, spouse_cpf, spouse_rg,
        event_address, has_different_locations, reception_location, reception_address, guest_count,
        address_number, address_complement, extra_hour_value
    } = req.body;
    // Initial balance is the contract value
    const cv = pureNum(contract_value);
    const ov = pureNum(original_value);
    const initialBalance = cv || ov || 0;

    // Remove explicit ID if present to let DB auto-increment safely
    const payload = {
        name,
        email,
        event_date: event_date || null,
        event_location: event_location || null,
        service_type,
        contract_value: cv,
        original_value: ov,
        balance: initialBalance,
        status: 'Ativa',
        cpf, rg, birth_date: birth_date || null, address, phone_number,
        neighborhood, city, state, zip_code,
        spouse_name, event_start_time, event_end_time, signer_type,
        marital_status, profession, nationality, couple_type, spouse_cpf, spouse_rg,
        event_address, has_different_locations, reception_location, reception_address,
        guest_count: guest_count !== "" && guest_count !== null ? parseInt(guest_count, 10) : null,
        address_number, address_complement,
        extra_hour_value: extra_hour_value !== undefined ? pureNum(extra_hour_value) : null
    };

    const { data, error } = await supabase
        .from("brides")
        .insert([payload])
        .select();

    if (error) {
        // Se der erro de chave duplicada, vamos tentar "resetar" a sequência no banco
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
            console.log("Recuperando de erro de sequência... Tentando re-sincronizar IDs.");
            // Truque para forçar o Supabase/Postgres a atualizar o contador interno
            // (Busca o maior ID e tenta inserir algo depois dele, ou avisa o usuário do comando SQL)
            // Nota: No Supabase SQL Editor: SELECT setval('brides_id_seq', (SELECT MAX(id) FROM brides));
        }
        return res.status(500).json(error);
    }
    res.json(data[0]);
});

app.get("/api/payments", requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("payments")
            .select(`
        *,
        brides:bride_id (
          name
        )
      `)
            .order("payment_date", { ascending: false });

        if (error) {
            console.error("Get payments error, fallback to raw fetch:", error);
            const { data: rawData, error: rawError } = await supabase.from("payments").select("*").order("payment_date", { ascending: false });
            if (rawError) throw rawError;
            return res.json(rawData.map(p => ({ ...p, bride_name: `ID: ${p.bride_id}` })));
        }

        const formattedData = data.map(p => ({
            ...p,
            bride_name: (p as any).brides?.name || `ID: ${p.bride_id}`
        }));

        res.json(formattedData);
    } catch (err) {
        console.error("Critical error in /api/payments:", err);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});

app.post("/api/payments", requireAuth, async (req, res) => {
    const { bride_id, description, amount_paid, payment_date, status, revenue_type } = req.body;
    const finalDate = payment_date && payment_date !== "" ? payment_date : new Date().toISOString().split('T')[0];
    const finalRevenueType = revenue_type || (String(bride_id) === '58' ? 'bv' : 'assessoria');

    // 1. Insert the payment
    const { data, error } = await supabase
        .from("payments")
        .insert([{
            bride_id,
            description,
            amount_paid,
            payment_date: finalDate,
            status: status || 'Pago',
            revenue_type: finalRevenueType
        }])
        .select()
        .single();

    if (error) {
        console.error("Post payment error:", error);
        return res.status(500).json(error);
    }

    // 2. If the payment is 'Pago', refresh the bride's balance
    if ((status || 'Pago').trim().toLowerCase() === 'pago') {
        if (finalRevenueType === 'assessoria' && String(bride_id) !== '58') {
            await refreshBrideBalance(bride_id);
        }
    }

    res.json(data);
});

app.patch("/api/brides/:id/status", requireAuth, async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const brideIdNum = Number(id);

    const toNum = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        let s = val.toString().replace(/[R$\s]/g, '');
        if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
        else if (s.includes(',')) s = s.replace(',', '.');
        return parseFloat(s) || 0;
    };

    // V4: Lógica de Detecção por Dados (mais robusta que por texto)
    const isDistrato = body.fine_amount !== undefined;

    try {
        if (isDistrato) {
            const fine = toNum(body.fine_amount);
            const original = toNum(body.original_value);

            // 1. Pega pagamentos para o saldo
            const { data: payments } = await supabase
                .from("payments")
                .select("amount_paid")
                .eq("bride_id", brideIdNum)
                .ilike("status", "pago");

            const totalPaid = (payments || []).reduce((sum, p) => sum + toNum(p.amount_paid), 0);
            const newBalance = Math.max(0, fine - totalPaid);

            const updateData = {
                status: 'Cancelado',
                contract_value: fine,
                original_value: original,
                balance: newBalance
            };

            console.log(`[V4 DISTRATO] ID ${id}:`, updateData);

            // 2. Update Atômico
            const { error } = await supabase
                .from("brides")
                .update(updateData)
                .eq("id", brideIdNum);

            if (error) throw error;
            return res.json({ success: true, version: 'V4', type: 'distrato', updateData });
        }

        // Fluxo normal
        const { error } = await supabase
            .from("brides")
            .update({ status: body.status })
            .eq("id", brideIdNum);

        if (error) throw error;
        res.json({ success: true, version: 'V4', type: 'status_only' });
    } catch (err) {
        console.error("[V4 ERROR]:", err);
        res.status(500).json({ error: err });
    }
});

app.put("/api/brides/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { name, email, event_date, service_type, contract_value, original_value } = req.body;

    const { error } = await supabase
        .from("brides")
        .update({
            name,
            email,
            event_date: event_date || null,
            event_location: req.body.event_location || null,
            service_type,
            contract_value: pureNum(contract_value),
            original_value: pureNum(original_value),
            cpf: req.body.cpf,
            rg: req.body.rg,
            birth_date: req.body.birth_date || null,
            spouse_name: req.body.spouse_name,
            phone_number: req.body.phone_number,
            event_start_time: req.body.event_start_time,
            event_end_time: req.body.event_end_time,
            signer_type: req.body.signer_type,
            address: req.body.address,
            neighborhood: req.body.neighborhood,
            city: req.body.city,
            state: req.body.state,
            zip_code: req.body.zip_code,
            marital_status: req.body.marital_status,
            profession: req.body.profession,
            nationality: req.body.nationality,
            couple_type: req.body.couple_type,
            spouse_cpf: req.body.spouse_cpf,
            spouse_rg: req.body.spouse_rg,
            event_address: req.body.event_address,
            has_different_locations: req.body.has_different_locations,
            reception_location: req.body.reception_location,
            reception_address: req.body.reception_address,
            guest_count: req.body.guest_count !== "" && req.body.guest_count !== null ? parseInt(req.body.guest_count, 10) : null,
            address_number: req.body.address_number,
            address_complement: req.body.address_complement,
            extra_hour_value: req.body.extra_hour_value !== undefined ? pureNum(req.body.extra_hour_value) : null
        })
        .eq("id", id);

    if (error) {
        console.error("Update bride error:", error);
        return res.status(500).json(error);
    }

    // Recalcula o saldo pois o valor do contrato pode ter mudado ... 
    await refreshBrideBalance(id);

    res.json({ success: true });
});

app.delete("/api/brides/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from("brides").delete().eq("id", id);
    if (error) return res.status(500).json(error);
    res.json({ success: true });
});

app.get("/api/expenses", requireAuth, async (req, res) => {
    const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

    if (error) {
        console.error("Get expenses error:", error);
        return res.status(500).json(error);
    }
    res.json(data);
});

app.post("/api/expenses", requireAuth, async (req, res) => {
    const { description, amount, date, category } = req.body;
    const finalDate = date && date !== "" ? date : new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from("expenses")
        .insert([{
            description,
            amount: Number(amount) || 0,
            date: finalDate,
            category: category || 'Geral'
        }])
        .select()
        .single();

    if (error) {
        console.error("Post expense error:", error);
        return res.status(500).json(error);
    }
    res.json(data);
});

// --- Rotas de Contratos ---

app.get("/api/contract-templates", requireAuth, async (req, res) => {
    const { data, error } = await supabase.from("contract_templates").select("*").order("name");
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.post("/api/contracts/preview", requireAuth, async (req, res) => {
    const { template_id, bride_id, custom_text } = req.body;
    try {
        let textToRender = custom_text;
        if (!textToRender && template_id) {
            const { data: template } = await supabase.from("contract_templates").select("template_text").eq("id", template_id).single();
            textToRender = template?.template_text;
        }

        const rendered = await zapsignService.renderTemplate(textToRender, bride_id);
        res.json({ rendered });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/contracts", requireAuth, async (req, res) => {
    const { bride_id, template_id, generated_text } = req.body;
    const { data, error } = await supabase.from("contracts").insert([{
        bride_id,
        template_id,
        generated_text,
        status: 'draft'
    }]).select().single();

    if (error) return res.status(500).json(error);
    res.json(data);
});

app.post("/api/contracts/:id/send", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { signer_type } = req.body; // 'noiva' ou 'noivo'
    const user = (req as any).user;
    const userSettings = user?.user_metadata?.app_settings || {};

    console.log(`[ZapSign] Iniciando envio do contrato ${id} para o usuário: ${user?.email}`);
    console.log(`[ZapSign] Configurações encontradas:`, { hasToken: !!userSettings.zapsignToken, isSandbox: userSettings.isSandbox });

    try {
        const result = await zapsignService.sendToZapSign(id, signer_type, {
            zapsignToken: userSettings.zapsignToken,
            isSandbox: userSettings.isSandbox
        });
        console.log(`[ZapSign] Documento criado com sucesso: ${result.open_id}`);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/contracts", requireAuth, async (req, res) => {
    const { data, error } = await supabase
        .from("contracts")
        .select(`*, brides(name)`)
        .order("created_at", { ascending: false });
    if (error) return res.status(500).json(error);
    res.json(data);
});

export default app;

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

// Função para iniciar o servidor (usada localmente)
export async function startServer() {
    const rootDir = path.resolve(__dirname, "..");

    if (process.env.NODE_ENV !== "production") {
        // Importação dinâmica para evitar que o Vercel tente carregar o Vite em produção
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
            root: rootDir
        });
        app.use(vite.middlewares);
    } else {
        app.use(express.static(path.join(rootDir, "dist")));
        app.get("*", (req, res) => {
            res.sendFile(path.join(rootDir, "dist", "index.html"));
        });
    }

    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
