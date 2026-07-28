import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useAuth } from '../../hooks/useAuth';

export function DashboardLayout() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 992 : false;
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <div className="dashboard-main">
        <TopNav onToggleSidebar={toggleSidebar} />

        <main className="dashboard-content" role="main">
          <Outlet />
        </main>

        <footer className="dashboard-footer">
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-md-6">
                  <p className="mb-0 text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                  &copy; {new Date().getFullYear()} BudgetChain. University Capstone Project.
                </p>
              </div>
              <div className="col-md-6 text-md-end">
                <p className="mb-0 text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Logged in as <span className="fw-medium text-secondary">{user?.email || ''}</span>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
