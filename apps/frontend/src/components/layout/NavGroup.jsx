import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const NavGroup = ({ title, icon, items, isActive, isExpanded, onToggle }) => {
  return (
    <div className="group">
      <button
        onClick={onToggle}
        className={`flex w-full items-center p-2 text-left text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 rounded-md ${
          isActive ? 'bg-slate-100 text-slate-900' : ''
        }`}
      >
        <div className="flex-1 flex items-center space-x-3">
          {icon && <div className="h-5 w-5">{icon}</div>}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="h-5 w-5 flex items-center justify-center">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-500 transition-colors duration-200" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-500 transition-colors duration-200" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="mt-2 pl-8 space-y-1">
          {items.map((item, index) => (
            <NavLink
              to={item.href}
              key={index}
              className={`block pl-2 pr-4 py-2 text-left text-sm font-medium transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 rounded-md ${
                item.isActive ? 'bg-slate-100 text-slate-900' : ''
              }`}
            >
              {item.title}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavGroup;