import React, { useState } from 'react';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '../../hooks/useDepartments';
import { Button } from '../../components/ui/Button';
import { DepartmentTable } from '../../components/tables/DepartmentTable';
import { DepartmentCreateDialog } from '../../components/dialogs/DepartmentCreateDialog';
import { DepartmentEditDialog } from '../../components/dialogs/DepartmentEditDialog';
import { DepartmentDetailsDialog } from '../../components/dialogs/DepartmentDetailsDialog';
import { DepartmentDeleteDialog } from '../../components/dialogs/DepartmentDeleteDialog';
import { Card } from '../../components/ui/Card';

export function DepartmentManagement() {
  const {
    data: departmentsData,
    isLoading,
    isError,
    error
  } = useDepartments();

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [dialogState, setDialogState] = useState({
    create: false,
    edit: null,
    details: null,
    delete: null
  });

  const {
    mutate: createDepartment,
    isPending: isCreating
  } = useCreateDepartment();

  const {
    mutate: updateDepartment,
    isPending: isUpdating
  } = useUpdateDepartment();

  const {
    mutate: deleteDepartment,
    isPending: isDeleting
  } = useDeleteDepartment();

  const openCreateDialog = () => {
    setDialogState(prev => ({ ...prev, create: true }));
  };

  const closeCreateDialog = () => {
    setDialogState(prev => ({ ...prev, create: false }));
  };

  const openEditDialog = (department) => {
    setSelectedDepartment(department);
    setDialogState(prev => ({ ...prev, edit: department.id }));
  };

  const closeEditDialog = () => {
    setDialogState(prev => ({ ...prev, edit: null }));
    setSelectedDepartment(null);
  };

  const openDetailsDialog = (department) => {
    setSelectedDepartment(department);
    setDialogState(prev => ({ ...prev, details: department.id }));
  };

  const closeDetailsDialog = () => {
    setDialogState(prev => ({ ...prev, details: null }));
    setSelectedDepartment(null);
  };

  const openDeleteDialog = (department) => {
    setSelectedDepartment(department);
    setDialogState(prev => ({ ...prev, delete: department.id }));
  };

  const closeDeleteDialog = () => {
    setDialogState(prev => ({ ...prev, delete: null }));
    setSelectedDepartment(null);
  };

  if (isLoading) return <div className="p-8">Loading departments...</div>;
  if (isError) return <div className="p-8 text-red-500">Error loading departments: {error.message}</div>;

  const departments = departmentsData?.departments || [];
  const pagination = departmentsData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Department Management</h1>
            <p className="text-slate-500">Manage organizational departments</p>
          </div>
          <Button variant="primary" onClick={openCreateDialog} className="w-full sm:w-auto">
            <span>+ New Department</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Total Departments</h3>
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
                <h3 className="text-sm font-medium text-slate-500">Active Departments</h3>
                <p className="text-xl font-bold text-slate-900">
                  {departments.filter(d => d.status === 'Active').length}
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
                <h3 className="text-sm font-medium text-slate-500">Inactive Departments</h3>
                <p className="text-xl font-bold text-slate-900">
                  {departments.filter(d => d.status === 'Inactive').length}
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
                <h3 className="text-sm font-medium text-slate-500">Departments with Heads Assigned</h3>
                <p className="text-2xl font-bold text-slate-900">
                  {departments.filter(d => d.officeHead).length}
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

        {/* Department Table */}
        <DepartmentTable
          departments={departments}
          pagination={pagination}
          onEdit={openEditDialog}
          onDetails={openDetailsDialog}
          onDelete={openDeleteDialog}
          isLoading={isLoading}
          isDeleting={isDeleting}
          onDeleteDepartment={deleteDepartment}
        />

        {/* Dialogs */}
        <DepartmentCreateDialog
          isOpen={dialogState.create}
          onClose={closeCreateDialog}
          onSubmit={createDepartment}
          isLoading={isCreating}
        />

        <DepartmentEditDialog
          isOpen={dialogState.edit !== null}
          onClose={closeEditDialog}
          departmentId={selectedDepartment?.id || ''}
          initialData={selectedDepartment}
          onSubmit={updateDepartment}
          isLoading={isUpdating}
        />

        <DepartmentDetailsDialog
          isOpen={dialogState.details !== null}
          onClose={closeDetailsDialog}
          departmentId={selectedDepartment?.id || ''}
          initialData={selectedDepartment}
        />

        <DepartmentDeleteDialog
          isOpen={dialogState.delete !== null}
          onClose={closeDeleteDialog}
          departmentId={selectedDepartment?.id || ''}
          departmentName={selectedDepartment?.name}
          onSubmit={deleteDepartment}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}