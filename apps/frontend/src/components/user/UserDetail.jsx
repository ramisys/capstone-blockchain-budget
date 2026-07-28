import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
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

export function UserDetail() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isAdmin = user?.role === ROLES.ADMINISTRATOR;
  const isOwnProfile = user?.id === userId;
  const canView = isAdmin || isOwnProfile;

  useEffect(() => {
    if (!canView) {
      setError('Access denied. You do not have permission to view this user.');
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/users/${userId}`);
        setUserData(response.data.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load user details');
        console.error('Error fetching user details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, canView]);

  const handleDeleteUser = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${userId}`);
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

  if (!canView) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="warning">Access denied. You do not have permission to view this user.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline" onClick={() => navigate('/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="info">No user data available</Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Users</span>
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Details</h1>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/users/${userId}/edit`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-slate-300 hover:bg-slate-50"
            >
              <Pencil className="w-4 h-4 text-blue-600" />
              <span>Edit User</span>
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete User</span>
            </Button>
          </div>
        )}
      </div>

      {/* User Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar name={userData.fullName || userData.email} size="lg" className="w-20 h-20 text-xl font-bold" />
          <div className="space-y-2 text-center sm:text-left flex-1">
            <h2 className="text-2xl font-extrabold text-slate-900">{userData.fullName}</h2>
            <p className="text-sm font-medium text-slate-500">{userData.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <RoleBadge role={userData.role} />
              <StatusBadge status={userData.status} />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created Date</span>
            <p className="font-semibold text-slate-800">{formatDate(userData.createdAt)}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Updated</span>
            <p className="font-semibold text-slate-800">{formatDate(userData.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete "${userData.fullName || userData.email}"? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}