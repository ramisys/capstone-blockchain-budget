import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { PublicRoute } from '../components/guards/PublicRoute';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { Forbidden } from '../pages/Forbidden';
import { NotFound } from '../pages/NotFound';
import { UserList } from '../components/user/UserList';
import { UserForm } from '../components/user/UserForm';
import { UserDetail } from '../components/user/UserDetail';
import { FiscalYearManagement } from '../pages/fiscal-years/FiscalYearManagement';
import { FundSourceManagement } from '../pages/fund-sources/FundSourceManagement';
import { DepartmentManagement } from '../pages/departments/DepartmentManagement';
import { BudgetCategoryManagement } from '../pages/budget-categories/BudgetCategoryManagement';
import { BudgetProgramManagement } from '../pages/budget-programs/BudgetProgramManagement';
import { BudgetAllocationOverview } from '../pages/budget-allocation/BudgetAllocationOverview';
import { AllocationDashboard } from '../pages/budget-allocation/AllocationDashboard';
import { AllocationList } from '../pages/budget-allocation/AllocationList';
import { ROLES } from '../constants/roles';

export function AppRoutes() {
  return (
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
          path="/budget-allocation/approval-workflow"
          element={
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Approval Workflow</h2>
              <p className="text-slate-500 mb-6">Planned feature in Phase 5</p>
              <button className="btn btn-outline-primary">Notify Me When Available</button>
            </div>
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
  );
}