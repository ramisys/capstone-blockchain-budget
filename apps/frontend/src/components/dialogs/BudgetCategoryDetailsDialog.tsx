import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { format } from 'date-fns';
import { Button } from '../ui/Button';
import { FolderOpen, X } from 'lucide-react';

interface BudgetCategoryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  initialData: any; // Ideally typed as BudgetCategory
}

const BudgetCategoryDetailsDialog: React.FC<BudgetCategoryDetailsDialogProps> = ({
  isOpen,
  onClose,
  categoryId,
  initialData
}) => {
  if (!isOpen || !initialData) return null;

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl! p-0! gap-0! rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden max-h-[90vh] flex! flex-col">
        {/* Fixed Header */}
        <div className="px-7 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <FolderOpen className="w-5 h-5" />
              </div>
              Budget Category Details
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              View budget category information.
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
        <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 space-y-7">
          {/* Summary */}
          <div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-0.5">
                <p className="text-sm text-slate-500">{initialData.code}</p>
                <h3 className="text-lg font-bold text-slate-900">
                  {initialData.name}
                </h3>
              </div>
              <Badge variant={initialData.status === 'Active' ? 'default' : 'secondary'}>
                {initialData.status}
              </Badge>
            </div>
            {initialData.description && (
              <p className="text-sm text-slate-500">
                {initialData.description}
              </p>
            )}
          </div>

          {/* System Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-md">
                System Information
              </span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created At</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDateTime(initialData.createdAt)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Updated At</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDateTime(initialData.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { BudgetCategoryDetailsDialog };
export default BudgetCategoryDetailsDialog;
