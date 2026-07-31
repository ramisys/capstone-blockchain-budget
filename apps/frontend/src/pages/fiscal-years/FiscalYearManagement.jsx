import React, { useState } from 'react';
import { useFiscalYears, useCreateFiscalYear, useUpdateFiscalYear, useDeleteFiscalYear, useSetActiveFiscalYear } from '../../hooks/useFiscalYears';
import { Button } from '../../components/ui/Button';
import { FiscalYearTable } from '../../components/tables/FiscalYearTable';
import { FiscalYearCreateDialog } from '../../components/dialogs/FiscalYearCreateDialog';
import { FiscalYearEditDialog } from '../../components/dialogs/FiscalYearEditDialog';
import { FiscalYearDetailsDialog } from '../../components/dialogs/FiscalYearDetailsDialog';
import { FiscalYearDeleteDialog } from '../../components/dialogs/FiscalYearDeleteDialog';
import { FiscalYearActivateDialog } from '../../components/dialogs/FiscalYearActivateDialog';
import { Card } from '../../components/ui/Card';

export function FiscalYearManagement() {
  const {
    data: fiscalYearsData,
    isLoading,
    isError,
    error
  } = useFiscalYears();

  const [selectedFiscalYear, setSelectedFiscalYear] = useState(null);
  const [dialogState, setDialogState] = useState({
    create: false,
    edit: null,
    details: null,
    delete: null,
    activate: null
  });

  const {
    mutate: createFiscalYear,
    isPending: isCreating
  } = useCreateFiscalYear();

  const {
    mutate: updateFiscalYear,
    isPending: isUpdating
  } = useUpdateFiscalYear();

  const {
    mutate: deleteFiscalYear,
    isPending: isDeleting
  } = useDeleteFiscalYear();

  const {
    mutate: setActiveFiscalYear,
    isPending: isActivating
  } = useSetActiveFiscalYear();

  const openCreateDialog = () => {
    setDialogState(prev => ({ ...prev, create: true }));
  };

  const closeCreateDialog = () => {
    setDialogState(prev => ({ ...prev, create: false }));
  };

  const openEditDialog = (fiscalYear) => {
    setSelectedFiscalYear(fiscalYear);
    setDialogState(prev => ({ ...prev, edit: fiscalYear.id }));
  };

  const closeEditDialog = () => {
    setDialogState(prev => ({ ...prev, edit: null }));
    setSelectedFiscalYear(null);
  };

  const openDetailsDialog = (fiscalYear) => {
    setSelectedFiscalYear(fiscalYear);
    setDialogState(prev => ({ ...prev, details: fiscalYear.id }));
  };

  const closeDetailsDialog = () => {
    setDialogState(prev => ({ ...prev, details: null }));
    setSelectedFiscalYear(null);
  };

  const openDeleteDialog = (fiscalYear) => {
    setSelectedFiscalYear(fiscalYear);
    setDialogState(prev => ({ ...prev, delete: fiscalYear.id }));
  };

  const closeDeleteDialog = () => {
    setDialogState(prev => ({ ...prev, delete: null }));
    setSelectedFiscalYear(null);
  };

  const openActivateDialog = (fiscalYear) => {
    setSelectedFiscalYear(fiscalYear);
    setDialogState(prev => ({ ...prev, activate: fiscalYear.id }));
  };

  const closeActivateDialog = () => {
    setDialogState(prev => ({ ...prev, activate: null }));
    setSelectedFiscalYear(null);
  };

  if (isLoading) return <div className="p-8">Loading fiscal years...</div>;
  if (isError) return <div className="p-8 text-red-500">Error loading fiscal years: {error.message}</div>;

  const fiscalYears = fiscalYearsData?.fiscalYears || [];
  const pagination = fiscalYearsData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Fiscal Year Management</h1>
            <p className="text-slate-500">Manage fiscal years for budget planning and allocation</p>
          </div>
          <Button variant="primary" onClick={openCreateDialog} className="w-full sm:w-auto">
            <span>+ New Fiscal Year</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Total Fiscal Years</h3>
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
                <h3 className="text-sm font-medium text-slate-500">Active Fiscal Year</h3>
                <p className="text-xl font-bold text-slate-900">
                  {fiscalYears.find(fy => fy.isActive)?.code || 'None'}
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
                <h3 className="text-sm font-medium text-slate-500">Current Year</h3>
                <p className="text-xl font-bold text-slate-900">
                  {new Date().getFullYear().toString().slice(-2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Upcoming Years</h3>
                <p className="text-2xl font-bold text-slate-900">
                  {fiscalYears.filter(fy => !fy.isActive && new Date(fy.startDate) > new Date()).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Fiscal Year Table */}
        <FiscalYearTable
          fiscalYears={fiscalYears}
          pagination={pagination}
          onEdit={openEditDialog}
          onDetails={openDetailsDialog}
          onDelete={openDeleteDialog}
          onActivate={openActivateDialog}
          isLoading={isLoading}
          isDeleting={isDeleting}
          isActivating={isActivating}
          onDeleteFiscalYear={deleteFiscalYear}
          onSetActiveFiscalYear={setActiveFiscalYear}
        />

        {/* Dialogs */}
        <FiscalYearCreateDialog
          isOpen={dialogState.create}
          onClose={closeCreateDialog}
          onSubmit={createFiscalYear}
          isLoading={isCreating}
        />

        <FiscalYearEditDialog
          isOpen={dialogState.edit !== null}
          onClose={closeEditDialog}
          fiscalYearId={selectedFiscalYear?.id || ''}
          initialData={selectedFiscalYear}
          onSubmit={updateFiscalYear}
          isLoading={isUpdating}
        />

        <FiscalYearDetailsDialog
          isOpen={dialogState.details !== null}
          onClose={closeDetailsDialog}
          fiscalYearId={selectedFiscalYear?.id || ''}
          initialData={selectedFiscalYear}
        />

        <FiscalYearDeleteDialog
          isOpen={dialogState.delete !== null}
          onClose={closeDeleteDialog}
          fiscalYearId={selectedFiscalYear?.id || ''}
          fiscalYearName={`${selectedFiscalYear?.code} - ${selectedFiscalYear?.description}`}
          onSubmit={deleteFiscalYear}
          isLoading={isDeleting}
        />

        <FiscalYearActivateDialog
          isOpen={dialogState.activate !== null}
          onClose={closeActivateDialog}
          fiscalYearId={selectedFiscalYear?.id || ''}
          fiscalYearName={`${selectedFiscalYear?.code} - ${selectedFiscalYear?.description}`}
          onSubmit={setActiveFiscalYear}
          isLoading={isActivating}
        />
      </div>
    </div>
  );
}