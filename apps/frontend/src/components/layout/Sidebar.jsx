import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { navigationConfig } from './sidebar/sidebarConfig';
import { SidebarItem } from './sidebar/SidebarItem';
import { SidebarGroup } from './sidebar/SidebarGroup';

export function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMINISTRATOR;

  const roleTitleMap = {
    Administrator: 'Administrator',
    Treasurer: 'Treasurer',
    BudgetOfficer: 'Budget Officer',
    Auditor: 'Auditor',
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${!collapsed ? 'show' : ''}`}
        onClick={onToggle}
        aria-hidden="true"
      />

      <aside
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className="sidebar-brand flex items-center gap-3 px-4 py-5 border-b border-slate-800/80">
          <div className="sidebar-logo shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-indigo-500 shadow-md shadow-indigo-600/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" className="w-6 h-6">
              <rect width="40" height="40" rx="8" fill="white" fillOpacity="0.15"/>
              <path d="M20 6L28 10V18C28 23.5 24.5 28.5 20 30C15.5 28.5 12 23.5 12 18V10L20 6Z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M17 20L19.5 22.5L23 17.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text flex flex-col min-w-0">
              <span className="sidebar-brand-title font-bold text-white tracking-wide text-base leading-snug truncate">
                BudgetChain
              </span>
              <span className="sidebar-brand-sub text-xs text-slate-400 font-medium truncate">
                Financial Management
              </span>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav flex-1 px-3 py-4 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {navigationConfig
            .filter(section => !section.adminOnly || isAdmin)
            .map(section => (
              <div key={section.section} className="sidebar-section">
                {!collapsed && (
                  <div className="sidebar-section-label px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    {section.section}
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map(item => {
                    if (item.type === 'link') {
                      return (
                        <SidebarItem
                          key={item.label}
                          item={item}
                          collapsed={collapsed}
                        />
                      );
                    }
                    if (item.type === 'group') {
                      return (
                        <SidebarGroup
                          key={item.label}
                          group={item}
                          collapsed={collapsed}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
        </nav>

        {/* Footer User Info */}
        <div className="sidebar-footer p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="sidebar-user flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/50 transition-colors">
            <div className="sidebar-user-avatar shrink-0 w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-white text-sm shadow-inner">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info min-w-0 flex-1">
                <div className="sidebar-user-name font-semibold text-slate-200 text-sm truncate">
                  {user?.fullName || 'User'}
                </div>
                <div className="sidebar-user-role text-xs text-slate-400 truncate">
                  {user?.role ? roleTitleMap[user.role] || user.role : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}