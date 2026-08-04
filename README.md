# Blockchain-Based Budget Allocation and Expense Monitoring System

Production-ready monorepo workspace containing the backend services, frontend application, smart contracts, and shared packages. A university capstone project designed as a real government financial management platform.

## Monorepo Architecture

```
capstone/
├── apps/
│   ├── backend/      # Express.js REST API server & Prisma ORM
│   ├── frontend/     # React 19 + Vite frontend application
│   └── contracts/    # Blockchain smart contracts (placeholder)
├── packages/
│   └── shared/       # Shared utilities and constants
├── docs/             # Project documentation
├── package.json      # Root npm Workspaces configuration
└── .gitignore
```

## Technology Stack

### Frontend
- **React 19** — UI library
- **Vite** — Build tool and dev server
- **React Router DOM** — Client-side routing
- **Axios** — HTTP client with JWT interceptors
- **Bootstrap 5** — CSS framework (custom-styled with navy/gold theme)
- **React Hook Form** — Form state management
- **Zod** — Schema validation
- **Context API** — Authentication state
- **Lucide React** — Icon library
- **Recharts** — Charting library

### Backend
- **Node.js** — Runtime
- **Express.js** — Web framework
- **Prisma ORM** — Database access
- **MySQL** — Relational database
- **JWT** — Access token authentication
- **bcrypt** — Password hashing
- **Helmet** — Security headers
- **CORS** — Cross-origin resource sharing
- **express-rate-limit** — Rate limiting
- **Zod** — Request validation

### Shared
- Shared utilities and constants

### Smart Contracts
- Placeholder for blockchain integration (future phases)

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL database running
- npm workspaces enabled

### Installation

```bash
# Install all workspace dependencies
npm install

# Set up backend environment
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your database credentials and JWT secret
```

### Environment Variables (`apps/backend/.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=mysql://user:password@localhost:3306/budgetchain
JWT_SECRET=your-strong-secret-here
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:3000
```

### Database Setup

```bash
# Generate Prisma client
cd apps/backend
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed default admin account
npm run seed
```

Default seed credentials:
- Email: `admin@university.edu`
- Password: `AdminPassword123!`
- Role: `Administrator`

## Running the Application

### Development Mode

Run both from the root directory:

```bash
# Start backend (port 5000)
npm run dev:backend

# Start frontend (port 3000, proxies /api to 5000)
npm run dev:frontend
```

Or run individually:

```bash
# Backend
cd apps/backend
npm run dev

# Frontend
cd apps/frontend
npm run dev
```

### Production Build

```bash
npm run build:frontend
```

## Available Scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev:backend` | Start backend in watch mode |
| `npm run dev:frontend` | Start frontend dev server |
| `npm run backend` | Start backend production server |
| `npm run frontend` | Start frontend dev server |
| `npm run test:backend` | Run backend test suite |
| `npm run build:frontend` | Build frontend for production |

## API Endpoints

### Authentication (`/api/auth`)
- `POST /login` — Authenticate user & get JWT token (public, rate-limited)
- `POST /logout` — Invalidate session (requires auth)
- `GET /me` — Get current user profile (requires auth)
- `GET /health` — Server health check (public)

### Dashboard (`/api/dashboard`) — Private (Admin, Treasurer, BudgetOfficer, Auditor)
- `GET /stats` — Dashboard statistics
- `GET /charts` — Dashboard charts data
- `GET /activities` — Recent activities
- `GET /notifications` — Notifications
- `GET /blockchain` — Blockchain status

### Users (`/api/users`) — Private (Admin only)
- `GET /` — Get all users with filtering and pagination
- `GET /:id` — Get user by ID
- `POST /` — Create a new user
- `PUT /:id` — Update user by ID
- `DELETE /:id` — Delete user by ID
- `PATCH /:id/role` — Change user role
- `PATCH /:id/status` — Change user status

### Fiscal Years (`/api/fiscal-years`) — Private (all authenticated roles)
- `GET /` — Get all fiscal years
- `GET /:id` — Get fiscal year by ID
- `POST /` — Create fiscal year
- `PUT /:id` — Update fiscal year
- `DELETE /:id` — Delete fiscal year

### Departments (`/api/departments`) — Private (all authenticated roles)
- `GET /` — Get all departments
- `GET /:id` — Get department by ID
- `POST /` — Create department
- `PUT /:id` — Update department
- `DELETE /:id` — Delete department

### Fund Sources (`/api/fund-sources`) — Private (all authenticated roles)
- `GET /` — Get all fund sources
- `GET /:id` — Get fund source by ID
- `POST /` — Create fund source
- `PUT /:id` — Update fund source
- `DELETE /:id` — Delete fund source

### Budget Categories (`/api/budget-categories`) — Private (all authenticated roles)
- `GET /` — Get all budget categories
- `GET /:id` — Get budget category by ID
- `POST /` — Create budget category
- `PUT /:id` — Update budget category
- `DELETE /:id` — Delete budget category

### Budget Programs (`/api/budget-programs`) — Private (all authenticated roles)
- `GET /` — Get all budget programs
- `GET /:id` — Get budget program by ID
- `POST /` — Create budget program
- `PUT /:id` — Update budget program
- `DELETE /:id` — Delete budget program

### Budget Allocations (`/api/allocations`) — Private (roles vary)
- `GET /` — Get all allocations with filtering, pagination, sorting (Admin, Treasurer, BudgetOfficer, Auditor)
- `GET /statistics` — Get allocation dashboard statistics (Admin, Treasurer, BudgetOfficer, Auditor)
- `GET /remaining-budget` — Get total budget, allocated, and remaining (Admin, Treasurer, BudgetOfficer, Auditor)
- `GET /:id` — Get allocation by ID (Admin, Treasurer, BudgetOfficer, Auditor)
- `POST /` — Create new budget allocation (Admin, BudgetOfficer)
- `PUT /:id` — Update draft budget allocation (Admin, BudgetOfficer)
- `DELETE /:id` — Soft-delete budget allocation (Admin, BudgetOfficer)

### Budget Allocation Approval (`/api/allocations`) — Private (roles vary)
- `POST /:id/submit` — Submit a Draft allocation for approval (Admin, BudgetOfficer)
- `POST /:id/approve` — Approve a PendingApproval allocation (Admin, Treasurer)
- `POST /:id/reject` — Reject a PendingApproval allocation with a reason (Admin, Treasurer)
- `POST /:id/return` — Return an allocation to Draft for revision (Admin, Treasurer, BudgetOfficer)
- `GET /:id/approvals` — Get approval history for an allocation (Admin, Treasurer, BudgetOfficer, Auditor)

## Database Schema

### Core Models
- **User** — Authentication & authorization (id, fullName, email, password, role, status)
- **FiscalYear** — Budget periods (id, code, description, startDate, endDate, budgetAmount, status)
- **FundSource** — Funding sources (id, code, name, description, status)
- **Department** — Organizational units (id, code, name, officeHead, contactNumber, email, officeAddress, status)
- **BudgetCategory** — Expense categories (id, code, name, description, status)
- **BudgetProgram** — Programs linking departments & categories (id, code, name, description, departmentId, budgetCategoryId, status)
- **BudgetAllocation** — Budget allocations (id, allocationCode, fiscalYearId, departmentId, fundSourceId, categoryId, programId, allocatedAmount, description, status, createdBy, submittedAt, reviewedBy, reviewedAt, rejectionReason)
- **AllocationApproval** — Approval workflow history (id, allocationId, action, comment, actorId, createdAt)

### Enums
- **Role**: Administrator, Treasurer, BudgetOfficer, Auditor
- **Status**: Active, Inactive
- **FiscalYearStatus**: Active, Inactive, Archived
- **AllocationStatus**: Draft, PendingApproval, Approved, Rejected, Archived
- **AllocationApprovalAction**: Submitted, Approved, Rejected, Returned

## Frontend Pages

### Authentication
- **Login** — User authentication
- **Profile** — User profile management

### Dashboard
- **Dashboard** — Main dashboard with stats, charts, activities, notifications, blockchain status

### Budget Allocation
- **BudgetAllocationOverview** — Multi-tab overview (Dashboard, Allocations, Departments, Fund Sources, Categories, Programs)
- **AllocationDashboard** — Statistics cards, budget utilization, fiscal year filter
- **AllocationList** — List with filters, pagination, create/edit/delete actions

### Master Data Management
- **FiscalYears** — CRUD for fiscal years
- **Departments** — CRUD for departments
- **FundSources** — CRUD for fund sources
- **BudgetCategories** — CRUD for budget categories
- **BudgetPrograms** — CRUD for budget programs

### System
- **Forbidden** — 403 page
- **NotFound** — 404 page

## Development Progress

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Completed | Authentication & Authorization (JWT, RBAC, protected routes) |
| Phase 2 | ✅ Completed | User Management (CRUD, role assignment, status management) |
| Phase 3 | ✅ Completed | Dashboard & Analytics (KPI cards, charts, activities, notifications) |
| Phase 4 | 🟢 In Progress | Budget Allocation Management (CRUD, approval workflow, categories) |
| Phase 5 | ⏳ Planned | Expense Monitoring & Tracking |
| Phase 6 | ⏳ Planned | Audit Logs & Blockchain Integration |
| Phase 7 | ⏳ Planned | Reports & Analytics Dashboard |
| Phase 8 | ⏳ Planned | System Optimization & Performance |
| Phase 9 | ⏳ Planned | Security Enhancements |
| Phase 10 | ⏳ Planned | User Experience Refinements |
| Phase 11 | ⏳ Planned | Documentation & Training |
| Phase 12 | ⏳ Planned | Finalization & Defense Preparation |

## Current Focus (Phase 4)

The team is currently implementing:
- Budget allocation CRUD operations
- Allocation approval workflow (Draft → PendingApproval → Approved/Rejected → Draft for revision)
  - Submission, approval, rejection (with mandatory reason), and return-to-draft endpoints
  - Role-based review (Admin/Treasurer) with self-approval prevention
  - Approval history trail per allocation
- Master data management (Fiscal Years, Departments, Fund Sources, Categories, Programs)
- Multi-year budget planning support
- Budget utilization tracking and statistics

## Development Roadmap

### ✅ Phase 1 – Authentication & Authorization (Completed)
- Project setup & architecture
- JWT-based authentication
- Role-Based Access Control (Admin, Treasurer, BudgetOfficer, Auditor)
- Protected routes & authentication context
- Input validation & security headers

### ✅ Phase 2 – User Management System (Completed)
- User CRUD operations
- Role-based access control
- User validation & search/filtering
- User profile/details view
- Permission management (Admin only)

### ✅ Phase 3 – Dashboard & Analytics (Completed)
- Dashboard layout with stats cards
- KPI/Summary cards (totals, active/inactive, role breakdown)
- Interactive charts (users by role, users by status)
- Recent activities feed
- Notifications system
- Blockchain status display
- Backend API integration
- Responsive design

### 🟢 Phase 4 – Budget Allocation Management (In Progress)
- Budget allocation CRUD operations
- Allocation approval workflow
- Master data CRUD (Fiscal Years, Departments, Fund Sources, Categories, Programs)
- Multi-year budget planning
- Budget utilization tracking
- Statistics dashboard with filters

### ⏳ Phase 5 – Expense Monitoring & Tracking
- Expense submission and approval workflow
- Expense categorization and tagging
- Receipt attachment and management
- Expense policy enforcement
- Real-time expense tracking dashboards
- Budget utilization tracking
- Expense history and reporting

### ⏳ Phase 6 – Audit Logs & Blockchain Integration
- Immutable audit trail for all financial transactions
- Blockchain-based transaction verification
- Smart contract integration for budget execution
- Access logs and user activity tracking
- Compliance reporting tools

### ⏳ Phase 7 – Reports & Analytics Dashboard
- Financial reporting tools (budget vs. actual)
- Spending trend analysis and forecasting
- Custom report generation
- Data export capabilities (CSV, PDF)
- Interactive data visualizations

### ⏳ Phase 8 – System Optimization & Performance
- Database query optimization
- API response caching
- Frontend performance improvements
- Load testing and stress testing

### ⏳ Phase 9 – Security Enhancements
- Advanced security testing
- Penetration testing
- Security monitoring and alerting
- Data encryption at rest and in transit

### ⏳ Phase 10 – User Experience Refinements
- User feedback integration
- UI/UX improvements based on usability testing
- Accessibility enhancements (WCAG compliance)
- Multi-language support

### ⏳ Phase 11 – Documentation & Training
- Comprehensive user manuals
- Technical documentation
- Training materials and video tutorials
- FAQ and troubleshooting guides

### ⏳ Phase 12 – Finalization & Defense Preparation
- Final system testing and bug fixing
- Preparation for capstone defense
- Final presentation and demo
- Project documentation and code handover

## Summary of Improvements

This README provides a clear overview of the project's technology stack, setup instructions, API endpoints, database schema, frontend pages, development progress, and detailed roadmap for all 12 phases of development.