import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';

interface DepartmentDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
  onSubmit: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const DepartmentDeleteDialog: React.FC<DepartmentDeleteDialogProps> = ({
  isOpen,
  onClose,
  departmentId,
  departmentName,
  onSubmit,
  isLoading = false
}) => {
  const { showToast } = useToast();

  const handleDelete = async () => {
    try {
      await onSubmit(departmentId);
      showToast('Department deleted successfully', 'success');
      onClose();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'Failed to delete department',
        'error'
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg! p-0! gap-0! rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden max-h-[90vh] flex! flex-col">
        {/* Fixed Header */}
        <div className="px-7 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              Delete Department
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Permanently remove this department.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 space-y-5">
          <div className="p-5 bg-red-50/80 border border-red-200/80 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 space-y-1">
              <p className="font-bold">Warning</p>
              <p>
                Are you sure you want to delete the department <strong>"{departmentName}"</strong>? This action cannot be undone.
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            This will permanently remove the department and all associated data.
          </p>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </span>
            ) : (
              'Delete Department'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { DepartmentDeleteDialog };
export default DepartmentDeleteDialog;
