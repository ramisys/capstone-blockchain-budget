import React from 'react';

export function SidebarBadge({ status }) {
  if (!status) return null;

  const getVariantStyles = () => {
    switch (status.toLowerCase()) {
      case 'ready':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40';
      case 'in progress':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/40';
      case 'planned':
      default:
        return 'bg-slate-800/80 text-slate-300 border-slate-700/60';
    }
  };

  return (
    <span
      className={`ml-auto px-1.5 py-0.5 text-[10px] font-medium tracking-wide rounded-md border transition-colors ${getVariantStyles()}`}
    >
      {status}
    </span>
  );
}
