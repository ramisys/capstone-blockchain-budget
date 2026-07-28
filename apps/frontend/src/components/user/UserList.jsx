import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  RotateCcw,
  Eye,
  Pencil,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Avatar } from '../ui/Avatar';
import { RoleBadge, StatusBadge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { Modal } from '../ui/Modal';
import { UserListSkeleton } from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { USER_STATUS } from '../../constants/status';
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

export function UserList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 0,
  });

  // Delete Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null,
  });

  const isAdmin = user?.role === ROLES.ADMINISTRATOR;

  // Handle location state toast
  useEffect(() => {
    if (location.state?.toastMessage) {
      showSuccess(location.state.toastMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showSuccess]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, roleFilter, statusFilter]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      const response = await api.get(`/users?${params.toString()}`);
      setUsers(response.data.data.users || []);
      setPaginationInfo({
        total: response.data.data.pagination?.total || 0,
        totalPages: response.data.data.pagination?.totalPages || 0,
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch users';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, debouncedSearch, roleFilter, statusFilter, pagination.page, pagination.limit, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openDeleteModal = (userToDelete) => {
    setDeleteModal({
      isOpen: true,
      user: userToDelete,
    });
  };

  const closeDeleteModal = () => {
    if (deletingId) return;
    setDeleteModal({
      isOpen: false,
      user: null,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.user) return;
    const targetUser = deleteModal.user;
    setDeletingId(targetUser.id);
    try {
      await api.delete(`/users/${targetUser.id}`);
      showSuccess(`User "${targetUser.fullName || targetUser.email}" deleted successfully.`);
      setDeleteModal({
        isOpen: false,
        user: null,
      });
      fetchUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete user.';
      showError(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const hasActiveFilters = Boolean(searchTerm || roleFilter || statusFilter);
  const startItem = paginationInfo.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, paginationInfo.total);

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Access Denied</h2>
          <p className="text-slate-600 max-w-md mx-auto m-0">
            You do not have permission to access the User Management portal. Administrator privileges are required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="welcome-heading text-slate-900 m-0">
            User Management
          </h1>
          <p className="welcome-text text-slate-500 mt-1 mb-0">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="primary"
            onClick={() => navigate('/users/new')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-medium px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
            aria-label="Add New User"
          >
            <Plus className="w-5 h-5" />
            <span>Add New User</span>
          </Button>
        </div>
      </div>

      {/* Global Error */}
      {error && !loading && (
        <Alert variant="danger" className="rounded-xl shadow-sm">
          {error}
        </Alert>
      )}

      {/* Filters Section Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 m-0">Filter Users</h2>
            {paginationInfo.total > 0 && (
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {hasActiveFilters ? `Showing ${paginationInfo.total} matching` : `${paginationInfo.total} total`}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 p-1 rounded-lg hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* 4 Column Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-0">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800"
                aria-label="Search users by name or email"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-0">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 cursor-pointer"
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              {Object.values(ROLES).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-0">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 cursor-pointer"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {Object.values(USER_STATUS).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Action Button */}
          <div>
            <Button
              variant="outline"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="w-full py-2 px-3 text-sm font-medium border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center gap-2 h-9.5"
              aria-label="Reset Filters"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset Filters</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table & Content Section */}
      {loading ? (
        <UserListSkeleton />
      ) : users.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center shadow-sm space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-200">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-slate-900 m-0">No users found</h3>
            <p className="text-sm text-slate-500 m-0">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or clear active filters.'
                : 'No users exist in the system yet. Get started by adding a new user.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleResetFilters} className="rounded-xl px-4 py-2 text-sm">
                Reset Filters
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => navigate('/users/new')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm"
            >
              Add User
            </Button>
          </div>
        </div>
      ) : (
        /* Table Card */
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse m-0">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                  <th className="py-3.5 px-5">Avatar</th>
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-5">Email</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Created Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Avatar Column */}
                    <td className="py-4 px-5 shrink-0">
                      <Avatar name={u.fullName || u.email} size="md" />
                    </td>

                    {/* Name Column */}
                    <td className="py-4 px-5 font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {u.fullName || 'Unnamed User'}
                    </td>

                    {/* Email Column */}
                    <td className="py-4 px-5 text-slate-600 font-medium">
                      {u.email}
                    </td>

                    {/* Role Badge Column */}
                    <td className="py-4 px-5">
                      <RoleBadge role={u.role} />
                    </td>

                    {/* Status Badge Column */}
                    <td className="py-4 px-5">
                      <StatusBadge status={u.status} />
                    </td>

                    {/* Created Date Column */}
                    <td className="py-4 px-5 text-slate-500 whitespace-nowrap text-xs font-medium">
                      {formatDate(u.createdAt)}
                    </td>

                    {/* Action Buttons Column */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip text="View user details">
                          <button
                            onClick={() => navigate(`/users/${u.id}`)}
                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                            aria-label={`View user ${u.fullName || u.email}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Tooltip>

                        <Tooltip text="Edit user">
                          <button
                            onClick={() => navigate(`/users/${u.id}/edit`)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                            aria-label={`Edit user ${u.fullName || u.email}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </Tooltip>

                        <Tooltip text="Delete user">
                          <button
                            onClick={() => openDeleteModal(u)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                            aria-label={`Delete user ${u.fullName || u.email}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{startItem}</span>–
              <span className="font-semibold text-slate-900">{endItem}</span> of{' '}
              <span className="font-semibold text-slate-900">{paginationInfo.total}</span> users
            </div>

            {paginationInfo.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: paginationInfo.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pagination.page === pageNum
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 border border-slate-200 hover:bg-white'
                    }`}
                    aria-label={`Go to page ${pageNum}`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= paginationInfo.totalPages}
                  className="p-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${
          deleteModal.user?.fullName ? `"${deleteModal.user.fullName}"` : 'this user'
        }? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
        loading={Boolean(deletingId)}
      />
    </div>
  );
}