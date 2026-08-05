# BudgetChain — Blockchain-Based Budget Allocation & Expense Monitoring System

> **BudgetChain** is a public sector financial management monorepo designed for Local Government Units (LGUs). It enables LGU financial officers and staff to plan budget allocations, execute multi-tier approval workflows, manage versioned financial documents, and anchor tamper-evident cryptographic evidence (record digests and security audit events) on an EVM blockchain ledger.

---

## 1. Project Overview

BudgetChain addresses transparency, accountability, and integrity challenges in local government financial management by combining a relational database (MySQL + Prisma ORM) for fast querying with immutable smart contracts (`BudgetLedger.sol` and `AuditLedger.sol`) for tamper verification.

Key design principles:
- **Strict Role-Based Access Control (RBAC):** Institutional separation of duties across Administrator, Treasurer, Budget Officer, and Auditor roles.
- **Sequential Code & Budget Ceiling Protection:** Automatic sequential code generation (`BA-YYYY-XXX`), 5-tuple uniqueness enforcement, and ceiling validation against total fiscal year limits.
- **Fail-Soft Blockchain Anchoring:** Financial allocations, document hashes, and audit events are anchored on EVM contracts asynchronously; RPC node hiccups or downtime leave database records in `Pending`/`Failed` state without blocking HTTP requests.
- **Zero-Storage External File Verification:** Uploaded files can be verified against stored database digests and on-chain block receipts without persisting file bytes to disk.

---

## 2. Key Features

- **Authentication & Security:** Dual-token JWT authentication (15m access token, 7d refresh token with DB rotation), bcrypt password hashing (`saltRounds = 10`), rate limiting, security headers (`helmet`), and CORS protection.
- **User Identity Management:** Admin-only account administration (`GET`, `POST`, `PUT`, `DELETE /api/users`), role/status management, last-admin protection, and self-deletion block.
- **Master Data & Allocation Engine:** Full CRUD for Fiscal Years, Departments, Fund Sources, Budget Categories, and Budget Programs. Multi-tier approval workflow (`Draft` → `PendingApproval` → `Approved` / `Rejected`) with self-review prevention (`assertApprover`).
- **Document Management & Versioning:** Multipart uploads, `sniffMimeType` magic-byte signature inspection (detecting true PDF, PNG, JPEG, WEBP headers), single-pass SHA-256 stream hashing, version control (up to 50 versions), and replacement duplicate rejection.
- **Audit Logging & Activity Timeline:** Real-time structured console logging + fire-and-forget DB persistence (`audit_logs`), sensitive parameter redaction (`sanitizeData` replacing secrets with `[REDACTED]`), canonical event hashing (`eventHash`), and a 4-source activity timeline union.
- **System Notifications:** Dynamic read-time notification alert synthesis (`GET /api/dashboard/notifications`) monitoring risk factors (inactive accounts, pending approvals, system health) with zero DB storage overhead, coupled with a client-side floating toast portal.

---

## 3. Technology Stack

- **Backend:** Node.js (ESM), Express 4, Prisma ORM, MySQL, Ethers v6, Zod, bcrypt, Multer, Helmet, Morgan, Express Rate Limit.
- **Frontend:** React 19, Vite, TypeScript, TanStack Query, React Router DOM v7, Axios, Tailwind CSS v4, Bootstrap 5, Radix UI, Recharts, Lucide Icons.
- **Smart Contracts:** Solidity 0.8.24, Hardhat, Chai, Ethers v6.

For full dependency versions and roles, see [`docs/TECH_STACK.md`](./docs/TECH_STACK.md).

---

## 4. Installation & Setup

### Prerequisites
- Node.js 18+
- MySQL Server (running on `localhost:3306`)
- npm workspaces enabled

### Quick Start

1. **Install Monorepo Dependencies:**
   ```bash
   npm install
   ```
2. **Configure Backend Environment Variables:**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```
   *Edit `apps/backend/.env` to set `JWT_SECRET` (random string $\ge$ 32 chars) and `DATABASE_URL`.*

3. **Initialize Database & Seed Accounts:**
   ```bash
   cd apps/backend
   npx prisma migrate dev
   npm run seed
   ```

### Default Seed Credentials

| Institutional Role | Email Address | Password |
|--------------------|---------------|----------|
| **Administrator** | `admin@university.edu` | `AdminPassword123!` |
| **Budget Officer** | `budgetofficer@university.edu` | `BudgetOfficer123!` |
| **Treasurer** | `treasurer@university.edu` | `Treasurer123!` |
| **Auditor** | `auditor@university.edu` | `Auditor123!` |

---

## 5. Usage Commands

### Development Servers

Run from repository root:

```bash
npm run dev:backend      # Express server on :5000 (watch mode)
npm run dev:frontend     # Vite dev server on :3000 (proxies /api -> :5000)
```

### Automated Testing

```bash
npm run test:backend     # Backend unit tests (38 test files, node assert)
npm run test:frontend    # Frontend UI tests (22 test files / 174 tests, Vitest)
npm run test             # Run backend then frontend test suites
```

### Local Hardhat Blockchain Node (Optional)

```bash
npm run blockchain:node     # Start local EVM node (:8545)
npm run blockchain:compile  # Compile BudgetLedger & AuditLedger contracts
npm run blockchain:deploy   # Deploy contracts to local node
```

For manual testing workflows and deployment commands, see [`docs/TESTING.md`](./docs/TESTING.md).

---

## 6. Comprehensive Documentation Index

All detailed specifications, architecture diagrams, and API references are located in [`docs/`](./docs/):

| Documentation Document | Primary Concern & Scope |
|------------------------|-------------------------|
| 📍 **[`docs/INDEX.md`](./docs/INDEX.md)** | **Central Navigation Hub**, reading order, & source-of-truth hierarchy. |
| 📋 **[`docs/PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md)** | High-level purpose, core features, user roles, & system workflows. |
| 🏗️ **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** | End-to-end request pipeline, repository topology, & data flow. |
| 📁 **[`docs/FILE_STRUCTURE.md`](./docs/FILE_STRUCTURE.md)** | Complete directory map, file locations, & naming conventions. |
| 🛠️ **[`docs/TECH_STACK.md`](./docs/TECH_STACK.md)** | Full dependency inventory, library roles, & version specifications. |
| 🔐 **[`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md)** | Dual-token JWT session lifecycle, password security, & middleware. |
| 🛡️ **[`docs/AUTHORIZATION.md`](./docs/AUTHORIZATION.md)** | System roles, 86-endpoint RBAC matrix, & route protection guards. |
| 👤 **[`docs/USER_MANAGEMENT.md`](./docs/USER_MANAGEMENT.md)** | Admin user administration, safety guards, & account lifecycle. |
| 💰 **[`docs/BUDGET_ALLOCATION.md`](./docs/BUDGET_ALLOCATION.md)** | Sequential code engine, 5-tuple uniqueness, & approval workflow. |
| 📑 **[`docs/DOCUMENT_MANAGEMENT.md`](./docs/DOCUMENT_MANAGEMENT.md)** | Magic-byte inspection, stream hashing, & version control. |
| 📊 **[`docs/REPORTS.md`](./docs/REPORTS.md)** | System metrics aggregation & 4-source activity timeline synthesis. |
| 📜 **[`docs/AUDIT_LOGS.md`](./docs/AUDIT_LOGS.md)** | Dual-destination logging, parameter redaction, & `AuditLedger` anchors. |
| 🔔 **[`docs/NOTIFICATIONS.md`](./docs/NOTIFICATIONS.md)** | Dynamic alert synthesis, zero-storage model, & toast portal. |
| ⚙️ **[`docs/SERVICES.md`](./docs/SERVICES.md)** | Service-layer responsibilities & module interaction sequence flows. |
| 🔒 **[`docs/HASHING.md`](./docs/HASHING.md)** | SHA-256 canonical digests, stream hashing, & zero-storage verification. |
| 🔎 **[`docs/DOCUMENT_VERIFICATION.md`](./docs/DOCUMENT_VERIFICATION.md)** | Internal version integrity & zero-storage file verification. |
| ⚡ **[`docs/TRANSACTIONS.md`](./docs/TRANSACTIONS.md)** | Ethers v6 submission, fail-soft errors, & background retry scheduler. |
| 🌐 **[`docs/API.md`](./docs/API.md)** | Complete REST API reference across 86 endpoints & validation schemas. |
| 🗄️ **[`docs/DATABASE.md`](./docs/DATABASE.md)** | Prisma ER model, 14 tables, 10 enums, indexes, & migrations. |
| ⛓️ **[`docs/SMART_CONTRACTS.md`](./docs/SMART_CONTRACTS.md)** | Solidity `BudgetLedger` & `AuditLedger` ABIs, functions, & events. |
| 🔗 **[`docs/BLOCKCHAIN.md`](./docs/BLOCKCHAIN.md)** | On-chain anchoring, zero-storage verification, & ledger history. |
| 🧪 **[`docs/TESTING.md`](./docs/TESTING.md)** | Multi-tier test strategy, Node unit tests, Vitest, & Hardhat suites. |
| 🗓️ **[`docs/PHASES.md`](./docs/PHASES.md)** | Implementation timeline, 5 completed phases, & milestone matrix. |
| ⚠️ **[`docs/KNOWN_ISSUES.md`](./docs/KNOWN_ISSUES.md)** | System limitations, technical debt, & security considerations. |
| 🚀 **[`docs/FUTURE_WORK.md`](./docs/FUTURE_WORK.md)** | Planned Phase 6 Expense Tracking, S3 driver, & technical roadmap. |
| 📜 **[`docs/CHANGELOG.md`](./docs/CHANGELOG.md)** | Chronological version history, 8 database migrations, & API changes. |

---

## 7. Contributors

- **Capstone Project Team & Lead Developers** — Architecture, smart contracts, backend services, and frontend applications.
- **Antigravity AI Agent Pair Programmer (Google DeepMind)** — Technical documentation, code refactoring, test suite execution, and system verification.