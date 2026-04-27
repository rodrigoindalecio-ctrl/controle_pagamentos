import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Lock, Mail, ArrowRight, ShieldCheck, User, XCircle, EyeOff, Eye } from "lucide-react";

const LoginView = ({ onLogin, logo, companyName }: { onLogin: (user: any, token: string, refreshToken: string) => void, logo?: string, companyName: string, key?: string }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      // Valida credenciais no BACKEND via Supabase Auth - senha nunca fica no cliente
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'E-mail ou senha incorretos. Tente novamente.');
        setIsLoggingIn(false);
        return;
      }

      // Login bem-sucedido: passa token e dados do usuário (SEM senha)
      onLogin(data.user, data.access_token, data.refresh_token);
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
      setIsLoggingIn(false);
    }
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
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic leading-tight">Gestão Financeira</h1>
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
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-transform group-focus-within:scale-110">
                <Mail className="w-4 h-4 text-[#883545]/40 group-focus-within:text-[#883545] transition-colors" />
              </div>
              <input
                type="email"
                placeholder="email@email.com.br"
                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#883545]/5 focus:border-[#883545]/20 focus:bg-white transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Senha</label>
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
              <span className="relative z-10">ENTRAR</span>
            </button>
          </div>


        </form>
      </motion.div>
    </div>
  );
};



export { LoginView };
