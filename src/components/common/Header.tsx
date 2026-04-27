import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header = ({ title, subtitle }: HeaderProps) => (
  <div className="mb-4">
    <h2 className="text-2xl font-bold text-[#883545] italic">{title}</h2>
    {subtitle && (
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 opacity-70">
        {subtitle}
      </p>
    )}
  </div>
);
