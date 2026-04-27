import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: string;
  children?: React.ReactNode;
}

export const StatCard = ({ label, value, icon: Icon, color, trend, children }: StatCardProps) => {
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
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#883545]/5 flex flex-col h-full hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-2 shrink-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
        <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').split('-')[0]}-50 ${color} group-hover:scale-110 transition-transform`}>
          {Icon && <Icon className="size-4" />}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="flex items-center justify-center gap-1 w-full min-h-[40px]">
          {currency && <span className="text-xs font-bold text-slate-400 mt-1">{currency}</span>}
          <span className={`${fontSizeClass} font-black text-slate-800 leading-tight break-words`}>
            {amount}
          </span>
        </div>

        {trend && (
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : isNegative ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
              {trend.split(' ')[0]}
            </span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">vs anterior</span>
          </div>
        )}
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-slate-50">
          {children}
        </div>
      )}
    </div>
  );
};
