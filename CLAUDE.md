# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Table of Contents

- [Project Overview](#project-overview)
- [Current Development Status](#current-development-status)
- [Technology Stack](#technology-stack)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [API Endpoints](#api-endpoints)
- [Testing Guide](#testing-guide)
- [Code Conventions](#code-conventions)
- [Design Principles](#design-principles)
- [Performance Guidelines](#performance-guidelines)
- [Deployment Notes](#deployment-notes)
- [Documentation Standards](#documentation-standards)
- [AI Instructions for Claude Code](#ai-instructions-for-claude-code)
- [General Rules](#general-rules)
- [Future Development Roadmap](#future-development-roadmap)

## Project Overview

This is a blockchain-based budget allocation and expense monitoring system built as a monorepo using npm workspaces. It's a university capstone project designed as a real government financial management platform.

## Current Development Status

**Phase 1 Complete**: Authentication &nbsp;(JWT-based auth, RBAC, login/logout/profile pages, protected routes).

**Next Phase**: Phase 2 - User Management (CRUD operations for users, role assignment, status management).

## Technology Stack

### Frontend (apps/frontend)

- React 19 + Vite
- React Router DOM for client-side routing
- Axios HTTP client with JWT interceptors
- Bootstrap 5 (custom-styled with CSS variables)
- React Hook Form + Zod for form validation
- React Context API for authentication state

### Backend (apps/backend)

- Node.js runtime
- Express.js web framework
- Prisma ORM with MySQL database
- JWT-based authentication with bcrypt password hashing
- Helmet, CORS, express-rate-limit for security
- Zod for request validation
- Role-Based Access Control (RBAC) with roles: Administrator, Treasurer, BudgetOfficer, Auditor

### Shared (packages/shared)

- Shared utilities and constants

### Smart Contracts (apps/contracts)

- Placeholder for blockchain integration (future phases)

## Development Setup

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

### Environment Variables (apps/backend/.env)

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
# From apps/backend directory
npx prisma generate
npx prisma migrate dev
npm run seed  # Creates default admin account
```

Default seed credentials:

- Email: `admin@university.edu`
- Password: `AdminPassword123!`
- Role: `Administrator`

## Project Structure

```
capstone/
├── apps/
│   ├── backend/          # Express.js REST API server & Prisma ORM
│   │   ├── config/       # App configuration (env, cors, helmet)
│   │   ├── constants/    # Shared constants (roles, status, http codes)
│   │   ├── controllers/  # Route handlers
│   │   ├── errors/       # Custom error classes
│   │   ├── middleware/   # Express middleware (auth, rbac, rate limiter, error handler)
│   │   ├── models/       # Prisma client singleton
│   │   ├── prisma/       # Schema, migrations, seed
│   │   ├── repositories/ # Data access layer
│   │   ├── routes/       # Express route definitions
│   │   ├── services/     # Business logic layer
│   │   ├── tests/        # Test suite (testAuthLogic.js, testRateLimiter.js)
│   │   ├── utils/        # Utilities (jwt, password, response formatting)
│   │   └── validators/   # Zod validation schemas
│   │
│   ├── frontend/         # React 19 + Vite frontend application
│   │   ├── src/
│   │   │   ├── api/                # Axios client and API service modules
│   │   │   ├── assets/             # Static assets (logo)
│   │   │   ├── components/
│   │   │   │   ├── guards/         # ProtectedRoute, PublicRoute
│   │   │   │   ├── layout/         # DashboardLayout, Sidebar, TopNav
│   │   │   │   └── ui/             # Button, Input, Card, Spinner, Alert, Badge
│   │   │   ├── constants/          # App-wide constants (roles)
│   │   │   ├── context/            # AuthContext (React Context API)
│   │   │   ├── hooks/              # useAuth custom hook
│   │   │   ├── pages/              # Login, Dashboard, Profile, Forbidden, NotFound
│   │   │   └── routes/             # AppRoutes with route configuration
│   │   ├── index.html
│   │   └── vite.config.js          # Vite config with API proxy
│   │
│   └── contracts/            # Blockchain smart contracts (placeholder)
├── packages/
│   └── shared/               # Shared utilities and constants
│       ├── constants/
│       └── utils/
├── docs/                     # Project documentation
├── package.json              # Root npm Workspaces configuration
└── .gitignore
```

## Architecture Overview

### Backend

- **Clean Architecture**: Separation of concerns with distinct layers:
  - Controllers: Handle HTTP requests and responses
  - Services: Business logic layer
  - Repositories: Data access layer using Prisma
  - Middleware: Authentication, RBAC, error handling, security
  - Utils: JWT handling, password hashing, response formatting
  - Validators: Zod schemas for request validation
- **Authentication**: Stateless JWT with automatic Axios interception (tokens stored in localStorage)
- **Authorization**: Role-Based Access Control middleware protecting routes
- **Database**: Prisma ORM with MySQL, migrations managed via Prisma Migrate
- **Security**: Helmet, CORS, rate limiting, input validation with Zod

### Frontend

- **State Management**: React Context API for authentication state
- **Routing**: React Router DOM with protected/public route guards
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Bootstrap 5 with custom CSS variables for navy/gold theme (#1B3A5C primary, #D4A843 accent)
- **API Communication**: Axios instance with automatic JWT token injection
- **Components**: Reusable UI components (Button, Input, Card, Spinner, Alert, Badge)
- **Layout**: Responsive design with collapsible sidebar (desktop) / overlay (mobile)

## API Endpoints

Authentication endpoints (all under `/api/auth`):

- `POST /login` - Authenticate user & get JWT token (public, rate-limited)
- `POST /logout` - Invalidate session (requires auth)
- `GET /me` - Get current user profile (requires auth)
- `GET /health` - Server health check (public)

## Testing Guide

### Backend Tests

Located in `apps/backend/tests/`:

- `testAuthLogic.js`: Authentication logic tests
- `testRateLimiter.js`: Rate limiting middleware tests

Run backend tests:

```bash
npm run test:backend   # From root
# or
cd apps/backend && npm test
```

### Frontend Testing

Frontend testing setup is planned for future phases (currently no test suite).

### Running Tests in Development

- Backend: `npm run dev:backend` (starts server in watch mode)
- Frontend: `npm run dev:frontend` (starts Vite dev server)

## Code Conventions

- **ES Modules**: Uses `import`/`export` syntax throughout
- **Error Handling**: Centralized error handling middleware prevents stack trace exposure
- **Validation**: Zod schemas for both frontend forms and backend request validation
- **Authentication**: JWT tokens stored in localStorage with automatic Axios interception
- **Styling**: CSS custom properties for theme colors, spacing, and typography
- **Component Organization**: Feature-based grouping in components directory
- **Naming**:
  - Components: PascalCase (e.g., `Button.jsx`)
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case
- **Comments**:
  - Use JSDoc for functions and components
  - TODO comments for future work
  - Avoid obvious comments

## Design Principles

1. **No Generic Layouts** - Each page designed around specific budget monitoring workflows
2. **Consistent Visual Language** - Unified spacing, typography, colors, components
3. **Minimal Visual Effects** - Clean, professional interface without unnecessary animations
4. **Meaningful Content** - Every element serves a purpose in the financial workflow context
5. **Strong UX** - Predictable navigation, clear validation, keyboard accessibility
6. **Consistent Branding** - Navy (#1B3A5C) + Gold (#D4A843) palette, Inter font family
7. **Strong Visual Hierarchy** - Typography, spacing, and contrast guide user attention

## Performance Guidelines

### Frontend

- **Code Splitting**: Vite automatically splits code by route
- **Lazy Loading**: Use `React.lazy()` for non-critical components
- **Image Optimization**: Optimize asset sizes in `public/` directory
- **Bundle Analysis**: Use `vite build --mode analyzer` to inspect bundle size
- **Memoization**: Use `useMemo` and `useCallback` for expensive computations
- **Virtual Scrolling**: For large lists (planned for Phase 4+)

### Backend

- **Database Optimization**:
  - Use Prisma's built-in connection pooling
  - Add database indexes for frequently queried fields
  - Select only required fields in queries
- **API Efficiency**:
  - Implement pagination for list endpoints
  - Use caching for static data (e.g., roles, permissions)
  - Enable gzip compression via compression middleware
- **Caching Opportunities**:
  - Consider Redis for session caching in future phases
  - Cache API responses with appropriate TTL

## Deployment Notes

### Production Environment

- **Environment Variables**: Set `NODE_ENV=production`
- **Database**: Use managed MySQL service (AWS RDS, Google Cloud SQL, etc.)
- **Secrets Management**: Use environment variables or secret manager for `JWT_SECRET`
- **CORS**: Restrict `CORS_ORIGIN` to production domain
- **Rate Limits**: Adjust based on expected traffic
- **Helmet**: Review and adjust helmet configuration for production

### Build Process

#### Frontend

```bash
npm run build:frontend   # Creates optimized build in /dist
npm run preview          # Preview production build locally
```

#### Backend

- No build step required (uses Node.js directly)
- Ensure `npm run prisma:generate` is run in deployment pipeline
- Run migrations: `npx prisma migrate deploy`

### Deployment Checklist

1. [ ]  Set production environment variables
2. [ ]  Run database migrations
3. [ ]  Build frontend assets
4. [ ]  Start backend server (`npm run backend`)
5. [ ]  Serve frontend static files (via Nginx, CDN, or backend static middleware)
6. [ ]  Verify health check endpoint
7. [ ]  Test authentication flow
8. [ ]  Monitor logs for errors

## Documentation Standards

### README

- Keep updated with current setup instructions
- Include badges for build status, license, etc.
- Document major features and architecture decisions

### API Documentation

- Maintain `docs/API_DOCUMENTATION.md` with endpoint details
- Include request/response examples
- Document authentication requirements and error codes

### Code Comments

- Use JSDoc for public functions and components
- Explain non-obvious logic and business rules
- Avoid commenting obvious code

### AI Instructions for Claude Code

When working in this repository, please follow these guidelines:

1. **Understand First**: Always read existing code before making changes. Understand the pattern and conventions.
2. **Preserve Architecture**: Do not introduce new frameworks or architectural patterns without explicit permission.
3. **Reuse Existing Components**: Prefer extending existing components over creating new ones.
4. **Follow Conventions**: Match the existing code style, naming patterns, and file organization.
5. **Update Documentation**: When making significant changes, update relevant documentation (README, API docs, comments).
6. **Maintain Consistency**: Keep code production-ready; avoid temporary fixes or commented-out code.
7. **Respect Phase Boundaries**: Do not implement features from future phases unless specifically requested.
8. **Explain Major Changes**: Before implementing architectural changes, explain your approach and wait for confirmation.
9. **Security First**: Always consider security implications; follow existing validation and authentication patterns.
10. **Test Your Changes**: Ensure your changes don't break existing functionality; run relevant tests.

### General Rules

- **File Organization**:
  - Keep related files together (e.g., component with its styles and tests)
  - Group by feature, not by type (when applicable)
- **Commit Messages**:
  - Use conventional commits (feat:, fix:, docs:, etc.)
  - Reference issues when applicable
  - Keep messages concise but descriptive
- **Branch Naming**:
  - Use `feature/`, `bugfix/`, `docs/` prefixes
  - Include ticket number if applicable
- **Code Reviews**:
  - Self-review before requesting review
  - Focus on correctness, clarity, and adherence to standards
- **Error Handling**:
  - Never leave empty catch blocks
  - Provide meaningful error messages to users (without leaking sensitive info)
- **Security**:
  - Validate all inputs
  - Use environment variables for secrets
  - Implement proper CORS policies
  - Use helmet and rate limiting as configured
- **Performance**:
  - Avoid unnecessary re-renders in React
  - Optimize database queries
  - Consider lazy loading for non-critical resources

## Future Development Roadmap

### Phase 1: Authentication & Authorization (COMPLETE)

- User login/logout with JWT
- Role-Based Access Control (Admin, Treasurer, BudgetOfficer, Auditor)
- Protected routes and authentication context
- Input validation and security headers

### Phase 2: User Management

- CRUD operations for user profiles
- Role assignment and modification
- User status management (active/inactive/pending)
- Profile viewing and editing
- Administrator-only user management interface

### Phase 3: Budget Allocation

- Budget creation, editing, and deletion
- Department/budget category management
- Allocation workflows and approval processes
- Budget tracking vs. actual spending
- Multi-year budget planning

### Phase 4: Expense Monitoring & Tracking

- Expense submission and approval workflow
- Expense categorization and tagging
- Receipt attachment and management
- Expense policy enforcement
- Real-time expense tracking dashboards

### Phase 5: Audit Logs & Blockchain Integration

- Immutable audit trail for all financial transactions
- Blockchain-based transaction verification
- Smart contract integration for budget execution
- Access logs and user activity tracking
- Compliance reporting tools

### Phase 6: Reports & Analytics Dashboard

- Financial reporting tools (budget vs. actual)
- Spending trend analysis and forecasting
- Custom report generation
- Data export capabilities (CSV, PDF)
- Interactive data visualizations

### Phase 7: Deployment & Optimization

- Production deployment preparation
- Performance optimization and caching
- Security hardening and penetration testing
- Documentation and knowledge transfer
- Training materials and user guides

## Summary of Improvements

This updated CLAUDE.md provides:

1. Clear navigation with table of contents
2. Current development status and roadmap visibility
3. Consolidated technology stack and architecture overview
4. Improved development setup instructions
5. Detailed code conventions and design principles
6. Performance guidelines and deployment notes
7. Documentation standards and AI-specific instructions
8. Comprehensive future development roadmap
9. General repository rules for consistent maintenance
10. Removed redundancy while preserving all essential information
