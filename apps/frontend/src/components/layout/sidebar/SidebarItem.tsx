import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SidebarBadge } from './SidebarBadge';

export function SidebarItem({ item, collapsed }) {
  const location = useLocation();
  const Icon = item.icon;

  const isActive = location.pathname === item.path || (
    item.path !== '/' && location.pathname.startsWith(item.path)
  );

  return (
    <div className="relative group">
      <NavLink
        to={item.path}
        className={({ isActive: linkActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            linkActive || isActive
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          } ${collapsed ? 'justify-center px-0' : ''}`
        }
        aria-current={isActive ? 'page' : undefined}
      >
        {Icon && (
          <Icon
            className={`shrink-0 transition-transform duration-200 ${
              collapsed ? 'w-5 h-5' : 'w-5 h-5'
            } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
          />
        )}
        {!collapsed && (
          <span className="truncate flex-1 text-left">{item.label}</span>
        )}
        {!collapsed && item.status && <SidebarBadge status={item.status} />}
      </NavLink>

      {/* Tooltip on collapsed mode */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 border border-slate-800">
          {item.label}
          {item.status && <span className="ml-2 opacity-75">({item.status})</span>}
        </div>
      )}
    </div>
  );
}
