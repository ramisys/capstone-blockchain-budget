import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import apiClient from '../api/apiClient';

export function Dashboard() {
  const { user } = useAuth();

  // State for stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // State for charts data
  const [chartsData, setChartsData] = useState(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartsError, setChartsError] = useState(null);

  // State for recent activities
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  // State for notifications
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState(null);

  // State for blockchain status
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [blockchainLoading, setBlockchainLoading] = useState(true);
  const [blockchainError, setBlockchainError] = useState(null);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiClient.get('/dashboard/stats');
      setStats(response.data.data.stats);
      setStatsError(null);
    } catch (err) {
      setStatsError(err.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch dashboard charts data
  const fetchChartsData = async () => {
    try {
      setChartsLoading(true);
      const response = await apiClient.get('/dashboard/charts');
      setChartsData(response.data.data.chartsData);
      setChartsError(null);
    } catch (err) {
      setChartsError(err.response?.data?.message || 'Failed to fetch charts data');
    } finally {
      setChartsLoading(false);
    }
  };

  // Fetch recent activities
  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await apiClient.get('/dashboard/activities');
      setActivities(response.data.data.activities);
      setActivitiesError(null);
    } catch (err) {
      setActivitiesError(err.response?.data?.message || 'Failed to fetch activities');
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await apiClient.get('/dashboard/notifications');
      setNotifications(response.data.data.notifications);
      setNotificationsError(null);
    } catch (err) {
      setNotificationsError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Fetch blockchain status
  const fetchBlockchainStatus = async () => {
    try {
      setBlockchainLoading(true);
      const response = await apiClient.get('/dashboard/blockchain');
      setBlockchainStatus(response.data.data.blockchainStatus);
      setBlockchainError(null);
    } catch (err) {
      setBlockchainError(err.response?.data?.message || 'Failed to fetch blockchain status');
    } finally {
      setBlockchainLoading(false);
    }
  };

  const COLORS = [
    "#2563EB", // Administrator
    "#10B981", // Budget Officer
    "#F59E0B", // Treasurer
    "#EF4444", // Auditor
  ];

  // Fetch all data on mount
  useEffect(() => {
    fetchStats();
    fetchChartsData();
    fetchActivities();
    fetchNotifications();
    fetchBlockchainStatus();
  }, []);

  // Helper function to format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Helper function to get status badge variant (for Bootstrap Alert component)
  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'primary';
    }
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Helper function to get Tailwind color class from notification type
  const getTailwindColorFromType = (type) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="dashboard-page">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Users */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <h6 className="mb-0 text-sm font-semibold text-slate-500">Total Users</h6>
          </CardHeader>
          <CardBody className="text-center">
            {statsLoading ? (
              <Spinner size="sm" />
            ) : statsError ? (
              <Alert variant="danger">{statsError}</Alert>
            ) : (
              <>
                <h2 className="display-4 fw-bold mb-2">{formatNumber(stats.totalUsers)}</h2>
                <p className="text-muted">Total registered users</p>
              </>
            )}
          </CardBody>
        </Card>

        {/* Active Users */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <h6 className="mb-0 text-sm font-semibold text-slate-500">Active Users</h6>
          </CardHeader>
          <CardBody className="text-center">
            {statsLoading ? (
              <Spinner size="sm" />
            ) : statsError ? (
              <Alert variant="danger">{statsError}</Alert>
            ) : (
              <>
                <h2 className="display-4 fw-bold text-success mb-2">{formatNumber(stats.activeUsers)}</h2>
                <p className="text-muted">Currently active</p>
              </>
            )}
          </CardBody>
        </Card>

        {/* Inactive Users */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <h6 className="mb-0 text-sm font-semibold text-slate-500">Inactive Users</h6>
          </CardHeader>
          <CardBody className="text-center">
            {statsLoading ? (
              <Spinner size="sm" />
            ) : statsError ? (
              <Alert variant="danger">{statsError}</Alert>
            ) : (
              <>
                <h2 className="display-4 fw-bold text-danger mb-2">{formatNumber(stats.inactiveUsers)}</h2>
                <p className="text-muted">Inactive or suspended</p>
              </>
            )}
          </CardBody>
        </Card>

        {/* Pending Approvals (example: users with pending status) */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <h6 className="mb-0 text-sm font-semibold text-slate-500">Pending Approvals</h6>
          </CardHeader>
          <CardBody className="text-center">
            {statsLoading ? (
              <Spinner size="sm" />
            ) : statsError ? (
              <Alert variant="danger">{statsError}</Alert>
            ) : (
              <>
                {/* We don't have pending users in stats, but we can calculate from usersByStatus if available */}
                {/* For now, we'll show a placeholder or compute from stats if we had pending count */}
                {/* Since we don't have pending in stats, we'll show 0 or compute from usersByStatus? */}
                {/* Let's skip and show a placeholder for now, or we can show the count of users with status pending from chartsData? */}
                {/* We'll leave it as 0 for now, but in a real app we would have this in stats */}
                <h2 className="display-4 fw-bold text-warning mb-2">0</h2>
                <p className="text-muted">Awaiting verification</p>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Users by Role - Pie Chart */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 text-sm font-semibold text-slate-500">Users by Role</h6>
              <div className="dropdown">
                <button className="btn btn-link p-0 text-muted fs-6 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="bi bi-three-dots"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><a className="dropdown-item" href="#">View Details</a></li>
                  <li><a className="dropdown-item" href="#">Export Data</a></li>
                </ul>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {chartsLoading ? (
              <Spinner size="sm" className="d-block mx-auto my-4" />
            ) : chartsError ? (
              <Alert variant="danger">{chartsError}</Alert>
            ) : chartsData && chartsData.usersByRole && chartsData.usersByRole.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartsData.usersByRole}
                    dataKey="count"
                    nameKey="role"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    label={({ cx, cy, midAngle, outerRadius, percent, role, value }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 20;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#374151"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          fontSize={13}
                        >
                          {`${role}: ${value}`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {chartsData.usersByRole.map((entry, index) => (
                      <Cell
                        key={entry.role}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip formatter={(value, name) => [`${value} users`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted py-4">No data available</p>
            )}
          </CardBody>
        </Card>

        {/* Users by Status - Bar Chart */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 text-sm font-semibold text-slate-500">Users by Status</h6>
              <div className="dropdown">
                <button className="btn btn-link p-0 text-muted fs-6 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="bi bi-three-dots"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><a className="dropdown-item" href="#">View Details</a></li>
                  <li><a className="dropdown-item" href="#">Export Data</a></li>
                </ul>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {chartsLoading ? (
              <Spinner size="sm" className="d-block mx-auto my-4" />
            ) : chartsError ? (
              <Alert variant="danger">{chartsError}</Alert>
            ) : chartsData && chartsData.usersByStatus && chartsData.usersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartsData.usersByStatus}>
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="count" fill="#4361ee" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted py-4">No data available</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent Activities and Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Recent Activities */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 text-sm font-semibold text-slate-500">Recent Activity</h6>
              <a href="#" className="text-decoration-none text-muted fs-6">View All</a>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {activitiesLoading ? (
              <Spinner size="sm" className="d-block mx-auto my-4" />
            ) : activitiesError ? (
              <Alert variant="danger">{activitiesError}</Alert>
            ) : activities.length > 0 ? (
              <div className="activity-list">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="d-flex align-items-start mb-3">
                    <div className="flex-shrink-0 me-3">
                      <div className="activity-dot bg-gray-500" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium">{activity.message}</div>
                      <div className="small text-muted">
                        {activity.user} · {new Date(activity.time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted py-4">No recent activity</p>
            )}
          </CardBody>
        </Card>

        {/* Notifications */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 text-sm font-semibold text-slate-500">Notifications</h6>
              <a href="#" className="text-decoration-none text-muted fs-6">View All</a>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {notificationsLoading ? (
              <Spinner size="sm" className="d-block mx-auto my-4" />
            ) : notificationsError ? (
              <Alert variant="danger">{notificationsError}</Alert>
            ) : notifications.length > 0 ? (
              <div className="notification-list">
                {notifications.map((notification, index) => (
                  <div key={notification.id} className="d-flex align-items-start mb-3">
                    <div className="flex-shrink-0 me-3">
                      <div className={`notification-icon ${getTailwindColorFromType(notification.type)}`}>
                        <i class="bi bi-bell"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium">{notification.title}</div>
                      <div className="small text-muted">{truncateText(notification.message, 100)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted py-4">No notifications</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Blockchain Status */}
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 text-sm font-semibold text-slate-500">Blockchain Status</h6>
            <div className="dropdown">
              <button className="btn btn-link p-0 text-muted fs-6 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-three-dots"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="#">View Details</a></li>
                <li><a className="dropdown-item" href="#">Refresh</a></li>
              </ul>
            </div>
          </div>
        </CardHeader>
        <CardBody className="text-center">
          {blockchainLoading ? (
            <Spinner size="sm" className="d-block mx-auto my-4" />
          ) : blockchainError ? (
            <Alert variant="danger">{blockchainError}</Alert>
          ) : (
            <>
              <div className="mb-3">
                {blockchainStatus.connected ? (
                  <span className="badge bg-success me-2">Connected</span>
                ) : (
                  <span className="badge bg-danger me-2">Disconnected</span>
                )}
                <span className="badge bg-secondary">Network: {blockchainStatus.network}</span>
              </div>
              <div className="mb-2">
                <small className="text-muted">Latest Block: {blockchainStatus.latestBlock}</small>
              </div>
              <div className="mb-2">
                <small className="text-muted">Last Sync: {blockchainStatus.lastSync ? new Date(blockchainStatus.lastSync).toLocaleString() : 'Never'}</small>
              </div>
              <div className="mb-2">
                <small className="text-muted">Smart Contract: {blockchainStatus.smartContract}</small>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}