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
- **Bootstrap 5** — CSS framework (custom-styled)
- **React Hook Form** — Form state management
- **Zod** — Schema validation
- **Context API** — Authentication state

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

## Development Progress

| Phase | Status |
|-------|--------|
| Phase 1 | ✅ Completed |
| Phase 2 | ✅ Completed |
| Phase 3 | ✅ Completed |
| Phase 4 | ⏳ Planned |
| Phase 5 | ⏳ Planned |
| Phase 6 | ⏳ Planned |
| Phase 7 | ⏳ Planned |
| Phase 8 | ⏳ Planned |
| Phase 9 | ⏳ Planned |
| Phase 10 | ⏳ Planned |
| Phase 11 | ⏳ Planned |
| Phase 12 | ⏳ Planned |

## Current Focus

The team is currently planning:
- Budget allocation CRUD
- Approval workflow for budget allocations
- Budget categories and departments
- Multi-year budget planning

## Development Roadmap

### ✅ Phase 1 – Project Foundation (Completed)
Features:
- Project setup
- System architecture
- Authentication & authorization
- Database schema
- Initial UI layout
- Routing and navigation

### ✅ Phase 2 – User Management System (Completed)
Features:
- User CRUD operations
- Role-based access control
- User validation
- Search and filtering
- User profile/details
- Permission management

### ✅ Phase 3 – Dashboard & Analytics (Completed)
Features:
- Dashboard layout
- KPI/Summary cards
- Budget statistics
- Interactive charts
- Recent activities
- Financial summaries
- Backend API integration
- Responsive dashboard

### ⏳ Phase 4 – Budget Allocation Management
Planned Features:
- Budget allocation CRUD
- Allocation approval workflow
- Budget categories and departments
- Multi-year budget planning

### ⏳ Phase 5 – Expense Monitoring & Tracking
Planned Features:
- Expense submission and approval workflow
- Expense categorization and tagging
- Receipt attachment and management
- Expense policy enforcement
- Real-time expense tracking dashboards

### ⏳ Phase 6 – Audit Logs & Blockchain Integration
Planned Features:
- Immutable audit trail for all financial transactions
- Blockchain-based transaction verification
- Smart contract integration for budget execution
- Access logs and user activity tracking
- Compliance reporting tools

### ⏳ Phase 7 – Reports & Analytics Dashboard
Planned Features:
- Financial reporting tools (budget vs. actual)
- Spending trend analysis and forecasting
- Custom report generation
- Data export capabilities (CSV, PDF)
- Interactive data visualizations

### ⏳ Phase 8 – System Optimization & Performance
Planned Features:
- Database query optimization
- API response caching
- Frontend performance improvements
- Load testing and stress testing

### ⏳ Phase 9 – Security Enhancements
Planned Features:
- Advanced security testing
- Penetration testing
- Security monitoring and alerting
- Data encryption at rest and in transit

### ⏳ Phase 10 – User Experience Refinements
Planned Features:
- User feedback integration
- UI/UX improvements based on usability testing
- Accessibility enhancements (WCAG compliance)
- Multi-language support

### ⏳ Phase 11 – Documentation & Training
Planned Features:
- Comprehensive user manuals
- Technical documentation
- Training materials and video tutorials
- FAQ and troubleshooting guides

### ⏳ Phase 12 – Finalization & Defense Preparation
Planned Features:
- Final system testing and bug fixing
- Preparation for capstone defense
- Final presentation and demo
- Project documentation and code handover

## Summary of Improvements

This README provides a clear overview of the project's technology stack, setup instructions, development progress, and detailed roadmap for all 12 phases of development.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>