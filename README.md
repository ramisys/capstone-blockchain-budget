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
├── .gitignore
└── README.md
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

## Phase 1: Authentication & Authorization (COMPLETE)

### Implemented Features

**Frontend Pages**
- **Login** — Email/password with Zod validation, password visibility toggle, remember me, loading state, server error display
- **Dashboard** — Welcome section with time-based greeting, role badge, quick-access cards (placeholders), recent activity feed, system status panel
- **Profile** — User account details with role and status badges
- **403 Forbidden** — Access denied page with navigation options
- **404 Not Found** — Page not found with navigation options

**Authentication Flow**
- JWT-based authentication with Bearer token
- Axios interceptor for automatic token attachment
- 401 response handling with automatic redirect to login
- Persistent login via localStorage
- AuthContext for global auth state
- Protected route guards with role-based access control
- Public route guards (redirect authenticated users away from login)

**Design System**
- Navy (#1B3A5C) primary + Gold (#D4A843) accent palette
- Inter font family
- CSS custom properties for consistent spacing, typography, colors
- Custom-styled Bootstrap 5 components
- Responsive layout (desktop sidebar, mobile overlay navigation)
- Accessible (ARIA labels, semantic HTML, keyboard navigation, focus indicators)

**Backend API Endpoints**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Authenticate user | Public (rate limited) |
| POST | `/api/auth/logout` | Invalidate session | Required |
| GET | `/api/auth/me` | Get current user profile | Required |
| GET | `/health` | Server health check | Public |

**User Roles**

| Role | Description |
|------|-------------|
| Administrator | Full system access |
| Treasurer | Financial management |
| BudgetOfficer | Budget allocation |
| Auditor | Read-only audit access |

## Phase 2: User Management (IMPLEMENTED)

### New Features

**Backend APIs**
- **GET /api/users** - List all users with pagination, filtering, and search (Admin only)
- **GET /api/users/:id** - Get user by ID (Admin only)
- **POST /api/users** - Create new user (Admin only)
- **PUT /api/users/:id** - Update user (Admin only)
- **DELETE /api/users/:id** - Delete user (Admin only)
- **PATCH /api/users/:id/role** - Change user role (Admin only)
- **PATCH /api/users/:id/status** - Change user status (Admin only)

**Frontend Components**
- **User List** - Paginated table view with search, filtering, and bulk actions
- **User Form** - Create/edit form with validation (React Hook Form + Zod)
- **User Detail** - View detailed user information
- **Role-based Access Control** - Only administrators can access user management features

**Database Updates**
- Enhanced User model with proper indexing for query performance
- Added role and status fields with enum constraints
- Implemented proper validation for user data

### API Documentation

For detailed API specifications, refer to [docs/API_DOCUMENTATION.md](file:///d:/Ramisys%20files/Projects/capstone/docs/API_DOCUMENTATION.md).

## Design Principles

This application follows seven design principles:

1. **No Generic Layouts** — Every page is intentionally designed around government budget monitoring workflows
2. **Consistent Visual Language** — Unified spacing, typography, colors, and components
3. **Minimal Visual Effects** — Clean and professional; no unnecessary gradients, glows, or animations
4. **Meaningful Content** — Every heading, label, and description serves a purpose
5. **Strong UX** — Predictable navigation, clear validation, keyboard accessible
6. **Consistent Branding** — Navy (#1B3A5C) + Gold (#D4A843) palette, Inter font family, cohesive identity
7. **Strong Visual Hierarchy** — Typography, spacing, and contrast guide the user's eye

## Security

- JWT-based authentication with configurable expiry
- Password hashing with bcrypt (salt rounds: 10)
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)
- Helmet security headers
- CORS configuration
- Request validation with Zod
- Role-based access control middleware
- Input sanitization and validation

## Future Phases

| Phase | Features |
|-------|----------|
| Phase 3 | Budget Allocation Module |
| Phase 4 | Expense Monitoring & Tracking |
| Phase 5 | Audit Logs & Blockchain Integration |
| Phase 6 | Reports & Analytics Dashboard |
| Phase 7 | Deployment & Optimization |

## Project Structure

### Backend (`apps/backend`)
```
├── config/          # App configuration (env, cors, helmet)
├── constants/       # Shared constants (roles, status, http codes)
├── controllers/     # Route handlers
├── errors/          # Custom error classes
├── middleware/      # Express middleware (auth, rbac, rate limiter, error handler)
├── models/          # Prisma client singleton
├── prisma/          # Schema, migrations, seed
├── repositories/    # Data access layer
├── routes/          # Express route definitions
├── services/        # Business logic layer
├── tests/           # Test suite
├── utils/           # Utilities (jwt, password, response formatting)
└── validators/      # Zod validation schemas
```

### Frontend (`apps/frontend`)
```
├── src/
│   ├── api/                 # Axios client and API service modules
│   ├── assets/              # Static assets (logo)
│   ├── components/
│   │   ├── guards/          # ProtectedRoute, PublicRoute
│   │   ├── layout/          # DashboardLayout, Sidebar, TopNav
│   │   ├── ui/              # Button, Input, Card, Spinner, Alert, Badge
│   │   └── user/            # User management components (UserList, UserForm, UserDetail)
│   ├── constants/           # App-wide constants (roles)
│   ├── context/             # AuthContext (React Context API)
│   ├── hooks/               # useAuth custom hook
│   ├── pages/               # Login, Dashboard, Profile, Forbidden, NotFound
│   └── routes/              # AppRoutes with route configuration
├── index.html
└── vite.config.js           # Vite config with API proxy
```