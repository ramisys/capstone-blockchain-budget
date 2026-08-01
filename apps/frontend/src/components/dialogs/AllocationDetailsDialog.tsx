import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AllocationDetailsCard } from '../allocations/AllocationDetailsCard';
import { AllocationStatusBadge } from '../allocations/StatusBadge';
import { ROLES } from '../../constants/roles';
import { formatCurrency, formatDate } from '../../utils/format';
import { Archive, Eye, Pencil, X } from 'lucide-react';
import type { Allocation } from '../../types/allocation';

const canEditAllocation = (role: string, status?: string) => {
  if (!status) return false;
  if (role !== ROLES.ADMINISTRATOR && role !== ROLES.BUDGET_OFFICER) return false;
  return status === 'Draft';
};

const canArchiveAllocation = (role: string, status?: string) => {
  if (!status) return false;
  if (role === ROLES.ADMINISTRATOR) return status !== 'Archived';
  if (role === ROLES.BUDGET_OFFICER) return status === 'Draft';
  return false;
};

interface AllocationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allocation?: Allocation | null;
  role?: string;
  onEdit?: () => void;
  onArchive?: () => void;
}

const AllocationDetailsDialog: React.FC<AllocationDetailsDialogProps> = ({
  isOpen,
  onClose,
  allocation,
  role = '',
  onEdit,
  onArchive,
}) => {
  if (!isOpen || !allocation) return null;

  const canEdit = canEditAllocation(role, allocation.status);
  const canArchive = canArchiveAllocation(role, allocation.status);

  return (
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
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          {(canEdit || canArchive) && (
            <div className="flex flex-wrap items-center gap-3">
              {canEdit && onEdit && (
                <Button variant="outline" type="button" onClick={onEdit}>
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              )}
              {canArchive && onArchive && (
                <Button variant="danger" type="button" onClick={onArchive}>
                  <Archive className="w-4 h-4" />
                  {role === ROLES.ADMINISTRATOR ? 'Archive' : 'Delete'}
                </Button>
              )}
            </div>
          )}
          <Button variant="outline" type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { AllocationDetailsDialog };
export default AllocationDetailsDialog;
