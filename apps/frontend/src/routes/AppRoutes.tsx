import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { PublicRoute } from '../components/guards/PublicRoute';
import { PageSpinner } from '../components/ui/Spinner';
import { ROLES } from '../constants/roles';

const Login = lazy(() => import('../pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('../pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Profile = lazy(() => import('../pages/Profile').then((m) => ({ default: m.Profile })));
const Forbidden = lazy(() => import('../pages/Forbidden').then((m) => ({ default: m.Forbidden })));
const NotFound = lazy(() => import('../pages/NotFound').then((m) => ({ default: m.NotFound })));
const UserList = lazy(() => import('../components/user/UserList').then((m) => ({ default: m.UserList })));
const UserForm = lazy(() => import('../components/user/UserForm').then((m) => ({ default: m.UserForm })));
const UserDetail = lazy(() => import('../components/user/UserDetail').then((m) => ({ default: m.UserDetail })));
const FiscalYearManagement = lazy(() => import('../pages/fiscal-years/FiscalYearManagement').then((m) => ({ default: m.FiscalYearManagement })));
const FundSourceManagement = lazy(() => import('../pages/fund-sources/FundSourceManagement').then((m) => ({ default: m.FundSourceManagement })));
const DepartmentManagement = lazy(() => import('../pages/departments/DepartmentManagement').then((m) => ({ default: m.DepartmentManagement })));
const BudgetCategoryManagement = lazy(() => import('../pages/budget-categories/BudgetCategoryManagement').then((m) => ({ default: m.BudgetCategoryManagement })));
const BudgetProgramManagement = lazy(() => import('../pages/budget-programs/BudgetProgramManagement').then((m) => ({ default: m.BudgetProgramManagement })));
const BudgetAllocationOverview = lazy(() => import('../pages/budget-allocation/BudgetAllocationOverview').then((m) => ({ default: m.BudgetAllocationOverview })));
const AllocationDashboard = lazy(() => import('../pages/budget-allocation/AllocationDashboard').then((m) => ({ default: m.AllocationDashboard })));
const AllocationList = lazy(() => import('../pages/budget-allocation/AllocationList').then((m) => ({ default: m.AllocationList })));
const BlockchainLedger = lazy(() => import('../pages/blockchain/BlockchainLedger').then((m) => ({ default: m.BlockchainLedger })));
const DocumentList = lazy(() => import('../pages/documents/DocumentList').then((m) => ({ default: m.DocumentList })));
const DocumentUpload = lazy(() => import('../pages/documents/DocumentUpload').then((m) => ({ default: m.DocumentUpload })));
const DocumentDetail = lazy(() => import('../pages/documents/DocumentDetail').then((m) => ({ default: m.DocumentDetail })));
const AuditLogs = lazy(() => import('../pages/audit/AuditLogs').then((m) => ({ default: m.AuditLogs })));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* User Management Routes (Administrator only) */}
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRATOR]}>
              <UserList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/new"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRATOR]}>
              <UserForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRATOR]}>
              <UserDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRATOR]}>
              <UserForm />
            </ProtectedRoute>
          }
        />

        {/* Budget Allocation Structured Routes */}
        <Route path="/budget-allocation" element={<BudgetAllocationOverview />} />
        <Route path="/budget-allocation/fiscal-years" element={<FiscalYearManagement />} />
        <Route path="/budget-allocation/fund-sources" element={<FundSourceManagement />} />
        <Route path="/budget-allocation/departments" element={<DepartmentManagement />} />
        <Route path="/budget-allocation/budget-categories" element={<BudgetCategoryManagement />} />
        <Route path="/budget-allocation/budget-programs" element={<BudgetProgramManagement />} />
        <Route path="/budget-allocation/allocations/dashboard" element={<AllocationDashboard />} />
        <Route path="/budget-allocation/allocations" element={<AllocationList />} />
        <Route path="/budget-allocation/allocations/new" element={<AllocationList />} />
        <Route path="/budget-allocation/allocations/:id/edit" element={<AllocationList />} />
        <Route path="/budget-allocation/allocations/:id" element={<AllocationList />} />
        <Route
          path="/budget-allocation/blockchain"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER, ROLES.AUDITOR]}>
              <BlockchainLedger />
            </ProtectedRoute>
          }
        />
        <Route path="/budget-allocation/approval-workflow"
          element={
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Approval Workflow</h2>
              <p className="text-slate-500 mb-6">Planned feature in Phase 5</p>
              <button className="btn btn-outline-primary">Notify Me When Available</button>
            </div>
          }
        />

        {/* Document Management Routes */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER, ROLES.AUDITOR]}>
              <DocumentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/upload"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER]}>
              <DocumentUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER, ROLES.AUDITOR]}>
              <DocumentDetail />
            </ProtectedRoute>
          }
        />

        {/* Audit Trail Routes */}
        <Route
          path="/audit"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER, ROLES.AUDITOR]}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        {/* Legacy Root Path Aliases for Backward Compatibility */}
        <Route path="/fiscal-years" element={<Navigate to="/budget-allocation/fiscal-years" replace />} />
        <Route path="/fund-sources" element={<Navigate to="/budget-allocation/fund-sources" replace />} />
        <Route path="/departments" element={<Navigate to="/budget-allocation/departments" replace />} />
        <Route path="/budget-categories" element={<Navigate to="/budget-allocation/budget-categories" replace />} />
        <Route path="/budget-programs" element={<Navigate to="/budget-allocation/budget-programs" replace />} />
        <Route path="/budget-allocations" element={<Navigate to="/budget-allocation/allocations" replace />} />
        <Route path="/approval-workflow" element={<Navigate to="/budget-allocation/approval-workflow" replace />} />

        {/* Expense Tracking Placeholder Route */}
        <Route
          path="/expense-tracking"
          element={
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Expense Tracking</h2>
              <p className="text-slate-500 mb-6">Planned feature in Phase 4</p>
              <button className="btn btn-outline-primary">Notify Me When Available</button>
            </div>
          }
        />
      </Route>

      <Route path="/403" element={<Forbidden />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}