# Blockchain-Based Budget Allocation and Expense Monitoring System

Production-ready monorepo workspace containing the backend services, frontend application, smart contracts, and shared packages.

## Monorepo Architecture

```
capstone/
├── apps/
│   ├── backend/     # Express.js REST API server & Prisma ORM
│   ├── frontend/    # Frontend web application (placeholder)
│   └── contracts/   # Blockchain smart contracts (placeholder)
├── packages/
│   └── shared/      # Shared utilities and constants
├── docs/            # Project documentation
├── package.json     # Root npm Workspaces configuration
├── .gitignore
└── README.md
```

## Workspaces & Scripts

### Backend (`apps/backend`)
Run commands from the root directory:

```bash
# Run backend in development mode
npm run dev:backend

# Run backend production server
npm run backend

# Run backend test suite
npm run test:backend
```

Or execute directly from `apps/backend`:

```bash
cd apps/backend
npm run dev
npm run start
npm run test
```
