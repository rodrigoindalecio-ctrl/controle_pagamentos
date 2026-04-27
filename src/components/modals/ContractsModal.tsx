import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus } from 'lucide-react';
import { Bride } from '../../types';

interface ContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brides: Bride[];
  months: any[];
}

export const ContractsModal = ({ isOpen, onClose, brides, months }: ContractsModalProps) => {
  const years = [2024, 2025, 2026];
  const tableData = months.map(m => {
    const monthIndex = Number(m.value);
    const row: any = { label: m.label, values: {} };
    years.forEach(year => {
      row.values[year] = brides.filter(b => 
        b.created_at && 
        new Date(b.created_at).getFullYear() === year && 
        new Date(b.created_at).getMonth() + 1 === monthIndex
      ).length;
    });
    return row;
  });
  
  const totals = years.reduce((acc: any, year) => {
    acc[year] = tableData.reduce((sum, row) => sum + (row.values[year] || 0), 0);
    return acc;
  }, {});
  
  const averages = years.reduce((acc: any, year) => {
    acc[year] = (totals[year] / 12).toFixed(1);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 lg:p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-[#883545]/10 flex flex-col"
          >
            <div className="bg-[#883545]/5 p-3 lg:p-4 border-b border-[#883545]/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-[#883545] text-white rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm lg:text-lg font-bold text-slate-800 leading-tight">Contagem de Novos Contratos</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Comparativo Anual x Mensal</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-3 lg:p-4">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Mês</th>
                    {years.map(year => (
                      <th key={year} className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">{year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tableData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-1 px-3 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{row.label}</td>
                      {years.map(year => (
                        <td key={year} className={`py-1 px-3 text-xs font-black text-center ${row.values[year] > 0 ? 'text-[#883545]' : 'text-slate-300'}`}>
                          {row.values[year] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="z-20 bg-white sticky bottom-0">
                  <tr className="bg-slate-50 border-t-2 border-slate-100">
                    <td className="py-2 px-3 text-[10px] font-black text-[#883545] uppercase">Total Geral</td>
                    {years.map(year => (
                      <td key={year} className="py-2 px-3 text-sm font-black text-[#883545] text-center">{totals[year]}</td>
                    ))}
                  </tr>
                  <tr className="bg-[#883545] text-white">
                    <td className="py-2 px-3 text-[10px] font-black uppercase">Média Mensal</td>
                    {years.map(year => (
                      <td key={year} className="py-2 px-3 text-sm font-black text-center">{averages[year].replace('.', ',')}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-2 bg-slate-50 text-center shrink-0 border-t border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic tracking-[0.1em]">Valores baseados na data de criação do registro no sistema</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
