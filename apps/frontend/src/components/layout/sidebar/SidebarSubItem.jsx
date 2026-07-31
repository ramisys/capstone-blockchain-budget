import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SidebarBadge } from './SidebarBadge';

export function SidebarSubItem({ item, collapsed }) {
  const location = useLocation();
  const Icon = item.icon;

  // Active check supporting primary path or legacy alias paths
  const isActive =
    location.pathname === item.path ||
    (item.exact ? false : location.pathname.startsWith(item.path)) ||
    (item.legacyPaths && item.legacyPaths.some(p => location.pathname === p || location.pathname.startsWith(p)));

  if (collapsed) {
    return (
      <div className="relative group my-0.5">
        <NavLink
          to={item.path}
          className={`flex items-center justify-center p-2 rounded-lg text-sm transition-all duration-200 ${
            isActive
              ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          aria-current={isActive ? 'page' : undefined}
        >
          {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />}
        </NavLink>
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 border border-slate-800">
          {item.label}
          {item.status && <span className="ml-2 opacity-75">({item.status})</span>}
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={`flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 my-0.5 ${
        isActive
          ? 'bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500 shadow-sm'
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {Icon && (
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-indigo-400' : 'text-slate-400'
          }`}
        />
      )}
      <span className="truncate flex-1">{item.label}</span>
      {item.status && <SidebarBadge status={item.status} />}
    </NavLink>
  );
}
