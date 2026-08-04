import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AllocationDetailsCard } from '../allocations/AllocationDetailsCard';
import { AllocationStatusBadge } from '../allocations/StatusBadge';
import { ApprovalHistory } from '../allocations/ApprovalHistory';
import { RejectAllocationDialog } from './RejectAllocationDialog';
import { ROLES } from '../../constants/roles';
import { ALLOCATION_STATUS } from '../../constants/allocationStatus';
import { useSubmitAllocation, useApproveAllocation, useReturnAllocation } from '../../hooks/useAllocations';
import { formatCurrency, formatDate } from '../../utils/format';
import { Archive, CheckCircle2, Eye, History, Pencil, RotateCcw, Send, X, XCircle } from 'lucide-react';
import type { Allocation } from '../../types/allocation';

const canEditAllocation = (role: string, status?: string) => {
  if (!status) return false;
  if (role !== ROLES.ADMINISTRATOR && role !== ROLES.BUDGET_OFFICER) return false;
  return status === ALLOCATION_STATUS.DRAFT;
};

const canArchiveAllocation = (role: string, status?: string) => {
  if (!status) return false;
  if (role === ROLES.ADMINISTRATOR) return status !== ALLOCATION_STATUS.ARCHIVED;
  if (role === ROLES.BUDGET_OFFICER) return status === ALLOCATION_STATUS.DRAFT;
  return false;
};

interface AllocationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allocation?: Allocation | null;
  role?: string;
  currentUserId?: string;
  onEdit?: () => void;
  onArchive?: () => void;
}

const AllocationDetailsDialog: React.FC<AllocationDetailsDialogProps> = ({
  isOpen,
  onClose,
  allocation,
  role = '',
  currentUserId = '',
  onEdit,
  onArchive,
}) => {
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const { mutateAsync: submitAllocation, isPending: isSubmitting } = useSubmitAllocation();
  const { mutateAsync: approveAllocation, isPending: isApproving } = useApproveAllocation();
  const { mutateAsync: returnAllocation, isPending: isReturning } = useReturnAllocation();

  if (!isOpen || !allocation) return null;

  const isAdmin = role === ROLES.ADMINISTRATOR;
  const isBudgetOfficer = role === ROLES.BUDGET_OFFICER;
  const isTreasurer = role === ROLES.TREASURER;
  const isApprover = isAdmin || isTreasurer;
  const isCreator = allocation.createdBy === currentUserId;

  const canEdit = canEditAllocation(role, allocation.status);
  const canArchive = canArchiveAllocation(role, allocation.status);

  const canSubmitForApproval = (isAdmin || isBudgetOfficer) && allocation.status === ALLOCATION_STATUS.DRAFT;
  const canApprove = isApprover && allocation.status === ALLOCATION_STATUS.PENDING_APPROVAL && !isCreator;
  const canReject = canApprove;
  const canReturnToDraft =
    allocation.status === ALLOCATION_STATUS.PENDING_APPROVAL
      ? isApprover && !isCreator
      : allocation.status === ALLOCATION_STATUS.REJECTED
        ? isApprover || isCreator
        : false;

  const hasWorkflowActions = canSubmitForApproval || canApprove || canReject || canReturnToDraft;
  const isMutating = isSubmitting || isApproving || isReturning;

  const handleSubmit = async () => {
    try {
      await submitAllocation(allocation.id);
      onClose();
    } catch {
      // Error toast is handled by the mutation hook.
    }
  };

  const handleApprove = async () => {
    try {
      await approveAllocation(allocation.id);
      onClose();
    } catch {
      // Error toast is handled by the mutation hook.
    }
  };

  const handleReturn = async () => {
    try {
      await returnAllocation({ id: allocation.id });
      onClose();
    } catch {
      // Error toast is handled by the mutation hook.
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-3xl! p-0! gap-0! rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden max-h-[90vh] flex! flex-col">
          {/* Fixed Header */}
          <div className="px-7 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                Allocation Details
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                Full breakdown of the budget allocation and its funding assignment.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isMutating}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 space-y-6">
            {/* Hero summary card */}
            <Card className="p-6 sm:p-7 border-slate-200/80 overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-400 to-amber-400" />
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Allocation Code
                  </p>
                  <p className="font-mono text-2xl font-bold text-indigo-700">
                    {allocation.allocationCode}
                  </p>
                  <AllocationStatusBadge status={allocation.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 sm:text-right w-full sm:w-auto">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Allocated Amount
                    </p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">
                      {formatCurrency(allocation.allocatedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Fiscal Year
                    </p>
                    <p className="text-xl font-bold text-slate-900">{allocation.fiscalYear?.code ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Created
                    </p>
                    <p className="text-xl font-bold text-slate-900">{formatDate(allocation.createdAt)}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Detailed sections */}
            <AllocationDetailsCard allocation={allocation} />

            {/* Approval workflow history */}
            <Card className="p-6 sm:p-7 border-slate-200/80">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <History className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Approval History</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Workflow decisions recorded for this allocation
                  </p>
                </div>
              </div>
              <ApprovalHistory
                allocationId={allocation.id}
                enabled={allocation.status !== ALLOCATION_STATUS.DRAFT}
              />
            </Card>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            {hasWorkflowActions && (
              <div className="flex flex-wrap items-center gap-3">
                {canSubmitForApproval && (
                  <Button
                    variant="primary"
                    type="button"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                  >
                    <Send className="w-4 h-4" />
                    Submit for Approval
                  </Button>
                )}
                {canApprove && (
                  <Button
                    variant="primary"
                    type="button"
                    onClick={handleApprove}
                    loading={isApproving}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </Button>
                )}
                {canReturnToDraft && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleReturn}
                    loading={isReturning}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Return to Draft
                  </Button>
                )}
                {canReject && (
                  <Button variant="danger" type="button" onClick={() => setIsRejectOpen(true)}>
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                )}
              </div>
            )}
            {(canEdit || canArchive) && (
              <div className="flex flex-wrap items-center gap-3">
                {canEdit && onEdit && (
                  <Button variant="outline" type="button" onClick={onEdit} disabled={isMutating}>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                )}
                {canArchive && onArchive && (
                  <Button variant="danger" type="button" onClick={onArchive} disabled={isMutating}>
                    <Archive className="w-4 h-4" />
                    {isAdmin ? 'Archive' : 'Delete'}
                  </Button>
                )}
              </div>
            )}
            <Button variant="outline" type="button" onClick={onClose} disabled={isMutating}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectAllocationDialog
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          onClose();
        }}
        allocation={allocation}
      />
    </>
  );
};

export { AllocationDetailsDialog };
export default AllocationDetailsDialog;
