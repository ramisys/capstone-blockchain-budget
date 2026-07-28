import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

const navItems = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    ],
  },
  {
    section: 'Management',
    items: [
      { label: 'Budget Allocation', path: '#', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', comingSoon: true },
      { label: 'Expense Tracking', path: '#', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', comingSoon: true },
    ],
  },
  {
    section: 'Administration',
    items: [
      { label: 'User Management', path: '/users', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 013 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.058-.382-3.016z', comingSoon: false },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'User Profile', path: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMINISTRATOR;

  return (
    <>
      <div
        className={`sidebar-overlay ${!collapsed ? 'show' : ''}`}
        onClick={onToggle}
        aria-hidden="true"
      />
      <aside
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" width="32" height="32">
              <rect width="40" height="40" rx="8" fill="white" opacity="0.15"/>
              <path d="M20 6L28 10V18C28 23.5 24.5 28.5 20 30C15.5 28.5 12 23.5 12 18V10L20 6Z" fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
              <path d="M17 20L19.5 22.5L23 17.5" stroke="#D4A843" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">BudgetChain</span>
            <span className="sidebar-brand-sub">Financial Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems
            // Filter out administration section if user is not admin
            .filter(section =>
              section.section !== 'Administration' || isAdmin
            )
            .map((section) => (
              <div key={section.section} className="sidebar-section">
                <div className="sidebar-section-label">{section.section}</div>
                {section.items.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive && !item.comingSoon ? 'active' : ''} ${item.comingSoon ? 'disabled' : ''}`
                    }
                    onClick={(e) => {
                      if (item.comingSoon || item.path === '#') {
                        e.preventDefault();
                      }
                    }}
                    tabIndex={item.comingSoon ? -1 : 0}
                    aria-disabled={item.comingSoon}
                  >
                    <svg className="sidebar-link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                      <path d={item.icon} />
                    </svg>
                    <span className="sidebar-link-text">
                      {item.label}
                      {item.comingSoon && <span className="sidebar-badge">Soon</span>}
                    </span>
                  </NavLink>
                ))}
              </div>
            ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.fullName || 'User'}</div>
              <div className="sidebar-user-role">
                {user?.role ? (
                  { Administrator: 'Administrator', Treasurer: 'Treasurer', BudgetOfficer: 'Budget Officer', Auditor: 'Auditor' }[user.role] || user.role
                ) : ''}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}