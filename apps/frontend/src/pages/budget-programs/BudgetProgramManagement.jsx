import React, { useState } from 'react';
import { useBudgetPrograms, useCreateBudgetProgram, useUpdateBudgetProgram, useDeleteBudgetProgram } from '../../hooks/useBudgetPrograms';
import { useDepartments } from '../../hooks/useDepartments';
import { useBudgetCategories } from '../../hooks/useBudgetCategories';
import { Button } from '../../components/ui/Button';
import { BudgetProgramTable } from '../../components/tables/BudgetProgramTable';
import { BudgetProgramCreateDialog } from '../../components/dialogs/BudgetProgramCreateDialog';
import { BudgetProgramEditDialog } from '../../components/dialogs/BudgetProgramEditDialog';
import { BudgetProgramDetailsDialog } from '../../components/dialogs/BudgetProgramDetailsDialog';
import { BudgetProgramDeleteDialog } from '../../components/dialogs/BudgetProgramDeleteDialog';
import { Card } from '../../components/ui/Card';

export function BudgetProgramManagement() {
  const {
    data: programsData,
    isLoading,
    isError,
    error
  } = useBudgetPrograms();

  const {
    data: departmentsData,
    isLoading: isLoadingDepartments
  } = useDepartments();

  const {
    data: categoriesData,
    isLoading: isLoadingCategories
  } = useBudgetCategories();

  const departments = departmentsData?.departments || [];
  const budgetCategories = categoriesData?.budgetCategories || [];

  const [selectedProgram, setSelectedProgram] = useState(null);
  const [dialogState, setDialogState] = useState({
    create: false,
    edit: null,
    details: null,
    delete: null
  });

  const {
    mutate: createBudgetProgram,
    isPending: isCreating
  } = useCreateBudgetProgram();

  const {
    mutate: updateBudgetProgram,
    isPending: isUpdating
  } = useUpdateBudgetProgram();

  const {
    mutate: deleteBudgetProgram,
    isPending: isDeleting
  } = useDeleteBudgetProgram();

  const openCreateDialog = () => {
    setDialogState(prev => ({ ...prev, create: true }));
  };

  const closeCreateDialog = () => {
    setDialogState(prev => ({ ...prev, create: false }));
  };

  const openEditDialog = (program) => {
    setSelectedProgram(program);
    setDialogState(prev => ({ ...prev, edit: program.id }));
  };

  const closeEditDialog = () => {
    setDialogState(prev => ({ ...prev, edit: null }));
    setSelectedProgram(null);
  };

  const openDetailsDialog = (program) => {
    setSelectedProgram(program);
    setDialogState(prev => ({ ...prev, details: program.id }));
  };

  const closeDetailsDialog = () => {
    setDialogState(prev => ({ ...prev, details: null }));
    setSelectedProgram(null);
  };

  const openDeleteDialog = (program) => {
    setSelectedProgram(program);
    setDialogState(prev => ({ ...prev, delete: program.id }));
  };

  const closeDeleteDialog = () => {
    setDialogState(prev => ({ ...prev, delete: null }));
    setSelectedProgram(null);
  };

  if (isLoading) return <div className="p-8">Loading budget programs...</div>;
  if (isError) return <div className="p-8 text-red-500">Error loading budget programs: {error.message}</div>;

  const programs = programsData?.budgetPrograms || [];
  const pagination = programsData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Budget Program Management</h1>
            <p className="text-slate-500">Manage budget programs for financial planning and tracking</p>
          </div>
          <Button variant="primary" onClick={openCreateDialog} className="w-full sm:w-auto">
            <span>+ New Budget Program</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Total Budget Programs</h3>
                <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2a2 2 0 110-4 2 2 0 010 4zm0-6a4 4 0 110 8 4 4 0 010-8z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Active Programs</h3>
                <p className="text-xl font-bold text-slate-900">
                  {programs.filter(p => p.status === 'Active').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Inactive Programs</h3>
                <p className="text-xl font-bold text-slate-900">
                  {programs.filter(p => p.status === 'Inactive').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Programs with Departments Assigned</h3>
                <p className="text-2xl font-bold text-slate-900">
                  {programs.filter(p => p.departmentId).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Budget Program Table */}
        <BudgetProgramTable
          programs={programs}
          pagination={pagination}
          onEdit={openEditDialog}
          onDetails={openDetailsDialog}
          onDelete={openDeleteDialog}
          isLoading={isLoading}
          isDeleting={isDeleting}
          onDeleteBudgetProgram={deleteBudgetProgram}
        />

        {/* Dialogs */}
        <BudgetProgramCreateDialog
          isOpen={dialogState.create}
          onClose={closeCreateDialog}
          onSubmit={createBudgetProgram}
          isLoading={isCreating}
          departments={departments}
          budgetCategories={budgetCategories}
          departmentsLoading={isLoadingDepartments}
          budgetCategoriesLoading={isLoadingCategories}
        />

        <BudgetProgramEditDialog
          isOpen={dialogState.edit !== null}
          onClose={closeEditDialog}
          programId={selectedProgram?.id || ''}
          initialData={selectedProgram}
          onSubmit={updateBudgetProgram}
          isLoading={isUpdating}
          departments={departments}
          budgetCategories={budgetCategories}
          departmentsLoading={isLoadingDepartments}
          budgetCategoriesLoading={isLoadingCategories}
        />

        <BudgetProgramDetailsDialog
          isOpen={dialogState.details !== null}
          onClose={closeDetailsDialog}
          programId={selectedProgram?.id || ''}
          initialData={selectedProgram}
        />

        <BudgetProgramDeleteDialog
          isOpen={dialogState.delete !== null}
          onClose={closeDeleteDialog}
          programId={selectedProgram?.id || ''}
          programName={selectedProgram?.name}
          onSubmit={deleteBudgetProgram}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}