// --- Helpers de Data para Evitar Fuso Horário (Problema de 1 dia a menos) ---
export const parseDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
};

export const formatDisplayDate = (dateStr: string | null | undefined) => {
  const d = parseDate(dateStr);
  return d ? d.toLocaleDateString('pt-BR') : '-';
};

export const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
