import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserMinus } from 'lucide-react';
import { Bride } from '../../types';

interface CancellationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brides: Bride[];
  filterYear: string;
}

export const CancellationsModal = ({ isOpen, onClose, brides, filterYear }: CancellationsModalProps) => {
  const canceledBrides = brides.filter(b => 
    (b.status || '').toLowerCase() === 'cancelado' && 
    b.event_date && 
    b.event_date.startsWith(filterYear)
  );

  const totalFina = canceledBrides.reduce((sum, b) => sum + (Number(b.contract_value) || 0), 0);
  const totalOriginal = canceledBrides.reduce((sum, b) => sum + (Number(b.original_value) || 0), 0);
  const totalPerda = totalOriginal - totalFina;

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
            className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col"
          >
            <div className="bg-rose-50 p-3 lg:p-4 border-b border-rose-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-rose-600 text-white rounded-lg flex items-center justify-center">
                  <UserMinus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm lg:text-lg font-bold text-slate-800 leading-tight">Detalhes de Cancelamentos</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Eventos em {filterYear}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-3 lg:p-4">
              {canceledBrides.length > 0 ? (
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Cliente</th>
                      <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Data Evento</th>
                      <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Original</th>
                      <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Multa (FINA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {canceledBrides.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-1 px-3 text-[10px] font-bold text-slate-800 uppercase tracking-tighter">{b.name}</td>
                        <td className="py-1 px-3 text-[10px] font-bold text-slate-500">
                          {b.event_date ? new Date(b.event_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-1 px-3 text-[10px] font-black text-center text-slate-400">
                          R$ {Number(b.original_value).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-1 px-3 text-[10px] font-black text-center text-emerald-600">
                          R$ {Number(b.contract_value).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="z-20 bg-white sticky bottom-0">
                    <tr className="bg-slate-50 border-t-2 border-slate-100 text-xs font-black">
                      <td colSpan={2} className="py-2 px-3 text-slate-400 uppercase">Totais Anuais</td>
                      <td className="py-2 px-3 text-center text-slate-500 font-black">
                        R$ {totalOriginal.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-3 text-center text-emerald-600 font-black">
                        R$ {totalFina.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                    <tr className="bg-rose-600 text-white">
                      <td colSpan={3} className="py-2 px-3 text-[10px] font-black uppercase">Receita Perdida Total (PERDA)</td>
                      <td className="py-2 px-3 text-center text-sm font-black">
                        R$ {totalPerda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 italic text-sm">
                  Nenhum cancelamento encontrado para o ano de {filterYear}.
                </div>
              )}
            </div>

            <div className="p-2 bg-slate-50 text-center shrink-0 border-t border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic tracking-[0.1em]">Análise baseada em eventos com status "Cancelado" e multa registrada</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
