import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || ""
);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/dashboard/stats", async (req, res) => {
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
            .filter(p => isSelectedPeriod(p.payment_date) && isPaid(p.status) && pureNum(p.amount_paid) > 0 && String(p.bride_id) !== '58')
            .reduce((sum, p) => sum + pureNum(p.amount_paid), 0);

        const monthlyBVRevenue = allPayments
            .filter(p => isSelectedPeriod(p.payment_date) && isPaid(p.status) && pureNum(p.amount_paid) > 0 && String(p.bride_id) === '58')
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

app.get("/api/brides", async (req, res) => {
    const { data, error } = await supabase
        .from("brides")
        .select("*")
        .order("name", { ascending: true });

    if (error) return res.status(500).json(error);
    res.json(data);
});

app.post("/api/brides", async (req, res) => {
    const { name, email, event_date, service_type, contract_value, original_value } = req.body;
    // Initial balance is the contract value
    const pureNum = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        let s = val.toString().replace(/[R$\s]/g, '');
        if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
        else if (s.includes(',')) s = s.replace(',', '.');
        return parseFloat(s) || 0;
    };
    const initialBalance = pureNum(contract_value) || pureNum(original_value) || 0;

    const { data, error } = await supabase
        .from("brides")
        .insert([{
            name,
            email,
            event_date: event_date || null,
            service_type,
            contract_value,
            original_value,
            balance: initialBalance,
            status: 'Ativa'
        }])
        .select();

    if (error) return res.status(500).json(error);
    res.json(data[0]);
});

app.get("/api/payments", async (req, res) => {
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

app.post("/api/payments", async (req, res) => {
    const { bride_id, description, amount_paid, payment_date, status } = req.body;
    const finalDate = payment_date && payment_date !== "" ? payment_date : new Date().toISOString().split('T')[0];

    // 1. Insert the payment
    const { data, error } = await supabase
        .from("payments")
        .insert([{
            bride_id,
            description,
            amount_paid,
            payment_date: finalDate,
            status: status || 'Pago'
        }])
        .select()
        .single();

    if (error) {
        console.error("Post payment error:", error);
        return res.status(500).json(error);
    }

    // 2. If the payment is 'Pago', subtract from the bride's balance
    if ((status || 'Pago').trim().toLowerCase() === 'pago') {
        const pureNum = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            let s = val.toString().replace(/[R$\s]/g, '');
            if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
            else if (s.includes(',')) s = s.replace(',', '.');
            return parseFloat(s) || 0;
        };

        const paidAmount = pureNum(amount_paid);
        const { data: bride } = await supabase.from("brides").select("balance").eq("id", bride_id).single();

        if (bride) {
            const newBalance = Math.max(0, (bride.balance || 0) - paidAmount);
            await supabase.from("brides").update({ balance: newBalance }).eq("id", bride_id);
        }
    }

    res.json(data);
});

app.patch("/api/brides/:id/status", async (req, res) => {
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

app.put("/api/brides/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, event_date, service_type, contract_value, original_value } = req.body;

    const { error } = await supabase
        .from("brides")
        .update({
            name,
            email,
            event_date,
            service_type,
            contract_value,
            original_value
        })
        .eq("id", id);

    if (error) return res.status(500).json(error);
    res.json({ success: true });
});

app.delete("/api/brides/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from("brides").delete().eq("id", id);
    if (error) return res.status(500).json(error);
    res.json({ success: true });
});

app.get("/api/expenses", async (req, res) => {
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

app.post("/api/expenses", async (req, res) => {
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

export default app;

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
