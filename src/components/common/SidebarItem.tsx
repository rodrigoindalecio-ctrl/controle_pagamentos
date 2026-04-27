import React from 'react';

interface SidebarItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

export const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
        active 
          ? 'bg-[#883545]/10 text-[#883545]' 
          : 'text-slate-700 hover:bg-slate-50'
      }`}
      onClick={onClick}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{label}</span>
    </button>
  );
};
