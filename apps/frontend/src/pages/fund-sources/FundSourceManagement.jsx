import React, { useState } from 'react';
import { useFundSources, useCreateFundSource, useUpdateFundSource, useDeleteFundSource } from '../../hooks/useFundSources';
import { Button } from '../../components/ui/Button';
import { FundSourceTable } from '../../components/tables/FundSourceTable';
import { FundSourceCreateDialog } from '../../components/dialogs/FundSourceCreateDialog';
import { FundSourceEditDialog } from '../../components/dialogs/FundSourceEditDialog';
import { FundSourceDetailsDialog } from '../../components/dialogs/FundSourceDetailsDialog';
import { FundSourceDeleteDialog } from '../../components/dialogs/FundSourceDeleteDialog';
import { Card } from '../../components/ui/Card';

export function FundSourceManagement() {
  const {
    data: fundSourcesData,
    isLoading,
    isError,
    error
  } = useFundSources();

  const [selectedFundSource, setSelectedFundSource] = useState(null);
  const [dialogState, setDialogState] = useState({
    create: false,
    edit: null,
    details: null,
    delete: null
  });

  const {
    mutate: createFundSource,
    isPending: isCreating
  } = useCreateFundSource();

  const {
    mutate: updateFundSource,
    isPending: isUpdating
  } = useUpdateFundSource();

  const {
    mutate: deleteFundSource,
    isPending: isDeleting
  } = useDeleteFundSource();

  const openCreateDialog = () => {
    setDialogState(prev => ({ ...prev, create: true }));
  };

  const closeCreateDialog = () => {
    setDialogState(prev => ({ ...prev, create: false }));
  };

  const openEditDialog = (fundSource) => {
    setSelectedFundSource(fundSource);
    setDialogState(prev => ({ ...prev, edit: fundSource.id }));
  };

  const closeEditDialog = () => {
    setDialogState(prev => ({ ...prev, edit: null }));
    setSelectedFundSource(null);
  };

  const openDetailsDialog = (fundSource) => {
    setSelectedFundSource(fundSource);
    setDialogState(prev => ({ ...prev, details: fundSource.id }));
  };

  const closeDetailsDialog = () => {
    setDialogState(prev => ({ ...prev, details: null }));
    setSelectedFundSource(null);
  };

  const openDeleteDialog = (fundSource) => {
    setSelectedFundSource(fundSource);
    setDialogState(prev => ({ ...prev, delete: fundSource.id }));
  };

  const closeDeleteDialog = () => {
    setDialogState(prev => ({ ...prev, delete: null }));
    setSelectedFundSource(null);
  };

  if (isLoading) return <div className="p-8">Loading fund sources...</div>;
  if (isError) return <div className="p-8 text-red-500">Error loading fund sources: {error.message}</div>;

  const fundSources = fundSourcesData?.fundSources || [];
  const pagination = fundSourcesData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Fund Source Management</h1>
            <p className="text-slate-500">Manage fund sources for budget allocation</p>
          </div>
          <Button variant="primary" onClick={openCreateDialog} className="w-full sm:w-auto">
            <span>+ New Fund Source</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Total Fund Sources</h3>
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
                <h3 className="text-sm font-medium text-slate-500">Active Fund Sources</h3>
                <p className="text-xl font-bold text-slate-900">
                  {fundSources.filter(fs => fs.status === 'Active').length}
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
                <h3 className="text-sm font-medium text-slate-500">Inactive Fund Sources</h3>
                <p className="text-xl font-bold text-slate-900">
                  {fundSources.filter(fs => fs.status === 'Inactive').length}
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
                <h3 className="text-sm font-medium text-slate-500">Recently Added</h3>
                <p className="text-2xl font-bold text-slate-900">
                  {fundSources.slice(0, 3).length}
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

        {/* Fund Source Table */}
        <FundSourceTable
          fundSources={fundSources}
          pagination={pagination}
          onEdit={openEditDialog}
          onDetails={openDetailsDialog}
          onDelete={openDeleteDialog}
          isLoading={isLoading}
          isDeleting={isDeleting}
          onDeleteFundSource={deleteFundSource}
        />

        {/* Dialogs */}
        <FundSourceCreateDialog
          isOpen={dialogState.create}
          onClose={closeCreateDialog}
          onSubmit={createFundSource}
          isLoading={isCreating}
        />

        <FundSourceEditDialog
          isOpen={dialogState.edit !== null}
          onClose={closeEditDialog}
          fundSourceId={selectedFundSource?.id || ''}
          initialData={selectedFundSource}
          onSubmit={updateFundSource}
          isLoading={isUpdating}
        />

        <FundSourceDetailsDialog
          isOpen={dialogState.details !== null}
          onClose={closeDetailsDialog}
          fundSourceId={selectedFundSource?.id || ''}
          initialData={selectedFundSource}
        />

        <FundSourceDeleteDialog
          isOpen={dialogState.delete !== null}
          onClose={closeDeleteDialog}
          fundSourceId={selectedFundSource?.id || ''}
          fundSourceName={selectedFundSource?.name}
          onSubmit={deleteFundSource}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}