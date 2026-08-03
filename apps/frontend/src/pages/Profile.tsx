import { useAuth } from '../hooks/useAuth';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

function getRoleBadgeVariant(role) {
  const variants = {
    Administrator: 'primary',
    Treasurer: 'accent',
    BudgetOfficer: 'info',
    Auditor: 'success',
  };
  return variants[role] || 'primary';
}

function getStatusBadgeVariant(status) {
  return status === 'Active' ? 'success' : 'error';
}

export function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const roleLabel = user.role
    ? ({ Administrator: 'Administrator', Treasurer: 'Treasurer', BudgetOfficer: 'Budget Officer', Auditor: 'Auditor' }[user.role] || user.role)
    : '';

  const details = [
    { label: 'Full Name', value: user.fullName },
    { label: 'Email Address', value: user.email },
    { label: 'Role', value: roleLabel, badge: user.role },
    { label: 'Status', value: user.status, badge: user.status },
    { label: 'Account Created', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
    { label: 'Last Updated', value: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
  ];

  return (
    <div className="profile-page">
      <div className="mb-4">
        <h1 className="h2 mb-1">Profile</h1>
        <p className="text-muted mb-0" style={{ fontSize: 'var(--font-size-sm)' }}>
          View your account information and system role.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="d-flex align-items-center gap-3">
            <div className="profile-avatar">
              {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="h4 mb-1">{user.fullName}</h2>
              <div className="d-flex gap-2">
                <Badge variant={getRoleBadgeVariant(user.role)}>{roleLabel}</Badge>
                {user.status && (
                  <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="profile-details">
            {details.map((detail) => (
              <div key={detail.label} className="profile-detail-row">
                <dt className="profile-detail-label">{detail.label}</dt>
                <dd className="profile-detail-value">
                  {detail.badge ? (
                    <Badge variant={detail.label === 'Role' ? getRoleBadgeVariant(detail.badge) : getStatusBadgeVariant(detail.badge)}>
                      {detail.value}
                    </Badge>
                  ) : (
                    detail.value
                  )}
                </dd>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
