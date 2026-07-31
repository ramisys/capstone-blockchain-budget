import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useFiscalYears } from '../../hooks/useFiscalYears';
import { useFundSources } from '../../hooks/useFundSources';
import { useDepartments } from '../../hooks/useDepartments';
import { useBudgetCategories } from '../../hooks/useBudgetCategories';
import { useBudgetPrograms } from '../../hooks/useBudgetPrograms';
import { CalendarDays, Banknote, Building2, FolderTree, ClipboardList, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export function BudgetAllocationOverview() {
  const [stats, setStats] = useState({
    fiscalYears: 0,
    fundSources: 0,
    departments: 0,
    budgetCategories: 0,
    budgetPrograms: 0,
  });

  const [loading, setLoading] = useState(true);

  const { data: fyData, isLoading: fyLoading } = useFiscalYears();
  const { data: fsData, isLoading: fsLoading } = useFundSources();
  const { data: deptData, isLoading: deptLoading } = useDepartments();
  const { data: bcData, isLoading: bcLoading } = useBudgetCategories();
  const { data: bpData, isLoading: bpLoading } = useBudgetPrograms();

  useEffect(() => {
    const loadStats = () => {
      try {
        const fiscalYearsCount = fyData?.pagination?.total ?? fyData?.fiscalYears?.length ?? 0;
        const fundSourcesCount = fsData?.pagination?.total ?? fsData?.fundSources?.length ?? 0;
        const departmentsCount = deptData?.pagination?.total ?? deptData?.departments?.length ?? 0;
        const budgetCategoriesCount = bcData?.pagination?.total ?? bcData?.budgetCategories?.length ?? 0;
        const budgetProgramsCount = bpData?.pagination?.total ?? bpData?.budgetPrograms?.length ?? 0;

        setStats({
          fiscalYears: fiscalYearsCount,
          fundSources: fundSourcesCount,
          departments: departmentsCount,
          budgetCategories: budgetCategoriesCount,
          budgetPrograms: budgetProgramsCount,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!fyLoading || !fsLoading || !deptLoading || !bcLoading || !bpLoading) {
      loadStats();
    }
  }, [fyData, fsData, deptData, bcData, bpData, fyLoading, fsLoading, deptLoading, bcLoading, bpLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Budget Allocation Overview</h1>
            <p className="text-slate-500">Manage master data, budget allocations, and approval workflows.</p>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((_, index) => (
              <Card key={index} className="p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-slate-200 rounded"></div>
                    <div className="h-8 w-12 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Banner */}
        <div className="border-b border-slate-200/80 pb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Budget Allocation Overview</h1>
          <p className="text-base text-slate-600 max-w-3xl leading-relaxed">
            Manage the master data, budget allocations, and approval workflow used throughout the Budget Allocation and Expense Monitoring System.
          </p>
        </div>

        {/* Statistics Cards */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary Statistics</h2>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="p-6 h-full hover:shadow-md transition-shadow duration-200 border-slate-200/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Fiscal Years</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.fiscalYears}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 h-full hover:shadow-md transition-shadow duration-200 border-slate-200/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Fund Sources</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.fundSources}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <Banknote className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 h-full hover:shadow-md transition-shadow duration-200 border-slate-200/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Departments</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.departments}</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 h-full hover:shadow-md transition-shadow duration-200 border-slate-200/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Categories</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.budgetCategories}</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                  <FolderTree className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 h-full hover:shadow-md transition-shadow duration-200 border-slate-200/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Programs</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.budgetPrograms}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardList className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Explore Modules Cards */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Explore Master Data Modules</h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <LinkTo
              to="/budget-allocation/fiscal-years"
              title="Fiscal Years"
              description="Manage fiscal years, active date ranges, and period statuses for budget planning and tracking."
              count={stats.fiscalYears}
              icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-50"
            />

            <LinkTo
              to="/budget-allocation/fund-sources"
              title="Fund Sources"
              description="Track and manage revenue streams, grants, and funding allocations across accounts."
              count={stats.fundSources}
              icon={<Banknote className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
            />

            <LinkTo
              to="/budget-allocation/departments"
              title="Departments"
              description="Configure organizational hierarchy, department heads, contacts, and office locations."
              count={stats.departments}
              icon={<Building2 className="h-5 w-5 text-amber-600" />}
              iconBg="bg-amber-50"
            />

            <LinkTo
              to="/budget-allocation/budget-categories"
              title="Budget Categories"
              description="Categorize budget lines and expense groups for standardized financial classification."
              count={stats.budgetCategories}
              icon={<FolderTree className="h-5 w-5 text-purple-600" />}
              iconBg="bg-purple-50"
            />

            <LinkTo
              to="/budget-allocation/budget-programs"
              title="Budget Programs"
              description="Define strategic budget programs and associate them with categories and departments."
              count={stats.budgetPrograms}
              icon={<ClipboardList className="h-5 w-5 text-indigo-600" />}
              iconBg="bg-indigo-50"
            />
          </div>
        </div>

        {/* Module Implementation Roadmap Progress */}
        <div>
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">System Capability Progress</h2>
                <p className="text-sm text-slate-500 mt-0.5">Status overview of system features and active modules</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Master Data Configuration</span>
                    <p className="text-xs text-slate-500">Fiscal Years, Fund Sources, Departments, Categories, Programs</p>
                  </div>
                </div>
                <Badge variant="default" className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium w-fit">
                  Completed
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Budget Allocation Engine</span>
                    <p className="text-xs text-slate-500">Annual budget distribution, line item entries, and revision logs</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/80 w-fit">
                  Planned Phase
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Multi-Level Approval Workflow</span>
                    <p className="text-xs text-slate-500">Routing rules, approval thresholds, sign-off histories</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full border border-slate-200/80 w-fit">
                  Planned Phase
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Blockchain Audit Ledger</span>
                    <p className="text-xs text-slate-500">Immutable transaction logs and budget cryptographic verification</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full border border-slate-200/80 w-fit">
                  Planned Phase
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Navigation card component with spacious layout and micro-interactions
function LinkTo({ to, title, description, count, icon, iconBg = "bg-blue-50" }) {
  return (
    <Link
      to={to}
      className="group block transition-all duration-200 hover:-translate-y-1"
    >
      <Card className="h-full p-6 sm:p-7 hover:shadow-xl hover:border-slate-300 flex flex-col justify-between transition-all duration-200 border-slate-200/90">
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                {icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {title}
              </h3>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200/70 shrink-0">
              {count} {count === 1 ? 'record' : 'records'}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
            {description}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
          <span>Manage {title}</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </Card>
    </Link>
  );
}

export default BudgetAllocationOverview;