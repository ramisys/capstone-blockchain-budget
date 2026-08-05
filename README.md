# Blockchain-Based Budget Allocation and Expense Monitoring System

Production-ready monorepo workspace containing the backend services, frontend application, smart contracts, and shared packages. A university capstone project designed as a real government financial management platform.

## Monorepo Architecture

```
capstone/
├── apps/
│   ├── backend/      # Express.js REST API server & Prisma ORM
│   ├── frontend/     # React 19 + Vite frontend application
│   └── contracts/    # Hardhat smart contracts (BudgetLedger EVM ledger)
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
- **Tailwind CSS** — Utility-first styling for newer components
- **TanStack Query** — Server-state management (data fetching, caching, mutations)
- **Radix UI** — Accessible primitives (Dialog, Select, DropdownMenu)
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
- **Hardhat** — EVM development environment
- **Solidity** — Smart contract language (`BudgetLedger.sol`, `AuditLedger.sol`)
- **ethers v6** — Blockchain interaction library (deploy + smoke scripts)

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL database running
- npm workspaces enabled
- Optional: local EVM node (Hardhat) for blockchain anchoring features

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

# Blockchain / EVM (optional — app runs without a node)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_NETWORK=hardhat-local
BLOCKCHAIN_CHAIN_ID=31337
# BLOCKCHAIN_CONTRACT_ADDRESS=0x...  (defaults to deployments/contracts.json)
# BLOCKCHAIN_PRIVATE_KEY=0x...
```

Blockchain settings can be left unset — the app reports `NotConfigured` and stays fully usable. See `apps/backend/.env.example` for the complete list.

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

Default seed credentials (see `apps/backend/prisma/seed.js`):

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@university.edu` | `AdminPassword123!` |
| Budget Officer | `budgetofficer@university.edu` | `BudgetOfficer123!` |
| Treasurer | `treasurer@university.edu` | `Treasurer123!` |
| Auditor | `auditor@university.edu` | `Auditor123!` |

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

### Blockchain (Phase 4.4 / 4.6)

Start a local EVM node and deploy `BudgetLedger` + `AuditLedger`, then verify with the smoke test:

```bash
# Terminal 1 — start the local Hardhat node (port 8545)
npm run blockchain:node

# Terminal 2 — compile and deploy, writes apps/contracts/deployments/contracts.json
npm run blockchain:compile
npm run blockchain:deploy

# Terminal 3 — run the contract-layer smoke test (optional)
npx --workspace=apps/contracts hardhat run scripts/smoke.js --network localhost
```

The backend reads the deployed addresses from `deployments/contracts.json` automatically (`address` for `BudgetLedger`, `auditLedgerAddress` for `AuditLedger`). Allocation records and document hashes are SHA-256 hashed and anchored on `BudgetLedger`; persisted audit events are anchored on `AuditLedger`. If the node is unreachable, records are marked `Pending`/`Failed` and can be retried later (manually or by the 60s scheduler).

## Available Scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev:backend` | Start backend in watch mode |
| `npm run dev:frontend` | Start frontend dev server |
| `npm run backend` | Start backend production server |
| `npm run frontend` | Start frontend dev server |
| `npm run test:backend` | Run backend test suite |
| `npm run test:frontend` | Run frontend test suite |
| `npm run test` | Run backend then frontend tests |
| `npm run build:frontend` | Build frontend for production |
| `npm run blockchain:compile` | Compile smart contracts (Hardhat) |
| `npm run blockchain:node` | Start local EVM node (Hardhat, :8545) |
| `npm run blockchain:deploy` | Deploy `BudgetLedger` to the local node |

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
- `GET /timeline` — Merged financial activity timeline (allocations, documents, audits, anchors)

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

### Blockchain Ledger (`/api/blockchain`) — Private (Admin, Treasurer, BudgetOfficer, Auditor)
- `GET /status` — Ledger status, contract address, on-chain count, sync info
- `GET /transactions` — Paginated transaction history (search, status filter, sort)
- `GET /history` — Unified type-aware ledger history (Allocation / Document / Audit) with filter + pagination
- `GET /transactions/:id` — Full transaction detail by type, incl. block-explorer link
- `GET /allocations/:id` — Verification details for a single allocation
- `POST /allocations/:id/verify` — Re-verify an allocation against the on-chain anchor
- `POST /allocations/:id/retry` — Re-anchor a `Pending`/`Failed` record (Admin, Treasurer, BudgetOfficer)

### Documents (`/api/documents`) — Private (Admin, Treasurer, BudgetOfficer, Auditor)
- `GET /` — List documents with filtering, pagination, sorting
- `GET /:id` — Get document by ID (current version + verification status)
- `POST /` — Upload a new document (multipart; Admin/Treasurer/BudgetOfficer)
- `PUT /:id` — Update document metadata (Admin/Treasurer/BudgetOfficer)
- `POST /:id/replace` — Replace the current version with a new file (multipart)
- `GET /:id/versions` — Full version history
- `GET /:id/activity` — Persisted activity timeline for a document
- `GET /:id/verify` — Verify a version's integrity + on-chain anchor
- `POST /:id/retry` — Re-anchor a `Pending`/`Failed` version (Admin/Treasurer/BudgetOfficer)
- `GET /:id/download` — Download a version as an attachment
- `GET /:id/preview` — Preview a version inline (PDFs/images)
- `DELETE /:id` — Archive + soft-delete a document (versions kept)

### Audit Logs (`/api/audit-logs`) — Private (all 4 roles; retry: Admin, Treasurer, BudgetOfficer)
- `GET /` — Paginated audit trail (search, action, result, resource, actor, date, sort)
- `GET /summary` — Counts by action/result + pending anchors
- `GET /:id` — Single entry (anchor status + block-explorer link)
- `POST /:id/retry` — Re-anchor a `Pending`/`Failed` event on `AuditLedger`

### File Verification (`/api/verification`) — Private (all 4 roles)
- `POST /documents` — Verify an uploaded file against stored hashes + ledger without storing it (returns verified / inconclusive / no-match)

## Database Schema

### Core Models
- **User** — Authentication & authorization (id, fullName, email, password, role, status)
- **RefreshToken** — Rotated refresh-token sessions
- **FiscalYear** — Budget periods (id, code, description, startDate, endDate, budgetAmount, status)
- **FundSource** — Funding sources (id, code, name, description, status)
- **Department** — Organizational units (id, code, name, officeHead, contactNumber, email, officeAddress, status)
- **BudgetCategory** — Expense categories (id, code, name, description, status)
- **BudgetProgram** — Programs linking departments & categories (id, code, name, description, departmentId, budgetCategoryId, status)
- **BudgetAllocation** — Budget allocations (id, allocationCode, fiscalYearId, departmentId, fundSourceId, categoryId, programId, allocatedAmount, description, status, createdBy, submittedAt, reviewedBy, reviewedAt, rejectionReason)
- **AllocationApproval** — Approval workflow history (id, allocationId, action, comment, actorId, createdAt)
- **BlockchainRecord** — On-chain ledger anchors (id, allocationId, allocationCode, contentHash, txHash, blockNumber, network, status, confirmedAt, supersededAt, createdBy, createdAt, updatedAt)
- **ManagedDocument** — Uploaded documents (id, documentCode, documentType, title, description, departmentId, allocationId, fiscalYearId, uploadedBy, status, deletedAt, ...)
- **DocumentVersion** — Versioned file hashes (id, documentId, versionNumber, originalFileName, storageKey, mimeType, fileSizeBytes, sha256Hash, txHash, blockNumber, network, blockchainStatus, confirmedAt, ...)
- **DocumentActivity** — Document lifecycle timeline (id, documentId, versionId, action, actorId, details, createdAt)
- **AuditLog** — Append-only audit trail (id, action, result, actor snapshots, ip, resource refs, details, eventHash, anchorStatus, txHash, blockNumber, network, confirmedAt, createdAt)

### Enums
- **Role**: Administrator, Treasurer, BudgetOfficer, Auditor
- **Status**: Active, Inactive
- **FiscalYearStatus**: Active, Inactive, Archived
- **AllocationStatus**: Draft, PendingApproval, Approved, Rejected, Archived
- **AllocationApprovalAction**: Submitted, Approved, Rejected, Returned
- **BlockchainRecordStatus**: Pending, Confirmed, Failed
- **DocumentType**: PurchaseRequest, PurchaseOrder, Quotation, Receipt, Invoice, DisbursementVoucher, LiquidationReport, BudgetProposal, Contract, Other
- **DocumentStatus**: Active, Archived
- **AuditResult**: Success, Failure
- **AuditAnchorStatus**: Pending, Confirmed, Failed

## Frontend Pages

### Authentication
- **Login** — User authentication
- **Profile** — User profile management

### Dashboard
- **Dashboard** — Main dashboard with stats, charts, activities, notifications, blockchain status, and the financial activity timeline

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

### Documents
- **DocumentManagement** — Document library with upload, replace, version history, activity timeline, verify, retry, download, preview
- **VerifyDocument** (`/verification`) — Verify any external file against the ledger without storing it (verified / inconclusive / no-match results)

### Blockchain
- **BlockchainLedger** — Unified type-aware ledger history (Allocation / Document / Audit) with record-type filter, status summary, transaction detail drawer, verify/retry actions

### Audit & System
- **AuditLogs** (`/audit-logs`) — Queryable audit trail: summary cards, filters, pagination, detail drawer with anchor status + block-explorer links, manual anchor retry
- **Forbidden** — 403 page
- **NotFound** — 404 page

## Development Progress

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Completed | Authentication & Authorization (JWT, RBAC, protected routes) |
| Phase 2 | ✅ Completed | User Management (CRUD, role assignment, status management) |
| Phase 3 | ✅ Completed | Dashboard & Analytics (KPI cards, charts, activities, notifications) |
| Phase 4 | ✅ Completed | Budget Allocation Management (CRUD, approval workflow, master data) |
| Phase 4.4 | ✅ Completed | Blockchain Integration (ledger anchors, verification, transaction history) |
| Phase 4.5 | ✅ Completed | Document Management (upload, versioning, hashing, on-chain anchoring, verify) |
| Phase 4.6 | ✅ Completed | Blockchain Integrity & Audit Trail (persisted audit logs, `AuditLedger`, unified history, timeline, external-file verification, hardening) |
| Phase 5 | ⏳ Planned | Expense Monitoring & Tracking |
| Phase 6 | ⏳ Planned | Smart Contract Budget Execution & Monitoring |
| Phase 7 | ⏳ Planned | Reports & Analytics Dashboard |
| Phase 8 | ⏳ Planned | System Optimization & Performance |
| Phase 9 | ⏳ Planned | Security Enhancements |
| Phase 10 | ⏳ Planned | User Experience Refinements |
| Phase 11 | ⏳ Planned | Documentation & Training |
| Phase 12 | ⏳ Planned | Finalization & Defense Preparation |

## Current Focus (Phase 4.6 → Phase 5)

Phases 4.4–4.6 are complete. **Phase 4.6 (Blockchain Integrity & Audit Trail)** shipped:

- **Persisted, append-only audit trail** — every audit event lands in `audit_logs` (sanitized, SHA-256 `eventHash`, denormalized actor snapshots) via a fire-and-forget sink in `auditLogger`; no update/delete path exists.
- **`AuditLedger` smart contract** — audit/status-change event hashes anchored on-chain fail-soft (Pending → Confirmed/Failed, retryable via scheduler + manual endpoint).
- **Unified blockchain history** — allocations, document anchors, and audit events merged into one type-aware ledger view with a transaction detail drawer and explorer links.
- **Financial activity timeline** on the dashboard (allocations, documents, audits, anchors).
- **External-file verification** — verify any uploaded file against stored hashes + ledger without storing it; never reports "verified" when the node is unreachable.
- **Hardening** — audit-coverage audit (fixed `AUTH_REFRESH_TOKEN` success / `AUTH_LOGOUT` failure gaps), fixed an audit-anchor feedback loop, append-only + sanitizer regression tests, full backend + frontend suites green.

Next up is **Phase 5 — Expense Monitoring & Tracking**.

Completed in Phases 4.4–4.6 (available now):
- **Blockchain ledger integration**
  - SHA-256 content hashing of allocation records on approval
  - EVM smart contract (`BudgetLedger`) anchors with status monitoring
  - Verification & integrity checks (off-chain hash vs. on-chain anchor)
  - Blockchain Ledger page (status summary, unified history, transaction detail drawer, verify/retry actions)
- **Document management (Phase 4.5)**
  - Upload / replace / versioning with streaming SHA-256 hashing
  - On-chain anchoring of document hashes + stored-document verification
  - External-file verification page
- **Audit trail (Phase 4.6)**
  - `audit_logs` table, query API, Audit Logs page, on-chain `AuditLedger` anchoring, retry

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

### ✅ Phase 4 – Budget Allocation Management (Completed)
- Budget allocation CRUD operations
- Allocation approval workflow
- Master data CRUD (Fiscal Years, Departments, Fund Sources, Categories, Programs)
- Multi-year budget planning
- Budget utilization tracking
- Statistics dashboard with filters

### ✅ Phase 4.4 – Blockchain Integration (Completed)
- `BudgetLedger` EVM smart contract (Hardhat, Solidity, ethers v6)
- SHA-256 content hashing for allocation records (anchored on approval)
- Backend ledger service with fail-soft anchoring (Pending/Confirmed/Failed)
- Blockchain repository (`BlockchainRecord` model + migration)
- Ledger status, transaction history, allocation verification, and retry endpoints
- Frontend Blockchain Ledger page + per-allocation verification card
- Role-based access: Auditor read-only; Admin/Treasurer/BudgetOfficer may retry

### ✅ Phase 4.5 – Document Management (Completed)
- Upload / replace / versioning with server-side streaming SHA-256 hashing
- `ManagedDocument`, `DocumentVersion`, `DocumentActivity` models + migrations
- On-chain anchoring of document hashes with fail-soft retry (scheduler + manual)
- Stored-document integrity verification (recomputed hash vs. on-chain anchor)
- Download / preview, version history, activity timeline, archive (soft-delete)

### ✅ Phase 4.6 – Blockchain Integrity & Audit Trail (Completed)
- `audit_logs` table (append-only, sanitized `details`, SHA-256 `eventHash`, actor snapshots) + persistence sink wired into `auditLogger`
- `AuditLedger` EVM smart contract + backend anchoring service (fail-soft, retryable)
- Audit Logs API (`GET /`, `/summary`, `/:id`, `POST /:id/retry`) + Audit Logs page
- Unified blockchain history (`GET /blockchain/history`, `GET /blockchain/transactions/:id`) + type-aware ledger view and detail drawer
- Financial activity timeline (`GET /dashboard/timeline`) on the dashboard
- External-file verification (`POST /verification/documents`) without storing the file
- Hardening: coverage audit vs `AUDIT_ACTIONS`, audit-anchor feedback-loop fix, append-only + sanitizer regression tests, docs

### ⏳ Phase 5 – Expense Monitoring & Tracking
- Expense submission and approval workflow
- Expense categorization and tagging
- Receipt attachment and management
- Expense policy enforcement
- Real-time expense tracking dashboards
- Budget utilization tracking
- Expense history and reporting

### ⏳ Phase 6 – Smart Contract Budget Execution & Monitoring
- Immutable audit trail for all financial transactions
- ✅ Persisted audit trail (`audit_logs` table + query API + on-chain anchoring via `AuditLedger`)
- ✅ Unified blockchain history (allocations + documents + audit events in one type-aware ledger view, with a transaction detail drawer)
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