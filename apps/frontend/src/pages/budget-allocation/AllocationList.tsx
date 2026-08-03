import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useListControls } from '../../hooks/useListControls';
import { useAllocationFilters } from '../../hooks/useAllocationFilters';
import { useAllocations, useAllocationById, useDeleteAllocation } from '../../hooks/useAllocations';
import { useAllocationOptions } from '../../hooks/useAllocationOptions';
import { useAuth } from '../../hooks/useAuth';
import { AllocationTable } from '../../components/allocations/AllocationTable';
import { AllocationSearch } from '../../components/allocations/AllocationSearch';
import { AllocationFilters } from '../../components/allocations/AllocationFilters';
import { ConfirmDeleteDialog } from '../../components/allocations/ConfirmDeleteDialog';
import { AllocationCreateDialog } from '../../components/dialogs/AllocationCreateDialog';
import { AllocationEditDialog } from '../../components/dialogs/AllocationEditDialog';
import { AllocationDetailsDialog } from '../../components/dialogs/AllocationDetailsDialog';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { ROLES } from '../../constants/roles';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import type { Allocation } from '../../types/allocation';

interface LocationState {
  allocation?: Allocation;
  action?: 'view' | 'edit' | 'create';
  viewId?: string | number;
  editId?: string | number;
  allocationId?: string | number;
  id?: string | number;
  openCreate?: boolean;
  create?: boolean;
}

const canCreateAllocation = (role: string) =>
  role === ROLES.ADMINISTRATOR || role === ROLES.BUDGET_OFFICER;

export function AllocationList() {
  const { user } = useAuth();
  const role = user?.role || '';

  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  const locationState = location.state as LocationState | null;

  const isPathNew = location.pathname.endsWith('/new');
  const isPathEdit = location.pathname.endsWith('/edit') && Boolean(params.id);
  const pathId = params.id;

  const viewId = useMemo(() => {
    if (searchParams.get('view')) return searchParams.get('view');
    if (locationState?.viewId) return String(locationState.viewId);
    if (locationState?.action === 'view' && (locationState.id || locationState.allocationId)) {
      return String(locationState.id || locationState.allocationId);
    }
    if (pathId && !isPathEdit) return String(pathId);
    return null;
  }, [searchParams, locationState, pathId, isPathEdit]);

  const editId = useMemo(() => {
    if (searchParams.get('edit')) return searchParams.get('edit');
    if (locationState?.editId) return String(locationState.editId);
    if (locationState?.action === 'edit' && (locationState.id || locationState.allocationId)) {
      return String(locationState.id || locationState.allocationId);
    }
    if (pathId && isPathEdit) return String(pathId);
    return null;
  }, [searchParams, locationState, pathId, isPathEdit]);

  const shouldOpenCreate = useMemo(() => {
    if (isPathNew) return true;
    if (
      searchParams.get('new') === 'true' ||
      searchParams.get('create') === 'true' ||
      searchParams.get('action') === 'create'
    ) {
      return true;
    }
    if (locationState?.openCreate || locationState?.create || locationState?.action === 'create') {
      return true;
    }
    return false;
  }, [isPathNew, searchParams, locationState]);

  const {
    search,
    setSearch,
    debouncedSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortBy,
    sortOrder,
    handleSort,
  } = useListControls({ initialSortBy: 'newest' });

  const { filters, filtersKey, hasActiveFilters, setFilter, resetFilters } = useAllocationFilters();

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAllocations(
    { ...filters, search: debouncedSearch || undefined },
    { page, limit: pageSize },
    { sortBy, sortOrder },
  );

  const { fiscalYears, departments, fundSources, categories, programs, isLoading: optionsLoading } =
    useAllocationOptions();

  const { mutate: deleteAllocation, isPending: isDeleting } = useDeleteAllocation();

  const [deleteTarget, setDeleteTarget] = useState<Allocation | null>(null);
  const [viewTarget, setViewTarget] = useState<Allocation | null>(null);
  const [editTarget, setEditTarget] = useState<Allocation | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const allocations = data?.allocations ?? [];
  const pagination = data?.pagination;

  // Single allocation query for deep-linking by ID
  const activeDeepLinkId = viewId || editId;
  const {
    data: fetchedAllocation,
    isLoading: isFetchingTarget,
    isError: isTargetError,
  } = useAllocationById(activeDeepLinkId || undefined);

  const clearDeepLink = useCallback(() => {
    const isSpecialPath = isPathNew || Boolean(pathId);
    const hasDeepLinkParams =
      searchParams.has('view') ||
      searchParams.has('edit') ||
      searchParams.has('new') ||
      searchParams.has('create') ||
      searchParams.has('action');

    const hasDeepLinkState = Boolean(
      locationState?.viewId ||
        locationState?.editId ||
        locationState?.action ||
        locationState?.openCreate ||
        locationState?.create ||
        locationState?.allocation ||
        locationState?.id ||
        locationState?.allocationId
    );

    if (isSpecialPath) {
      navigate('/budget-allocation/allocations', { replace: true, state: {} });
    } else if (hasDeepLinkParams || hasDeepLinkState) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('view');
      nextParams.delete('edit');
      nextParams.delete('new');
      nextParams.delete('create');
      if (nextParams.get('action') === 'create') {
        nextParams.delete('action');
      }

      navigate(
        {
          pathname: location.pathname,
          search: nextParams.toString() ? `?${nextParams.toString()}` : '',
        },
        { replace: true, state: {} }
      );
    }
  }, [isPathNew, pathId, searchParams, locationState, location.pathname, navigate]);

  // Synchronize view dialog with deep-linked viewId
  useEffect(() => {
    if (!viewId) {
      if (viewTarget) setViewTarget(null);
      return;
    }

    if (viewTarget && String(viewTarget.id) === String(viewId)) return;

    if (locationState?.allocation && String(locationState.allocation.id) === String(viewId)) {
      setViewTarget(locationState.allocation);
      return;
    }

    const inList = allocations.find((a: Allocation) => String(a.id) === String(viewId));
    if (inList) {
      setViewTarget(inList);
      return;
    }

    if (fetchedAllocation && String(fetchedAllocation.id) === String(viewId)) {
      setViewTarget(fetchedAllocation);
    }
  }, [viewId, viewTarget, locationState, allocations, fetchedAllocation]);

  // Synchronize edit dialog with deep-linked editId
  useEffect(() => {
    if (!editId) {
      if (editTarget) setEditTarget(null);
      return;
    }

    if (editTarget && String(editTarget.id) === String(editId)) return;

    if (locationState?.allocation && String(locationState.allocation.id) === String(editId)) {
      setEditTarget(locationState.allocation);
      return;
    }

    const inList = allocations.find((a: Allocation) => String(a.id) === String(editId));
    if (inList) {
      setEditTarget(inList);
      return;
    }

    if (fetchedAllocation && String(fetchedAllocation.id) === String(editId)) {
      setEditTarget(fetchedAllocation);
    }
  }, [editId, editTarget, locationState, allocations, fetchedAllocation]);

  // Synchronize create dialog with deep link
  useEffect(() => {
    if (shouldOpenCreate && canCreateAllocation(role)) {
      setIsCreateOpen(true);
    } else if (!shouldOpenCreate && isCreateOpen) {
      setIsCreateOpen(false);
    }
  }, [shouldOpenCreate, role, isCreateOpen]);

  // Handle deep-link fetch errors gracefully
  useEffect(() => {
    if (isTargetError && (viewId || editId)) {
      showToast('The requested allocation could not be found or has been removed.', 'error');
      clearDeepLink();
    }
  }, [isTargetError, viewId, editId, showToast, clearDeepLink]);

  const handleOpenView = (allocation: Allocation) => {
    setViewTarget(allocation);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('edit');
    nextParams.set('view', String(allocation.id));
    setSearchParams(nextParams, { replace: true });
  };

  const handleCloseView = () => {
    setViewTarget(null);
    clearDeepLink();
  };

  const handleOpenEdit = (allocation: Allocation) => {
    setEditTarget(allocation);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('view');
    nextParams.set('edit', String(allocation.id));
    setSearchParams(nextParams, { replace: true });
  };

  const handleCloseEdit = () => {
    setEditTarget(null);
    clearDeepLink();
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('create', 'true');
    setSearchParams(nextParams, { replace: true });
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    clearDeepLink();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAllocation(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        showToast(
          role === ROLES.ADMINISTRATOR
            ? `Allocation ${deleteTarget.allocationCode} archived successfully`
            : `Allocation ${deleteTarget.allocationCode} deleted successfully`,
          'success'
        );
      },
      onError: (err: any) => {
        setDeleteTarget(null);
        showToast(
          err?.response?.data?.message || 'Failed to delete allocation',
          'error'
        );
      },
    });
  };

  const handleEditFromDetails = () => {
    const current = viewTarget;
    setViewTarget(null);
    if (current) {
      setEditTarget(current);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('view');
      nextParams.set('edit', String(current.id));
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleArchiveFromDetails = () => {
    const current = viewTarget;
    setViewTarget(null);
    clearDeepLink();
    if (current) {
      setDeleteTarget(current);
    }
  };

  const deleteDialogCopy =
    role === ROLES.ADMINISTRATOR
      ? {
          title: 'Archive Allocation',
          bodyTitle: 'Are you sure you want to archive this allocation?',
          confirmLabel: 'Archive Allocation',
        }
      : {
          title: 'Delete Allocation',
          bodyTitle: 'Are you sure you want to delete this allocation?',
          confirmLabel: 'Delete Allocation',
        };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Loading overlay for direct ID deep linking when fetching data */}
        {isFetchingTarget && (viewId || editId) && !viewTarget && !editTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs">
            <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg border border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Loading allocation details...</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Budget Allocations</h1>
            <p className="text-slate-500">
              Create, track, and manage budget allocations across departments and fund sources.
            </p>
          </div>
          {canCreateAllocation(role) && (
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New Allocation
            </Button>
          )}
        </div>

        {isError && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200/80 bg-red-50 px-5 py-4">
            <div className="flex items-center gap-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Failed to load allocations: {error?.message || 'Please try again.'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Search */}
        <AllocationSearch value={search} onChange={setSearch} />

        {/* Advanced Filters */}
        <AllocationFilters
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          fiscalYears={fiscalYears}
          departments={departments}
          fundSources={fundSources}
          categories={categories}
          programs={programs}
          loading={optionsLoading}
        />

        {/* Table */}
        <AllocationTable
          allocations={allocations}
          loading={isLoading}
          pagination={pagination}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          role={role}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
          onDelete={setDeleteTarget}
        />

        {/* Details Dialog */}
        <AllocationDetailsDialog
          isOpen={Boolean(viewTarget)}
          onClose={handleCloseView}
          allocation={viewTarget}
          role={role}
          onEdit={handleEditFromDetails}
          onArchive={handleArchiveFromDetails}
        />

        {/* Edit Dialog */}
        <AllocationEditDialog
          isOpen={Boolean(editTarget)}
          onClose={handleCloseEdit}
          allocation={editTarget}
        />

        {/* Delete/Archive Confirmation */}
        <ConfirmDeleteDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isLoading={isDeleting}
          itemName={deleteTarget?.allocationCode}
          {...deleteDialogCopy}
        />

        {/* Create Dialog */}
        <AllocationCreateDialog
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
        />
      </div>
    </div>
  );
}

export default AllocationList;
