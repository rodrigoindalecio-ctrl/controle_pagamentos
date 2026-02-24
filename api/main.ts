import express from "express";
import { createServer as createViteServer } from "vite";
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
        const { count: activeBrides } = await supabase
            .from("brides")
            .select("*", { count: "exact", head: true })
            .eq("status", "Ativa");

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // Monthly Revenue: only this month + paid
        const { data: revenueData, error: revError } = await supabase
            .from("payments")
            .select("amount_paid, status")
            .gte("payment_date", firstDayOfMonth)
            .lte("payment_date", lastDayOfMonth);

        if (revError) throw revError;

        const monthlyRevenue = revenueData?.filter(p =>
            p.status?.trim().toLowerCase() === 'pago'
        ).reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0) || 0;

        // Pending Payments: NOT paid
        const { data: pendingData, error: pendError } = await supabase
            .from("payments")
            .select("amount_paid, status")
            .not("status", "ilike", "pago");

        if (pendError) throw pendError;

        const pendingPayments = pendingData?.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0) || 0;

        const { data: expensesData, error: expError } = await supabase
            .from("expenses")
            .select("amount")
            .gte("date", firstDayOfMonth)
            .lte("date", lastDayOfMonth);

        if (expError) throw expError;

        const monthlyExpenses = expensesData?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

        // CHART DATA: Last 6 months
        const chartData = [];
        const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
            const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

            const { data: mPay } = await supabase.from("payments").select("amount_paid, status").gte("payment_date", mStart).lte("payment_date", mEnd);
            const { data: mExp } = await supabase.from("expenses").select("amount").gte("date", mStart).lte("date", mEnd);

            const rev = mPay?.filter(p => p.status?.toLowerCase() === 'pago').reduce((s, p) => s + (Number(p.amount_paid) || 0), 0) || 0;
            const exp = mExp?.reduce((s, e) => s + (Number(e.amount) || 0), 0) || 0;

            chartData.push({
                month: monthNames[d.getMonth()],
                revenue: rev,
                expenses: exp
            });
        }

        res.json({
            activeBrides: activeBrides || 0,
            monthlyRevenue,
            pendingPayments,
            monthlyExpenses,
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
        .order("id", { ascending: false });

    if (error) {
        console.error("Get brides error:", error);
        return res.status(500).json(error);
    }
    res.json(data);
});

app.post("/api/brides", async (req, res) => {
    const { name, email, event_date, service_type, contract_value, original_value } = req.body;
    const { data, error } = await supabase
        .from("brides")
        .insert([{
            name,
            email,
            event_date: event_date || null,
            service_type,
            contract_value: Number(contract_value) || 0,
            original_value: Number(original_value) || 0,
            status: 'Ativa'
        }])
        .select()
        .single();

    if (error) {
        console.error("Post bride error:", error);
        return res.status(500).json(error);
    }
    res.json(data);
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

    const { data, error } = await supabase
        .from("payments")
        .insert([{
            bride_id,
            description,
            amount_paid: Number(amount_paid) || 0,
            payment_date: finalDate,
            status: status || 'Pago'
        }])
        .select()
        .single();

    if (error) {
        console.error("Post payment error:", error);
        return res.status(500).json(error);
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

export default app;

// Função para iniciar o servidor (usada localmente)
export async function startServer() {
    const rootDir = path.resolve(__dirname, "..");

    if (process.env.NODE_ENV !== "production") {
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
