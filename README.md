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
| Phase 3 | 🚧 In Progress |
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

The team is currently developing:
- Dashboard UI
- KPI cards
- Budget statistics
- Interactive charts
- Recent activity feed
- Financial summaries
- Backend API integration
- Responsive dashboard

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

### 🚧 Phase 3 – Dashboard & Analytics (Current Phase)
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
- Budget categories
- Fiscal year management
- Allocation tracking
- Validation rules

### ⏳ Phase 5 – Expense Monitoring
Planned Features:
- Expense recording
- Expense approval
- Expense categorization
- Budget utilization tracking
- Expense history
- Search and filtering

### ⏳ Phase 6 – Blockchain Integration
Planned Features:
- Smart contract integration
- Blockchain transaction recording
- Immutable audit trail
- Transaction verification
- Wallet connectivity
- Blockchain explorer integration

### ⏳ Phase 7 – Reports & Audit Logs
Planned Features:
- Financial reports
- Budget reports
- Expense reports
- Blockchain transaction history
- Audit logs
- PDF/Excel export

### ⏳ Phase 8 – Notifications & Workflow
Planned Features:
- System notifications
- Approval notifications
- Budget alerts
- Email notifications
- Workflow management
- Activity tracking

### ⏳ Phase 9 – Security & Access Control
Planned Features:
- Enhanced RBAC
- Security hardening
- API protection
- Audit security
- Session management
- Access monitoring

### ⏳ Phase 10 – Testing & Optimization
Planned Features:
- Unit testing
- Integration testing
- Performance optimization
- Security testing
- Bug fixing
- Code refactoring

### ⏳ Phase 11 – Deployment & Documentation
Planned Features:
- Production deployment
- Environment configuration
- User manual
- Technical documentation
- API documentation
- Installation guide

### ⏳ Phase 12 – Finalization & Defense Preparation
Planned Features:
- Final system review
- Final testing
- Documentation completion
- Presentation preparation
- Defense checklist
- Production-ready release

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

## AI Instructions for Claude Code

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

## General Rules

### File Organization
- Keep related files together (e.g., component with its styles and tests)
- Group by feature, not by type (when applicable)

### Commit Messages
- Use conventional commits (feat:, fix:, docs:, etc.)
- Reference issues when applicable
- Keep messages concise but descriptive

### Branch Naming
- Use `feature/`, `bugfix/`, `docs/` prefixes
- Include ticket number if applicable

### Code Reviews
- Self-review before requesting review
- Focus on correctness, clarity, and adherence to standards

### Error Handling
- Never leave empty catch blocks
- Provide meaningful error messages to users (without leaking sensitive info)

### Security
- Validate all inputs
- Use environment variables for secrets
- Implement proper CORS policies
- Use helmet and rate limiting as configured

### Performance
- Avoid unnecessary re-renders in React
- Optimize database queries
- Consider lazy loading for non-critical resources

## Future Development Roadmap

(See Development Roadmap section above for detailed phase-by-feature breakdown)