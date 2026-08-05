# Technology Stack — BudgetChain Monorepo

> **Scope:** every technology, library, tool, and service used in the repository — with versions, roles, and source references.
> **Source of truth:** `package.json` files, config files, Prisma schema, Solidity pragmas, and the implementation itself. Versions are the semver ranges declared in `package.json` unless stated otherwise. Anything not determinable from code is marked *unknown*.

---

## 1. Overview

BudgetChain is an npm-workspaces monorepo with three active workspaces and one placeholder:

| Workspace | Stack | Module system |
|-----------|-------|---------------|
| `apps/backend` | Node.js + Express + Prisma + MySQL | ESM (`"type": "module"`) |
| `apps/frontend` | React + Vite + TypeScript | ESM (`"type": "module"`) |
| `apps/contracts` | Hardhat + Solidity | CommonJS |
| `packages/shared` | — | Placeholder (no code) |

---

## 2. Frontend Technologies

### 2.1 Core

| Technology | Version (declared) | Role | Source |
|---|---|---|---|
| **React** | `^19.0.0` | UI library (component model, virtual DOM) | `apps/frontend/package.json:28` |
| **React DOM** | `^19.0.0` | React renderer for the browser | `apps/frontend/package.json:29` |
| **TypeScript** | `^5.9.3` | Static type system (lenient: `strict: false`, `allowJs: true`) | `apps/frontend/package.json:45`, `tsconfig.json:18` |

### 2.2 Build tooling

| Technology | Version | Role | Source |
|---|---|---|---|
| **Vite** | `^6.0.0` | Dev server (`:3000`, `/api` proxy → `:5000`) + production bundler | `apps/frontend/package.json:46`, `vite.config.js` |
| **@vitejs/plugin-react** | `^4.3.0` | React Fast Refresh + JSX transform for Vite | `apps/frontend/package.json:43` |

### 2.3 Styling

| Technology | Version | Role | Source |
|---|---|---|---|
| **Tailwind CSS** | `^4.3.3` | Utility-first CSS (v4, used in newer components) | `apps/frontend/package.json:33` |
| **@tailwindcss/vite** | `^4.3.3` | Tailwind CSS v4 Vite plugin integration | `apps/frontend/package.json:22` |
| **Bootstrap** | `^5.3.0` | Legacy CSS classes (`form-control`, `card`, `.btn-*`) in older components | `apps/frontend/package.json:25`, `index.css:2` |
| **CSS custom properties** | — | Hand-written design-token theme (navy `#1B3A5C`, gold `#D4A843`) | `apps/frontend/src/index.css:5` |

### 2.4 Routing & state

| Technology | Version | Role | Source |
|---|---|---|---|
| **React Router DOM** | `^7.11.0` | Client-side routing, route guards (`ProtectedRoute`, `PublicRoute`) | `apps/frontend/package.json:31` |
| **@tanstack/react-query** | `^5.101.4` | Server-state management (queries, mutations, cache invalidation) | `apps/frontend/package.json:23` |
| **React Context** | (built-in) | Auth session state (`AuthContext.tsx`) | `apps/frontend/src/context/AuthContext.tsx` |

### 2.5 Forms & validation

| Technology | Version | Role | Source |
|---|---|---|---|
| **react-hook-form** | `^7.53.0` | Form state management | `apps/frontend/package.json:30` |
| **@hookform/resolvers** | `^3.9.0` | Schema resolver bridge (Yup/Zod → react-hook-form) | `apps/frontend/package.json:16` |
| **Yup** | `^1.4.0` | Schema validation (legacy forms) | `apps/frontend/package.json:34` |
| **Zod** | `^3.23.0` | Schema validation (newer forms) | `apps/frontend/package.json:35` |

### 2.6 UI primitives & icons

| Technology | Version | Role | Source |
|---|---|---|---|
| **@radix-ui/react-dialog** | `^1.1.23` | Accessible modal dialog primitive | `apps/frontend/package.json:18` |
| **@radix-ui/react-select** | `^2.3.7` | Accessible select/dropdown primitive | `apps/frontend/package.json:21` |
| **@radix-ui/react-dropdown-menu** | `^2.1.24` | Accessible dropdown menu primitive | `apps/frontend/package.json:19` |
| **@radix-ui/react-checkbox** | `^1.3.11` | Accessible checkbox primitive | `apps/frontend/package.json:17` |
| **@radix-ui/react-label** | `^2.1.15` | Accessible label primitive | `apps/frontend/package.json:20` |
| **Lucide React** | `^1.27.0` | Icon library (tree-shakeable SVG icons) | `apps/frontend/package.json:27` |

### 2.7 Data visualization

| Technology | Version | Role | Source |
|---|---|---|---|
| **Recharts** | `^3.10.1` | Charting library (dashboard stats, budget charts) | `apps/frontend/package.json:32` |

### 2.8 HTTP client

| Technology | Version | Role | Source |
|---|---|---|---|
| **Axios** | `^1.7.0` | HTTP client (`baseURL: /api`, JWT + single-flight token-refresh interceptors) | `apps/frontend/package.json:24`, `src/api/axios.ts` |

### 2.9 Utilities

| Technology | Version | Role | Source |
|---|---|---|---|
| **date-fns** | `^4.4.0` | Date formatting and manipulation | `apps/frontend/package.json:26` |

### 2.10 Testing

| Technology | Version | Role | Source |
|---|---|---|---|
| **Vitest** | `^4.1.10` | Test runner (jsdom environment) | `apps/frontend/package.json:47`, `vitest.config.ts` |
| **@testing-library/react** | `^16.3.2` | React component testing utilities | `apps/frontend/package.json:39` |
| **@testing-library/jest-dom** | `^7.0.0` | Custom DOM matchers for assertions | `apps/frontend/package.json:38` |
| **@testing-library/user-event** | `^14.6.1` | User interaction simulation | `apps/frontend/package.json:40` |
| **jsdom** | `^30.0.1` | Browser environment simulation for tests | `apps/frontend/package.json:44` |

### 2.11 Type definitions

| Package | Version | Source |
|---|---|---|
| **@types/react** | `^19.2.18` | `apps/frontend/package.json:41` |
| **@types/react-dom** | `^19.2.4` | `apps/frontend/package.json:42` |

---

## 3. Backend Technologies

### 3.1 Core

| Technology | Version | Role | Source |
|---|---|---|---|
| **Node.js** | *Not pinned* | JavaScript runtime (ESM, `"type": "module"`) | `apps/backend/package.json:6` |
| **Express** | `^4.19.2` | HTTP framework (REST API on `:5000`) | `apps/backend/package.json:37` |

### 3.2 Security & HTTP hardening

| Technology | Version | Role | Source |
|---|---|---|---|
| **Helmet** | `^7.1.0` | HTTP security headers (CSP disabled — API server) | `apps/backend/package.json:39`, `config/helmet.js` |
| **cors** | `^2.8.5` | Cross-Origin Resource Sharing middleware | `apps/backend/package.json:34`, `config/cors.js` |
| **express-rate-limit** | `^8.6.1` | Rate limiting (global, login, sensitive, upload tiers) | `apps/backend/package.json:38`, `middleware/rateLimiter.js` |

### 3.3 Validation

| Technology | Version | Role | Source |
|---|---|---|---|
| **Zod** | `^3.23.8` | Schema validation (request body/query/params) | `apps/backend/package.json:43`, `validators/*.js` |

### 3.4 Logging

| Technology | Version | Role | Source |
|---|---|---|---|
| **Morgan** | `^1.10.0` | HTTP request logging middleware | `apps/backend/package.json:41`, `middleware/requestLogger.js` |
| Structured audit logger | (custom) | `utils/auditLogger.js` — structured console output + auto-redaction | `apps/backend/utils/auditLogger.js` |

### 3.5 File uploads

| Technology | Version | Role | Source |
|---|---|---|---|
| **Multer** | `^2.2.0` | Multipart form-data parsing + file uploads | `apps/backend/package.json:42`, `middleware/uploadMiddleware.js` |
| `node:crypto` | (built-in) | SHA-256 hashing for document deduplication and content integrity | `apps/backend/utils/fileUtils.js`, `utils/hashUtils.js` |

### 3.6 Environment & configuration

| Technology | Version | Role | Source |
|---|---|---|---|
| **dotenv** | `^16.4.5` | `.env` file loading | `apps/backend/package.json:35`, `config/env.js` |

### 3.7 Testing

| Technology | Version | Role | Source |
|---|---|---|---|
| `node:assert/strict` | (built-in) | Assertion library (plain Node test scripts, no test runner) | `apps/backend/tests/*.test.js` |
| `node --watch` | (built-in) | Dev server with file watching | `apps/backend/package.json:9` |

---

## 4. Database

| Technology | Version | Role | Source |
|---|---|---|---|
| **MySQL** | *Not pinned in repo* | Relational database (production data store) | `prisma/schema.prisma:6` |
| **Prisma Client** | `^5.19.1` | Type-safe ORM / query builder | `apps/backend/package.json:32` |
| **Prisma CLI** | `^5.19.1` | Migration, schema management, Prisma Studio (dev dependency) | `apps/backend/package.json:46` |

### 4.1 Schema highlights

- **14 models**, **10 enums** — `apps/backend/prisma/schema.prisma`
- **8 append-only migrations** (init → master data → allocations → approval workflow → blockchain records → supersededAt → documents → audit logs)
- Money stored as `Decimal(14,2)`, converted to plain numbers at the API boundary
- UUID primary keys, `createdAt`/`updatedAt` timestamps, snake_case table names via `@@map`
- Seed script with 4 demo users — `apps/backend/prisma/seed.js`

---

## 5. Authentication & Authorization

| Technology | Version | Role | Source |
|---|---|---|---|
| **jsonwebtoken** | `^9.0.2` | JWT access token issuance and verification (sign/verify with HS256, issuer/audience claims) | `apps/backend/package.json:40`, `utils/jwt.js` |
| **bcryptjs** | `^2.4.3` | Password hashing (bcrypt) | `apps/backend/package.json:33`, `utils/password.js` |
| Custom refresh tokens | — | Opaque refresh tokens with rotation, revocation, and single-flight refresh on the frontend | `services/authService.js`, `repositories/refreshTokenRepository.js`, `src/api/axios.ts:45` |

### 5.1 Auth architecture

- **JWT access tokens**: default 15 min TTL, signed with `JWT_SECRET` (≥ 32 chars, fail-fast validation).
- **Refresh tokens**: default 7 days, stored in DB, rotated on use, revocable.
- **Per-request DB re-validation**: `authenticate` middleware re-loads the user from the database on every request — deleted/deactivated users lose access immediately.
- **RBAC**: 4 roles (`Administrator`, `Treasurer`, `BudgetOfficer`, `Auditor`) enforced by `authorize(...roles)` middleware.
- **Rate limiting**: login (5/15 min), global API (100/15 min), sensitive (10/1 h), uploads (20/15 min).
- **Frontend token storage**: `localStorage` (access + refresh tokens).

---

## 6. Blockchain & Smart Contracts

### 6.1 Smart contract tooling

| Technology | Version | Role | Source |
|---|---|---|---|
| **Hardhat** | `^2.22.17` | EVM development environment (compile, deploy, test, local node) | `apps/contracts/package.json:15` |
| **@nomicfoundation/hardhat-toolbox** | `^5.0.0` | Hardhat plugin bundle (ethers, Chai, coverage, gas reporter, etc.) | `apps/contracts/package.json:14` |
| **Solidity** | `^0.8.24` | Smart contract language (compiler version set in `hardhat.config.js:6`) | `hardhat.config.js:6`, contract pragmas |

### 6.2 Contracts

| Contract | File | Purpose |
|---|---|---|
| **BudgetLedger** | `contracts/BudgetLedger.sol` | Immutable registry mapping `contentHash → Record` (anchoredBy, anchoredAt, blockNumber); `record`, `verify`, `getRecord`, `recordCount`; reverts `NotOwner` / `HashAlreadyRecorded` |
| **AuditLedger** | `contracts/AuditLedger.sol` | Immutable registry mapping `eventHash → AuditEvent` with per-category counters; `recordEvent`, `verifyEvent`, `getAuditEvent`, `eventCount`, `totalEvents`; reverts `NotOwner` / `InvalidCategory` / `EventAlreadyRecorded` |

### 6.3 Backend ↔ blockchain bridge

| Technology | Version | Role | Source |
|---|---|---|---|
| **ethers.js** | `^6.17.0` | EVM interaction library (`JsonRpcProvider`, `Wallet`, `Contract`) | `apps/backend/package.json:36`, `config/blockchain.js` |
| Custom `BlockchainProvider` | — | Single adapter: lazily builds provider/wallet/contracts, caches connections, exports `record`/`verify`/`auditRecord`/`auditVerify` | `apps/backend/config/blockchain.js` |
| Static ABI files | — | `config/blockchainAbi.js` mirrors contract ABIs (smoke script verifies parity) | `apps/backend/config/blockchainAbi.js` |

### 6.4 EVM network

| Setting | Value | Source |
|---|---|---|
| Network | `localhost` (`http://127.0.0.1:8545`) | `hardhat.config.js:17`, `.env.example:32` |
| Chain ID | `31337` (Hardhat default) | `.env.example:34` |
| Solc optimizer | Enabled, 200 runs | `hardhat.config.js:8` |

> **Note:** No mainnet/testnet deployment config exists in the repo. Production EVM topology is *unknown*.

---

## 7. Build Tools & Configuration

| Tool | Version | Role | Source |
|---|---|---|---|
| **npm** | *Not pinned* | Package manager + workspace orchestration | `package.json:4` (workspaces declaration) |
| **npm workspaces** | — | Monorepo workspace management (4 workspaces) | `package.json:4` |
| **Vite** | `^6.0.0` | Frontend dev server + production bundler | `apps/frontend/package.json:46` |
| **TypeScript** | `^5.9.3` | Type checking (`tsc --noEmit` via `typecheck` script) | `apps/frontend/package.json:45` |
| **Hardhat** | `^2.22.17` | Solidity compiler + local EVM node | `apps/contracts/package.json:15` |
| **Prisma CLI** | `^5.19.1` | Database migrations + schema management + Prisma Studio | `apps/backend/package.json:46` |

### 7.1 TypeScript configuration

- **Target:** ES2020
- **Module:** ESNext with `bundler` resolution
- **Strictness:** `strict: false`, `noImplicitAny: false`, `allowJs: true` (lenient for incremental migration)
- **JSX:** `react-jsx` (automatic runtime)

*Source: `apps/frontend/tsconfig.json`*

---

## 8. Development Tools

### 8.1 Root scripts

| Script | Command | Purpose |
|---|---|---|
| `dev:backend` | `npm run dev --workspace=apps/backend` | Backend dev server (`:5000`, `node --watch`) |
| `dev:frontend` | `npm run dev --workspace=apps/frontend` | Frontend dev server (`:3000`, Vite + proxy) |
| `test:backend` | `npm run test --workspace=apps/backend` | Backend tests (sequential plain Node scripts) |
| `test:frontend` | `npm run test --workspace=apps/frontend` | Frontend tests (Vitest) |
| `test` | `test:backend && test:frontend` | All tests |
| `build:frontend` | `npm run build --workspace=apps/frontend` | Vite production build |
| `blockchain:compile` | `hardhat compile` | Compile Solidity contracts |
| `blockchain:node` | `hardhat node` | Start local Hardhat EVM node |
| `blockchain:deploy` | `hardhat run scripts/deploy.js --network localhost` | Deploy contracts to local node |

*Source: `package.json:10`*

### 8.2 Dev topology

```
┌────────────┐   /api proxy   ┌──────────────┐   Prisma   ┌───────┐
│ Vite :3000 │ ────────────►  │ Express :5000│ ────────►  │ MySQL │
└────────────┘                └──────────────┘            └───────┘
                                     │
                                     │ ethers v6
                                     ▼
                              ┌──────────────┐
                              │ Hardhat :8545│
                              │ (local EVM)  │
                              └──────────────┘
```

### 8.3 Backend dev mode

- `node --watch server.js` — built-in Node.js file watcher (no nodemon dependency).

---

## 9. Deployment

> **No Docker, Kubernetes, CI/CD pipeline, or deployment configuration exists in the repository.** Production deployment topology is *unknown*.

### 9.1 What exists

| Concern | Status | Details |
|---|---|---|
| Local development | ✅ Supported | `npm run dev:backend` + `npm run dev:frontend` + MySQL |
| Contract deployment | ✅ Manual | `npm run blockchain:node` then `npm run blockchain:deploy` → writes `contracts.json` |
| Production build | ✅ `build:frontend` | Vite builds to `apps/frontend/dist/` |
| Docker | ❌ None | No `Dockerfile`, `docker-compose.yml`, or `.dockerignore` |
| CI/CD | ❌ None | No GitHub Actions, GitLab CI, or similar pipeline config |
| Kubernetes | ❌ None | No k8s manifests |
| Environment config | ✅ `.env` | Template at `apps/backend/.env.example`; `config/env.js` validates at startup |

---

## 10. Third-Party Services

### 10.1 In use

| Service | Role | Source |
|---|---|---|
| **MySQL** | Primary relational data store | `prisma/schema.prisma:6`, `DATABASE_URL` in `.env` |
| **Hardhat local node** | EVM blockchain (development only) | `hardhat.config.js:17`, `.env.example:32` |

### 10.2 Placeholders (validated but not implemented)

| Service | Status | Source |
|---|---|---|
| **Amazon S3** | `STORAGE_DRIVER=s3` is accepted by `config/env.js:64` but the S3 driver returns 503 at runtime — only `local` is implemented | `documentStorageService.js:134` |

### 10.3 No external services detected

The following are **not present** in the codebase:

- No email / SMTP / notification service
- No external authentication provider (OAuth, SAML, LDAP)
- No CDN configuration
- No monitoring / APM (Datadog, New Relic, Sentry, etc.)
- No cloud storage beyond the S3 placeholder
- No message queue / pub-sub
- No external blockchain network (mainnet / testnet)

---

## 11. Package Manager

| Tool | Role | Source |
|---|---|---|
| **npm** | Package installation, workspace orchestration, script execution | `package-lock.json` (lockfile), `package.json:4` (workspaces) |

> No `.nvmrc`, `.node-version`, or `engines` field was found — the required Node.js version is *unknown*, though ES2020 target and ESM usage imply Node.js ≥ 18.

---

## 12. Full Dependency Inventory

### 12.1 `apps/backend` — production dependencies

| Package | Version | Category |
|---|---|---|
| `@prisma/client` | `^5.19.1` | Database ORM |
| `bcryptjs` | `^2.4.3` | Password hashing |
| `cors` | `^2.8.5` | CORS middleware |
| `dotenv` | `^16.4.5` | Env file loading |
| `ethers` | `^6.17.0` | EVM interaction |
| `express` | `^4.19.2` | HTTP framework |
| `express-rate-limit` | `^8.6.1` | Rate limiting |
| `helmet` | `^7.1.0` | HTTP security headers |
| `jsonwebtoken` | `^9.0.2` | JWT signing/verification |
| `morgan` | `^1.10.0` | HTTP logging |
| `multer` | `^2.2.0` | File upload handling |
| `zod` | `^3.23.8` | Schema validation |

### 12.2 `apps/backend` — dev dependencies

| Package | Version | Category |
|---|---|---|
| `prisma` | `^5.19.1` | Prisma CLI (migrations, studio) |

### 12.3 `apps/frontend` — production dependencies

| Package | Version | Category |
|---|---|---|
| `@hookform/resolvers` | `^3.9.0` | Form validation bridge |
| `@radix-ui/react-checkbox` | `^1.3.11` | UI primitive |
| `@radix-ui/react-dialog` | `^1.1.23` | UI primitive |
| `@radix-ui/react-dropdown-menu` | `^2.1.24` | UI primitive |
| `@radix-ui/react-label` | `^2.1.15` | UI primitive |
| `@radix-ui/react-select` | `^2.3.7` | UI primitive |
| `@tailwindcss/vite` | `^4.3.3` | CSS tooling |
| `@tanstack/react-query` | `^5.101.4` | Server-state management |
| `axios` | `^1.7.0` | HTTP client |
| `bootstrap` | `^5.3.0` | CSS framework (legacy) |
| `date-fns` | `^4.4.0` | Date utilities |
| `lucide-react` | `^1.27.0` | Icon library |
| `react` | `^19.0.0` | UI library |
| `react-dom` | `^19.0.0` | React DOM renderer |
| `react-hook-form` | `^7.53.0` | Form management |
| `react-router-dom` | `^7.11.0` | Client-side routing |
| `recharts` | `^3.10.1` | Charting library |
| `tailwindcss` | `^4.3.3` | Utility-first CSS |
| `yup` | `^1.4.0` | Schema validation |
| `zod` | `^3.23.0` | Schema validation |

### 12.4 `apps/frontend` — dev dependencies

| Package | Version | Category |
|---|---|---|
| `@testing-library/jest-dom` | `^7.0.0` | Test matchers |
| `@testing-library/react` | `^16.3.2` | React test utilities |
| `@testing-library/user-event` | `^14.6.1` | Interaction simulation |
| `@types/react` | `^19.2.18` | Type definitions |
| `@types/react-dom` | `^19.2.4` | Type definitions |
| `@vitejs/plugin-react` | `^4.3.0` | Vite React plugin |
| `jsdom` | `^30.0.1` | Browser environment simulation |
| `typescript` | `^5.9.3` | Type checker |
| `vite` | `^6.0.0` | Bundler / dev server |
| `vitest` | `^4.1.10` | Test runner |

### 12.5 `apps/contracts` — dev dependencies

| Package | Version | Category |
|---|---|---|
| `@nomicfoundation/hardhat-toolbox` | `^5.0.0` | Hardhat plugin bundle |
| `hardhat` | `^2.22.17` | EVM toolchain |

---

## 13. Node.js Built-in Modules Used

| Module | Role | Source |
|---|---|---|
| `node:crypto` | SHA-256 hashing (content hashes, document dedup, event hashes, refresh tokens) | `utils/hashUtils.js`, `utils/fileUtils.js`, `utils/auditPersistence.js`, `utils/jwt.js` |
| `node:fs` / `node:fs/promises` | Local file storage driver (document blobs) | `services/documentStorageService.js` |
| `node:path` | File path resolution | Various |
| `node:stream` | Stream-based file hashing | `utils/fileUtils.js`, `services/documentStorageService.js` |
| `node:assert/strict` | Backend test assertions | `apps/backend/tests/*.test.js` |

---

## 14. Related Documentation

- [docs/INDEX.md](./INDEX.md) — navigation, source-of-truth hierarchy, reading order.
- [docs/PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — purpose, features, users, workflows, technology summary.
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md) — end-to-end architecture, request flow, runtime flows.
- [docs/FILE_STRUCTURE.md](./FILE_STRUCTURE.md) — directory/file organization, module tables.
