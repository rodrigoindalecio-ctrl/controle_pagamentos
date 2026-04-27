import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Heart } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: any, token: string, refreshToken: string) => void;
  logo?: string;
  companyName: string;
}

export const LoginView = ({ onLogin, logo, companyName }: LoginViewProps) => {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user, data.session.access_token, data.session.refresh_token);
      } else {
        setError(data.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F8] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(136,53,69,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(136,53,69,0.05),transparent)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-[0_20px_60px_-15px_rgba(136,53,69,0.15)] border border-[#883545]/10 relative overflow-hidden"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="size-20 bg-[#883545]/5 rounded-3xl flex items-center justify-center mb-6 border border-[#883545]/10 overflow-hidden p-4">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Heart className="text-[#883545] w-9 h-9" />
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest text-center">
            Portal Gestão Premium
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Vanessa Bidinotti</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#883545] transition-colors" />
              <input
                required
                type="email"
                placeholder="nome@exemplo.com"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-[#883545]/10 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#883545] transition-colors" />
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha secreta"
                className="w-full pl-12 pr-14 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-[#883545]/10 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-[#883545] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs font-bold text-rose-500 text-center px-4 py-2 bg-rose-50 rounded-xl">
              {error}
            </motion.p>
          )}

          <button
            disabled={isLoggingIn}
            type="submit"
            className="w-full bg-[#883545] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#883545]/20 hover:bg-[#883545]/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              'Entrar no Portal'
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Exclusivo Genesis Sistema v1</p>
        </div>
      </motion.div>
    </div>
  );
};
