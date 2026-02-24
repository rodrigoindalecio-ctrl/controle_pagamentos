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
        // 1. Fetch brides and sum the 'balance' column
        const { data: brides, error: brideError } = await supabase
            .from("brides")
            .select("id, status, balance, contract_value, event_date");

        if (brideError) throw brideError;

        // 2. Fetch payments and expenses
        // We fetch in two parts to avoid Supabase's 1000 row default limit:
        // a) Payments from the last 6 months (for revenue and chart)
        // b) All unpaid payments (for pending breakdown)
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];

        const [pastPaymentsRes, unpaidPaymentsRes, expensesRes] = await Promise.all([
            supabase.from("payments").select("*").gte("payment_date", sixMonthsAgo),
            supabase.from("payments").select("*").neq("status", "pago"),
            supabase.from("expenses").select("*").gte("date", sixMonthsAgo)
        ]);

        // Combine unique payments
        const paymentMap = new Map();
        (pastPaymentsRes.data || []).forEach(p => paymentMap.set(p.id, p));
        (unpaidPaymentsRes.data || []).forEach(p => paymentMap.set(p.id, p));
        const allPayments = Array.from(paymentMap.values());

        const allExpenses = expensesRes.data || [];

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

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

        const isThisMonth = (dateStr: string) => {
            if (!dateStr) return false;
            const parts = dateStr.split('T')[0].split('-');
            if (parts.length < 2) return false;
            const match = parseInt(parts[0]) === currentYear && (parseInt(parts[1]) - 1) === currentMonth;
            return match;
        };

        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastYear = lastMonthDate.getFullYear();

        const isLastMonth = (dateStr: string) => {
            if (!dateStr) return false;
            const parts = dateStr.split('T')[0].split('-');
            if (parts.length < 2) return false;
            return parseInt(parts[0]) === lastYear && (parseInt(parts[1]) - 1) === lastMonth;
        };

        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? "+100,0%" : "0,0%";
            const diff = ((curr - prev) / prev) * 100;
            return (diff >= 0 ? "+" : "") + diff.toFixed(1).replace('.', ',') + "%";
        };

        // Monthly Revenue
        const monthlyRevenue = allPayments
            .filter(p => isThisMonth(p.payment_date) && isPaid(p.status) && pureNum(p.amount_paid) > 0)
            .reduce((sum, p) => sum + pureNum(p.amount_paid), 0);

        const lastMonthRevenue = allPayments
            .filter(p => isLastMonth(p.payment_date) && isPaid(p.status) && pureNum(p.amount_paid) > 0)
            .reduce((sum, p) => sum + pureNum(p.amount_paid), 0);

        const revenueTrend = calcTrend(monthlyRevenue, lastMonthRevenue);

        // Monthly Expenses
        const monthlyExpensesTable = allExpenses
            .filter(e => isThisMonth(e.date))
            .reduce((sum, e) => sum + pureNum(e.amount), 0);

        const monthlyExpensesLegacy = allPayments
            .filter(p => isThisMonth(p.payment_date) && (String(p.bride_id) === '212' || pureNum(p.amount_paid) < 0))
            .reduce((sum, p) => sum + Math.abs(pureNum(p.amount_paid)), 0);

        const currentExpenses = monthlyExpensesTable + monthlyExpensesLegacy;

        const lastMonthExpensesTable = allExpenses
            .filter(e => isLastMonth(e.date))
            .reduce((sum, e) => sum + pureNum(e.amount), 0);

        const lastMonthExpensesLegacy = allPayments
            .filter(p => isLastMonth(p.payment_date) && (String(p.bride_id) === '212' || pureNum(p.amount_paid) < 0))
            .reduce((sum, p) => sum + Math.abs(pureNum(p.amount_paid)), 0);

        const lastMonthExpenses = lastMonthExpensesTable + lastMonthExpensesLegacy;
        const expensesTrend = calcTrend(currentExpenses, lastMonthExpenses);

        // PENDING CALCULATION: Based on balance of active brides, using payment deadline
        // Payment deadline = event_date - PAYMENT_ALERT_DAYS (configurable)
        const PAYMENT_ALERT_DAYS = 10; // days before event that payment is due

        const activeBrides = (brides || []).filter(b => (b.status || '').toLowerCase() === 'ativa');
        const bridesWithBalance = activeBrides.filter(b => pureNum(b.balance) > 0);

        // Calculate payment deadline for each bride
        const getDeadline = (eventDate: string) => {
            if (!eventDate) return null;
            const d = new Date(eventDate.split('T')[0] + 'T12:00:00');
            if (isNaN(d.getTime())) return null;
            d.setDate(d.getDate() - PAYMENT_ALERT_DAYS);
            return d;
        };

        const isMonthYear = (date: Date, month: number, year: number) =>
            date.getMonth() === month && date.getFullYear() === year;

        // Main card value: balance of brides whose payment deadline falls in the current month
        // (or has already passed — i.e. deadline <= end of current month)
        const pendingThisMonth = bridesWithBalance
            .filter(b => {
                const dl = getDeadline(b.event_date);
                if (!dl) return false;
                // Deadline is in the current month OR already overdue (before current month)
                const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
                return dl <= endOfMonth;
            })
            .reduce((sum, b) => sum + pureNum(b.balance), 0);
        const pendingPayments = pendingThisMonth;

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



        // E. CHART DATA
        const chartData = [];
        const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth(); const y = d.getFullYear();

            const rev = allPayments.filter(p => {
                const pts = (p.payment_date || '').split('T')[0].split('-');
                return pts.length >= 2 && parseInt(pts[0]) === y && (parseInt(pts[1]) - 1) === m && isPaid(p.status) && pureNum(p.amount_paid) > 0;
            }).reduce((s, p) => s + pureNum(p.amount_paid), 0);

            const expT = allExpenses.filter(e => {
                const pts = (e.date || '').split('T')[0].split('-');
                return pts.length >= 2 && parseInt(pts[0]) === y && (parseInt(pts[1]) - 1) === m;
            }).reduce((s, e) => s + pureNum(e.amount), 0);

            const expL = allPayments.filter(p => {
                const pts = (p.payment_date || '').split('T')[0].split('-');
                const isM = pts.length >= 2 && (parseInt(pts[1]) - 1) === m && parseInt(pts[0]) === y;
                return isM && (String(p.bride_id) === '212' || pureNum(p.amount_paid) < 0);
            }).reduce((s, p) => s + Math.abs(pureNum(p.amount_paid)), 0);

            chartData.push({ month: monthNames[m], revenue: rev, expenses: expT + expL });
        }

        res.json({
            activeBrides: activeBrides.length,
            activeBridesTrend: "0%", // Default as we don't track history of 'status'
            monthlyRevenue,
            revenueTrend,
            pendingPayments,
            pendingBreakdown: {
                year2026: pending2026,
                year2027: pending2027,
                year2028: pending2028
            },
            monthlyExpenses: currentExpenses,
            expensesTrend,
            chartData
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
    const { status } = req.body;
    const { error } = await supabase.from("brides").update({ status }).eq("id", id);
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
