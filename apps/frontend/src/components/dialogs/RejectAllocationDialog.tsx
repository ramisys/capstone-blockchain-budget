import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useRejectAllocation } from '../../hooks/useAllocations';
import { AlertCircle, XCircle } from 'lucide-react';
import type { Allocation } from '../../types/allocation';

interface RejectAllocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allocation?: Allocation | null;
}

const MAX_REASON_LENGTH = 500;

/**
 * Collects the mandatory rejection reason before sending an allocation back to
 * the submitter. The reason is persisted on the allocation and in the approval
 * history.
 */
const RejectAllocationDialog: React.FC<RejectAllocationDialogProps> = ({
  isOpen,
  onClose,
  allocation,
}) => {
  const { mutateAsync: rejectAllocation, isPending: isRejecting } = useRejectAllocation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !allocation) return null;

  const isSubmitting = isRejecting;

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('A rejection reason is required');
      return;
    }
    if (trimmed.length > MAX_REASON_LENGTH) {
      setError(`Rejection reason must not exceed ${MAX_REASON_LENGTH} characters`);
      return;
    }

    setError('');
    try {
      await rejectAllocation({ id: allocation.id, reason: trimmed });
      onClose();
    } catch {
      // Error toast is handled by the mutation hook.
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg! rounded-2xl shadow-2xl border border-slate-200/90 bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            Reject Allocation
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            Rejecting <span className="font-mono font-semibold text-slate-700">{allocation.allocationCode}</span>{' '}
            sends it back to the submitter for revision. Provide a clear reason so it can be fixed and resubmitted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="rejectReason" className="text-sm font-semibold text-slate-800">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="rejectReason"
            rows={4}
            autoFocus
            disabled={isSubmitting}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Explain why this allocation is being rejected..."
            className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-400 focus:ring-red-500/20'
                : 'border-slate-300 focus:ring-indigo-500/20'
            } ${isSubmitting ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`}
          />
          <div className="flex items-center justify-between">
            {error ? (
              <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-slate-400 tabular-nums">{reason.length}/{MAX_REASON_LENGTH}</span>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" type="button" onClick={handleSubmit} loading={isSubmitting}>
            {isSubmitting ? 'Rejecting...' : 'Reject Allocation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { RejectAllocationDialog };
export default RejectAllocationDialog;
