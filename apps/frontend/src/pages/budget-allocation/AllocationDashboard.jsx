import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAllocationStatistics,
  useRemainingBudget,
} from '../../hooks/useAllocations';
import { useAllocationOptions } from '../../hooks/useAllocationOptions';
import { useAuth } from '../../hooks/useAuth';
import { StatisticsCard } from '../../components/allocations/StatisticsCard';
import { BudgetSummary } from '../../components/allocations/BudgetSummary';
import { AllocationStatsSkeleton } from '../../components/allocations/LoadingSkeleton';
import { AllocationCreateDialog } from '../../components/dialogs/AllocationCreateDialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ROLES } from '../../constants/roles';
import { formatCurrency } from '../../utils/format';
import {
  Wallet,
  Banknote,
  PiggyBank,
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';

const ALL_FISCAL_YEARS = '__all__';

const canCreateAllocation = (role) =>
  role === ROLES.ADMINISTRATOR || role === ROLES.BUDGET_OFFICER;

export function AllocationDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || '';

  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string | undefined>(undefined);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { fiscalYears, isLoading: optionsLoading } = useAllocationOptions();
  const { data: statistics, isLoading: statsLoading } = useAllocationStatistics(
    selectedFiscalYearId
  );
  const { data: budget, isLoading: budgetLoading } = useRemainingBudget(
    selectedFiscalYearId ? { fiscalYearId: selectedFiscalYearId } : {}
  );

  const scopeLabel = selectedFiscalYearId
    ? `for ${fiscalYears.find((fy) => fy.id === selectedFiscalYearId)?.code ?? 'selected fiscal year'}`
    : 'across all fiscal years';

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Allocation Dashboard</h1>
            <p className="text-slate-500">
              Monitor budget distribution, utilization, and allocation statuses {scopeLabel}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedFiscalYearId ?? ALL_FISCAL_YEARS}
              onValueChange={(val) =>
                setSelectedFiscalYearId(val === ALL_FISCAL_YEARS ? undefined : val)
              }
              disabled={optionsLoading}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="All fiscal years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FISCAL_YEARS}>All Fiscal Years</SelectItem>
                {fiscalYears.map((fy) => (
                  <SelectItem key={fy.id} value={fy.id}>
                    {fy.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => navigate('/budget-allocation/allocations')}>
              Manage Allocations
              <ArrowRight className="w-4 h-4" />
            </Button>
            {canCreateAllocation(role) && (
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                New Allocation
              </Button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary Statistics</h2>
          {statsLoading ? (
            <AllocationStatsSkeleton count={7} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatisticsCard
                title="Total Allocations"
                value={statistics?.totalAllocations ?? 0}
                icon={Wallet}
                iconClassName="bg-indigo-50 text-indigo-600"
                subtitle="All time"
              />
              <StatisticsCard
                title="Total Allocated"
                value={formatCurrency(statistics?.totalAllocatedAmount ?? 0)}
                icon={Banknote}
                iconClassName="bg-emerald-50 text-emerald-600"
                subtitle="Across approved allocations"
              />
              <StatisticsCard
                title="Remaining Budget"
                value={formatCurrency(statistics?.remainingBudget ?? 0)}
                icon={PiggyBank}
                iconClassName="bg-amber-50 text-amber-600"
                subtitle="Available to allocate"
              />
              <StatisticsCard
                title="Draft"
                value={statistics?.draftCount ?? 0}
                icon={FileEdit}
                iconClassName="bg-slate-100 text-slate-600"
                subtitle="Awaiting completion"
              />
              <StatisticsCard
                title="Pending Approval"
                value={statistics?.pendingApprovalCount ?? 0}
                icon={Clock}
                iconClassName="bg-orange-50 text-orange-600"
                subtitle="In review queue"
              />
              <StatisticsCard
                title="Approved"
                value={statistics?.approvedCount ?? 0}
                icon={CheckCircle2}
                iconClassName="bg-green-50 text-green-600"
                subtitle="Ready for use"
              />
              <StatisticsCard
                title="Rejected"
                value={statistics?.rejectedCount ?? 0}
                icon={XCircle}
                iconClassName="bg-red-50 text-red-600"
                subtitle="Needs revision"
              />
              <StatisticsCard
                title="Fiscal Years Scoped"
                value={selectedFiscalYearId ? 1 : fiscalYears.length}
                icon={Wallet}
                iconClassName="bg-purple-50 text-purple-600"
                subtitle={selectedFiscalYearId ? 'Filtered scope' : 'All in system'}
              />
            </div>
          )}
        </div>

        {/* Budget summary */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Budget Utilization</h2>
          <BudgetSummary data={budget} loading={budgetLoading} />
        </div>

        {/* Create Dialog */}
        <AllocationCreateDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      </div>
    </div>
  );
}

export default AllocationDashboard;
