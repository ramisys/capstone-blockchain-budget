import React, { useState, useEffect } from 'react';
import { useListControls } from '../../hooks/useListControls';
import { useAllocationFilters } from '../../hooks/useAllocationFilters';
import { useAllocations, useDeleteAllocation } from '../../hooks/useAllocations';
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
import { Plus, AlertCircle } from 'lucide-react';

const canCreateAllocation = (role) =>
  role === ROLES.ADMINISTRATOR || role === ROLES.BUDGET_OFFICER;

export function AllocationList() {
  const { user } = useAuth();
  const role = user?.role || '';

  const { showToast } = useToast();

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

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const allocations = data?.allocations ?? [];
  const pagination = data?.pagination;

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
    setEditTarget(viewTarget);
    setViewTarget(null);
  };

  const handleArchiveFromDetails = () => {
    setDeleteTarget(viewTarget);
    setViewTarget(null);
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
              onClick={() => setIsCreateOpen(true)}
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
          onView={setViewTarget}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />

        {/* Details Dialog */}
        <AllocationDetailsDialog
          isOpen={Boolean(viewTarget)}
          onClose={() => setViewTarget(null)}
          allocation={viewTarget}
          role={role}
          onEdit={handleEditFromDetails}
          onArchive={handleArchiveFromDetails}
        />

        {/* Edit Dialog */}
        <AllocationEditDialog
          isOpen={Boolean(editTarget)}
          onClose={() => setEditTarget(null)}
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
          onClose={() => setIsCreateOpen(false)}
        />
      </div>
    </div>
  );
}

export default AllocationList;
