import { useAuth } from '../hooks/useAuth';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const quickAccessCards = [
  {
    title: 'Budget Allocation',
    description: 'Manage departmental budget distributions and fund allocations across organizational units.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    status: 'pending',
  },
  {
    title: 'Expense Tracking',
    description: 'Monitor and record expenditures with real-time validation against allocated budgets.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    status: 'pending',
  },
  {
    title: 'Audit Trail',
    description: 'Review immutable blockchain-verified audit logs of all financial transactions and changes.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    status: 'pending',
  },
  {
    title: 'Reports & Analytics',
    description: 'Generate comprehensive financial reports with visual analytics and compliance documentation.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    status: 'pending',
  },
];

const recentActivity = [
  { action: 'System initialized', user: 'System', time: 'Just now', type: 'info' },
  { action: 'Session started', user: 'You', time: 'Just now', type: 'success' },
];

function getRoleBadgeVariant(role) {
  const variants = {
    Administrator: 'primary',
    Treasurer: 'accent',
    BudgetOfficer: 'info',
    Auditor: 'success',
  };
  return variants[role] || 'primary';
}

function getStatusBadge(status) {
  switch (status) {
    case 'active': return <Badge variant="success">Active</Badge>;
    case 'pending': return <Badge variant="warning">Coming Soon</Badge>;
    case 'inactive': return <Badge variant="error">Inactive</Badge>;
    default: return <Badge variant="primary">{status}</Badge>;
  }
}

export function Dashboard() {
  const { user } = useAuth();

  const roleLabel = user?.role
    ? ({ Administrator: 'Administrator', Treasurer: 'Treasurer', BudgetOfficer: 'Budget Officer', Auditor: 'Auditor' }[user.role] || user.role)
    : '';

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="dashboard-page">
      <div className="welcome-section">
        <div>
          <h1 className="welcome-heading">
            {greeting}, {user?.fullName?.split(' ')[0] || 'User'}
          </h1>
          <p className="welcome-text">
            Welcome to the BudgetChain financial management platform. Monitor budgets, track expenses, and maintain fiscal accountability.
          </p>
        </div>
        <div className="welcome-badge-wrapper">
          <Badge variant={getRoleBadgeVariant(user?.role)}>
            {roleLabel}
          </Badge>
        </div>
      </div>

      <div className="quick-access-grid">
        {quickAccessCards.map((card) => (
          <Card key={card.title} className="quick-access-card">
            <CardBody>
              <div className="quick-access-card-header">
                <div className="quick-access-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
                    <path d={card.icon} />
                  </svg>
                </div>
                {getStatusBadge(card.status)}
              </div>
              <h3 className="quick-access-title">{card.title}</h3>
              <p className="quick-access-description">{card.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card className="dashboard-section-card">
          <div className="card-header">
            <h3 className="h5 mb-0">Recent Activity</h3>
          </div>
          <div className="card-body p-0">
            {recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.map((item, index) => (
                  <div key={index} className="activity-item">
                    <div className={`activity-dot activity-dot-${item.type}`} />
                    <div className="activity-content">
                      <div className="activity-action">{item.action}</div>
                      <div className="activity-meta">
                        <span>{item.user}</span>
                        <span className="mx-1">&middot;</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-muted mb-0" style={{ fontSize: 'var(--font-size-sm)' }}>
                  No recent activity to display.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="dashboard-section-card">
          <div className="card-header">
            <h3 className="h5 mb-0">System Status</h3>
          </div>
          <div className="card-body">
            <div className="status-list">
              <div className="status-item">
                <div className="status-indicator status-healthy" />
                <div className="status-info">
                  <div className="status-label">Blockchain Network</div>
                  <div className="status-value">Connected</div>
                </div>
              </div>
              <div className="status-item">
                <div className="status-indicator status-healthy" />
                <div className="status-info">
                  <div className="status-label">Database</div>
                  <div className="status-value">Operational</div>
                </div>
              </div>
              <div className="status-item">
                <div className="status-indicator status-healthy" />
                <div className="status-info">
                  <div className="status-label">Authentication Service</div>
                  <div className="status-value">Active</div>
                </div>
              </div>
              <div className="status-item">
                <div className="status-indicator status-idle" />
                <div className="status-info">
                  <div className="status-label">Smart Contract Integration</div>
                  <div className="status-value">Pending Configuration</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
