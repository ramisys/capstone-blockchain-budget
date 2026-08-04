import React from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';
import { useAllocationApprovalHistory } from '../../hooks/useAllocations';
import {
  ALLOCATION_APPROVAL_ACTION_LABELS,
  ALLOCATION_APPROVAL_ACTION_VARIANTS,
} from '../../constants/allocationApproval';
import { formatDateTime } from '../../utils/format';
import { History, MessageSquareText } from 'lucide-react';
import type { ApprovalRecord } from '../../types/allocation';

interface ApprovalHistoryProps {
  allocationId: string;
  enabled?: boolean;
}

/**
 * Timeline of the approval workflow decisions recorded for an allocation,
 * newest first. Each entry shows the action, the actor, and any comment left
 * with the decision (e.g., a rejection reason).
 */
const ApprovalHistory: React.FC<ApprovalHistoryProps> = ({ allocationId, enabled = true }) => {
  const { data: approvals, isLoading, isError } = useAllocationApprovalHistory(
    enabled ? allocationId : undefined
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((item) => (
          <Skeleton key={item} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Failed to load approval history. Please try again later.
      </p>
    );
  }

  const records = approvals ?? [];

  if (records.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-5 py-4">
        <History className="w-5 h-5 text-slate-300 shrink-0" />
        <p className="text-sm text-slate-500">
          No approval activity recorded for this allocation yet.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
      {records.map((record: ApprovalRecord) => {
        const variant = ALLOCATION_APPROVAL_ACTION_VARIANTS[record.action] ?? 'secondary';
        const label = ALLOCATION_APPROVAL_ACTION_LABELS[record.action] ?? record.action;

        return (
          <li key={record.id} className="relative pl-8">
            <span
              className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 border-white bg-slate-300 shadow-sm"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={variant}>{label}</Badge>
              <span className="text-xs text-slate-400">
                {formatDateTime(record.createdAt)}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{record.actor?.fullName}</span>
              {record.actor?.role ? ` · ${record.actor.role}` : ''}
            </p>
            {record.comment && (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-500">
                <MessageSquareText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-300" />
                <span>{record.comment}</span>
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export { ApprovalHistory };
export default ApprovalHistory;
