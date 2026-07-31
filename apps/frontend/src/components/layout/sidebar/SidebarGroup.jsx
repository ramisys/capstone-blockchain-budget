import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { SidebarSubItem } from './SidebarSubItem';

export function SidebarGroup({ group, collapsed }) {
  const location = useLocation();
  const GroupIcon = group.icon;

  // Helper to check if any child item matches current location
  const isChildActive = group.items.some(child => {
    if (location.pathname === child.path) return true;
    if (!child.exact && child.path !== '/' && location.pathname.startsWith(child.path)) return true;
    if (child.legacyPaths && child.legacyPaths.some(p => location.pathname === p || location.pathname.startsWith(p))) return true;
    return false;
  });

  const [isOpen, setIsOpen] = useState(group.defaultExpanded || isChildActive);

  // Auto-expand group if a child route becomes active
  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [location.pathname, isChildActive]);

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className="mb-1">
      {/* Group Header Button */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isChildActive
            ? 'bg-slate-800/80 text-white shadow-sm border-l-2 border-indigo-500'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
        } ${collapsed ? 'justify-center px-0' : ''}`}
      >
        {GroupIcon && (
          <GroupIcon
            className={`w-5 h-5 shrink-0 transition-colors ${
              isChildActive ? 'text-indigo-400' : 'text-slate-400'
            }`}
          />
        )}

        {!collapsed && (
          <>
            <span className="truncate flex-1 text-left">{group.label}</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-slate-200' : ''
              }`}
            />
          </>
        )}
      </button>

      {/* Expandable Sub-items Container */}
      {!collapsed && (
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden space-y-0.5">
            {group.items.map(subItem => (
              <SidebarSubItem
                key={subItem.label}
                item={subItem}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>
      )}

      {/* Render sub-items directly if sidebar is collapsed */}
      {collapsed && isOpen && (
        <div className="space-y-1 mt-1">
          {group.items.map(subItem => (
            <SidebarSubItem
              key={subItem.label}
              item={subItem}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
