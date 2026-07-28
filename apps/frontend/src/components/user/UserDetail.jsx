import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ChevronRight,
  User,
  Mail,
  Shield,
  Activity,
  Calendar,
  Clock,
  Building2,
  Phone,
  Hash,
  LogIn,
  Copy,
  Check,
  Lock,
  KeyRound,
  UserPlus,
  CheckCircle2,
  FileEdit,
  UserCheck,
  UserCog,
  UserX,
  RefreshCw,
  ShieldCheck,
  Key,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { UserDetailSkeleton } from '../ui/Skeleton';
import { Avatar } from '../ui/Avatar';
import { RoleBadge, StatusBadge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import api from '../../api/apiClient';

function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch (err) {
    return dateString;
  }
}

function formatFullDateTime(dateString) {
  if (!dateString) return 'Not Available';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (err) {
    return dateString;
  }
}

export function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const isAdmin = user?.role === ROLES.ADMINISTRATOR;
  const isOwnProfile = user?.id === id;
  const canView = isAdmin || isOwnProfile;

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/users/${id}`);
      setUserData(response.data.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user details');
      console.error('Error fetching user details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) {
      setError('Access denied. You do not have permission to view this user.');
      setLoading(false);
      return;
    }

    fetchUserData();
  }, [id, canView]);

  const handleDeleteUser = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${id}`);
      showSuccess(`User "${userData?.fullName || userData?.email}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      navigate('/users');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete user';
      showError(msg);
      console.error('Error deleting user:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyId = () => {
    if (id) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      showSuccess('User ID copied to clipboard');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const truncatedId = useMemo(() => {
    if (!id) return '';
    return id.length > 12 ? `${id.substring(0, 8)}...${id.substring(id.length - 4)}` : id;
  }, [id]);

  if (!canView) {
    return (
      <div className="p-6 max-w-3xl mx-auto my-12 animate-fade-in">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center shadow-sm space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200/60 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Access Denied</h2>
            <p className="text-sm text-slate-500">
              You do not have administrative permission to view this user profile.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-xl">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <UserDetailSkeleton />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto my-10 animate-fade-in">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200/60 shadow-sm">
            <UserX className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Not Found</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {error || 'The requested user account may have been deleted, moved, or the provided user ID is invalid.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/users')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to User Management</span>
            </Button>
            <Button
              variant="secondary"
              onClick={fetchUserData}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <header className="space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center text-xs font-medium text-slate-500">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li>
              <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li>
              <Link to="/users" className="hover:text-indigo-600 transition-colors">
                User Management
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li className="text-slate-900 font-semibold truncate max-w-50" aria-current="page">
              {userData.fullName || 'User Details'}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-1 border-b border-slate-200/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/users')}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 hover:border-slate-300 transition-colors md:hidden"
                aria-label="Back to Users"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                User Details
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              View user account information, roles, and account status.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3 pt-2 md:pt-0">
              <Button
                variant="outline"
                onClick={() => navigate(`/users/${id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
                aria-label="Edit User"
              >
                <Pencil className="w-4 h-4 text-slate-600" />
                <span>Edit User</span>
              </Button>
              <Tooltip text={id === user?.id ? "You cannot delete your own account" : "Delete user account"}>
                <Button
                  variant="ghost"
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={deleting || id === user?.id}
                  loading={deleting}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                    id === user?.id
                      ? 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'
                      : 'text-red-600 bg-red-50/70 hover:bg-red-100/80 border-red-200/70 hover:border-red-300'
                  }`}
                  aria-label="Delete User"
                >
                  <Trash2 className={`w-4 h-4 ${id === user?.id ? 'text-slate-400' : 'text-red-600'}`} />
                  <span>Delete User</span>
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
      </header>

      <Card className="p-6 sm:p-8 bg-white border border-slate-200/90 rounded-2xl shadow-sm relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-indigo-50/60 via-purple-50/20 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <Avatar
            name={userData.fullName || userData.email}
            size="lg"
            className="w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl font-extrabold ring-4 ring-slate-100 shadow-md"
          />

          <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
                {userData.fullName || 'Unnamed User'}
              </h2>
              <p className="text-sm font-medium text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{userData.email}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <RoleBadge role={userData.role} className="px-3 py-1 text-xs" />
              <StatusBadge status={userData.status} className="px-3 py-1 text-xs" />
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                <Key className="w-3 h-3 text-slate-400" />
                <span>ID: {truncatedId}</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      <section aria-label="Account Statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Created Date</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">{formatDate(userData.createdAt)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Account registration date</p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Updated</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">{formatDate(userData.updatedAt)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Profile state modified</p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</span>
            <button
              onClick={handleCopyId}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              title="Copy User ID"
              aria-label="Copy User ID"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-sm font-mono font-bold text-slate-800 mt-2 truncate">{truncatedId}</p>
          <p className="text-xs text-slate-400 mt-0.5">Unique system UUID</p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Type</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2 truncate">{userData.role || 'Standard'}</p>
          <p className="text-xs text-slate-400 mt-0.5">System permission level</p>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">User Information</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Account Details</span>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Full Name</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{userData.fullName || '—'}</p>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Email Address</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 truncate">{userData.email || '—'}</p>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Role</span>
                </div>
                <div>
                  <RoleBadge role={userData.role} />
                </div>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Account Status</span>
                </div>
                <div>
                  <StatusBadge status={userData.status} />
                </div>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Created Date</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatDate(userData.createdAt)}</p>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Last Updated</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatDate(userData.updatedAt)}</p>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Department</span>
                  </div>
                  <span className="text-[10px] bg-slate-200/70 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                    Future
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-500 italic">General / Unassigned</p>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <Hash className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Employee ID</span>
                  </div>
                  <span className="text-[10px] bg-slate-200/70 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                    Future
                  </span>
                </div>
                <p className="text-sm font-mono font-medium text-slate-700">
                  EMP-{id ? id.substring(0, 6).toUpperCase() : '0000'}
                </p>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Phone Number</span>
                  </div>
                  <span className="text-[10px] bg-slate-200/70 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                    Future
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-500 italic">Not Provided</p>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <LogIn className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Last Login</span>
                  </div>
                  <span className="text-[10px] bg-slate-200/70 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                    Future
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700">Recent (Active Session)</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Security & Authentication</h3>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border border-indigo-200/60">
                Protected
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200/60 bg-white">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-slate-700 tracking-widest">••••••••</span>
                  <span className="text-xs text-slate-400 font-medium">Encrypted</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/60 bg-white">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Password Change</span>
                </div>
                <span className="text-sm font-medium text-slate-600">Not Available</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/60 bg-white">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                  <span>Two-Factor Authentication</span>
                </div>
                <span className="text-xs font-semibold inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Not Configured
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/60 bg-white">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Login Status</span>
                </div>
                <span className="text-xs font-semibold inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Session
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Account Activity</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Timeline</span>
            </div>

            <div className="p-6">
              <ol className="relative border-l border-slate-200 space-y-6 ml-3">
                <li className="ml-6">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full ring-4 ring-white border border-indigo-200">
                    <UserPlus className="w-3 h-3" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">User account created</p>
                    <p className="text-xs text-slate-500">{formatFullDateTime(userData.createdAt)}</p>
                    <p className="text-xs text-slate-600 pt-1">
                      Account registered with role <span className="font-semibold text-slate-800">{userData.role}</span>.
                    </p>
                  </div>
                </li>

                <li className="ml-6">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-emerald-50 text-emerald-600 rounded-full ring-4 ring-white border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">Account status verified</p>
                    <p className="text-xs text-slate-500">{formatDate(userData.createdAt)}</p>
                    <p className="text-xs text-slate-600 pt-1">
                      Initial account state set to <span className="font-semibold text-emerald-700">{userData.status}</span>.
                    </p>
                  </div>
                </li>

                <li className="ml-6">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-blue-50 text-blue-600 rounded-full ring-4 ring-white border border-blue-200">
                    <FileEdit className="w-3 h-3" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">Last updated</p>
                    <p className="text-xs text-slate-500">{formatFullDateTime(userData.updatedAt)}</p>
                    <p className="text-xs text-slate-600 pt-1">
                      System records updated for user profile parameters.
                    </p>
                  </div>
                </li>

                <li className="ml-6">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-amber-50 text-amber-600 rounded-full ring-4 ring-white border border-amber-200">
                    <KeyRound className="w-3 h-3" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">Password last changed</p>
                    <p className="text-xs text-slate-500">Not Available</p>
                    <p className="text-xs text-slate-600 pt-1">
                      Security credential update milestone.
                    </p>
                  </div>
                </li>

                <li className="ml-6">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-purple-50 text-purple-600 rounded-full ring-4 ring-white border border-purple-200">
                    <LogIn className="w-3 h-3" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">Last login session</p>
                    <p className="text-xs text-slate-500">Recent</p>
                    <p className="text-xs text-slate-600 pt-1">
                      Authenticated session activity logged.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </Card>

          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Audit Information</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Audit Trail</span>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <span>Created By</span>
                </div>
                <span className="font-semibold text-slate-800">System Administrator</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <UserCog className="w-4 h-4 text-slate-400" />
                  <span>Last Updated By</span>
                </div>
                <span className="font-semibold text-slate-800">System Administrator</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Created Date</span>
                </div>
                <span className="font-semibold text-slate-800">{formatDate(userData.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Updated Date</span>
                </div>
                <span className="font-semibold text-slate-800">{formatDate(userData.updatedAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message={`Are you sure you want to delete "${userData.fullName || userData.email}"? This action cannot be undone and will permanently remove this user account.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}