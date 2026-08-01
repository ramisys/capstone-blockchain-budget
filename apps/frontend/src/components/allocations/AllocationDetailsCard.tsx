import React from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { AllocationStatusBadge } from './StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { FileText, Landmark, ShieldCheck, Box, Lock } from 'lucide-react';
import type { Allocation } from '../../types/allocation';

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({
  icon,
  title,
  subtitle,
}) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const DetailSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {[1, 2, 3, 4, 5, 6].map((item) => (
      <div key={item} className="space-y-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
    ))}
  </div>
);

interface AllocationDetailsCardProps {
  allocation?: Allocation;
  loading?: boolean;
}/**
 * Detailed view of a single allocation, organized into General, Budget, and
 * Audit information sections plus a blockchain placeholder card.
 */
const AllocationDetailsCard: React.FC<AllocationDetailsCardProps> = ({ allocation, loading = false }) => {
  if (loading || !allocation) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <Skeleton className="h-5 w-40 rounded mb-6" />
          <DetailSkeleton />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-5 w-40 rounded mb-6" />
          <DetailSkeleton />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GENERAL INFO */}
      <Card className="p-6 sm:p-7 border-slate-200/80">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <SectionHeader
            icon={<FileText className="w-4.5 h-4.5" />}
            title="General Information"
            subtitle="Basic allocation details"
          />
          <AllocationStatusBadge status={allocation.status} />
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Allocation Code</dt>
            <dd className="font-mono text-sm font-bold text-indigo-700">{allocation.allocationCode}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fiscal Year</dt>
            <dd className="text-sm font-medium text-slate-800">{allocation.fiscalYear?.code}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</dt>
            <dd className="text-sm text-slate-700 leading-relaxed">
              {allocation.description || 'No description provided.'}
            </dd>
          </div>
        </dl>
      </Card>

      {/* BUDGET INFO */}
      <Card className="p-6 sm:p-7 border-slate-200/80">
        <SectionHeader
          icon={<Landmark className="w-4.5 h-4.5" />}
          title="Budget Information"
          subtitle="Department, funding, and allocation amount"
        />

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 mt-6">
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Department</dt>
            <dd className="text-sm font-medium text-slate-800">
              {allocation.department?.name}
              {allocation.department?.code && (
                <span className="block text-xs text-slate-400 font-mono">{allocation.department.code}</span>
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fund Source</dt>
            <dd className="text-sm font-medium text-slate-800">
              {allocation.fundSource?.name}
              {allocation.fundSource?.code && (
                <span className="block text-xs text-slate-400 font-mono">{allocation.fundSource.code}</span>
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Budget Category</dt>
            <dd className="text-sm font-medium text-slate-800">
              {allocation.category?.name}
              {allocation.category?.code && (
                <span className="block text-xs text-slate-400 font-mono">{allocation.category.code}</span>
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Program / PPA</dt>
            <dd className="text-sm font-medium text-slate-800">
              {allocation.program?.name}
              {allocation.program?.code && (
                <span className="block text-xs text-slate-400 font-mono">{allocation.program.code}</span>
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Allocated Amount</dt>
            <dd className="text-lg font-bold text-slate-900 tabular-nums">
              {formatCurrency(allocation.allocatedAmount)}
            </dd>
          </div>
        </dl>
      </Card>

      {/* AUDIT INFO */}
      <Card className="p-6 sm:p-7 border-slate-200/80">
        <SectionHeader
          icon={<ShieldCheck className="w-4.5 h-4.5" />}
          title="Audit Information"
          subtitle="Creator and timestamps"
        />

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5 mt-6">
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created By</dt>
            <dd className="text-sm font-medium text-slate-800">
              {allocation.creator?.fullName}
              <span className="block text-xs text-slate-400 font-normal">{allocation.creator?.email}</span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created Date</dt>
            <dd className="text-sm font-medium text-slate-800">{formatDateTime(allocation.createdAt)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Updated</dt>
            <dd className="text-sm font-medium text-slate-800">{formatDateTime(allocation.updatedAt)}</dd>
          </div>
        </dl>
      </Card>

      {/* BLOCKCHAIN PLACEHOLDER */}
      <Card className="p-6 sm:p-7 border-dashed border-slate-300 bg-slate-50/50">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800">Blockchain Verification</h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-200 text-slate-600">
                <Lock className="w-3 h-3" />
                Phase 4.4
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Immutable on-chain verification for this allocation will be available in a future phase.
              Audit trails and transaction records will be anchored to the blockchain for tamper-proof
              accountability.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export { AllocationDetailsCard };
export default AllocationDetailsCard;
