# Project Documentation — Index

**Project:** Blockchain-Based Budget Allocation and Expense Monitoring System (university capstone)
**Repository root:** `D:\Ramisys files\Projects\capstone`
**Generated:** from source-code analysis. The implementation is the single source of truth (see [Source of Truth Hierarchy](#6-source-of-truth-hierarchy)).

---

## 1. Purpose of the Documentation

This documentation set explains the architecture, data model, and workflows of the **BudgetChain** monorepo — a blockchain-themed government-style financial management platform that lets university staff plan budget allocations, get them approved, attach versioned documents, and anchor tamper-evident evidence (record hashes + audit events) on an EVM ledger.

It is written for **two audiences**:

- **Developers** — onboarding, understanding where to make changes, and how the pieces fit together.
- **AI agents** — a reliable, code-derived map of the repository so agents can navigate, modify, and test code without guessing or trusting stale prose.

The documentation deliberately excludes marketing-style roadmap narrative (phases, "improvements") and instead describes what actually exists in the code today. Planned features are called out explicitly as *planned*.

**Scope and exclusion note:** `docs/` content is produced by analyzing source code only. Pre-existing Markdown (root `README.md`, `CLAUDE.md`, `USER_MANAGEMENT_SUMMARY.md`, `apps/backend/docs/API_DOCUMENTATION.md`, per-workspace `README.md` files) was **not** treated as authoritative and is largely stale relative to the code (see [Section 6](#6-source-of-truth-hierarchy)).

---

## 2. Documentation Structure

The documentation lives in `docs/` at the repository root. Each document targets one concern:

| File | Concern | Status |
|------|---------|--------|
| `docs/INDEX.md` | Central navigation (this file) | ✅ Exists |
| `docs/ARCHITECTURE.md` | End-to-end system architecture, request flow, module responsibilities | 🚧 Planned |
| `docs/BACKEND.md` | Backend layout, layers, patterns, security model, audit logging | 🚧 Planned |
| `docs/API.md` | REST API reference (routes, RBAC matrix, pagination/error conventions) | 🚧 Planned |
| `docs/DATABASE.md` | Prisma schema, models, enums, migrations, seed data | 🚧 Planned |
| `docs/FRONTEND.md` | Frontend structure, data flow, styling, routing, state management | 🚧 Planned |
| `docs/CONTRACTS.md` | Solidity contracts, toolchain, deployment, testing | 🚧 Planned |
| `docs/BLOCKCHAIN.md` | On-chain anchoring, verification, retry scheduler, unified history, audit trail | 🚧 Planned |
| `docs/TESTING.md` | Backend + frontend + contract test suites, how to run them, conventions | 🚧 Planned |

> **Status note:** Only `INDEX.md` exists at this time. The planned files above are the intended documentation set; each describes a clearly bounded concern and should be written against the source code (never copied from stale Markdown).

Conventions for all docs in this set:

- Code references use `path/to/file:line` syntax (e.g. `apps/backend/services/blockchainService.js:37`).
- Diagrams use Mermaid.
- "Planned" is reserved for features that exist as placeholders/roadmap items only.
- Facts are verifiable in source; when something cannot be determined from code, it is stated explicitly rather than guessed.

---

## 3. Documentation Map

### 3.1 Repository topology

The repo is an npm-workspaces monorepo: `apps/backend`, `apps/frontend`, `apps/contracts`, and `packages/*` (only `packages/shared` exists, currently a placeholder with a README only — no code).

```mermaid
flowchart LR
    subgraph Root["capstone (npm workspaces)"]
        direction TB
        PKG["packages/shared (placeholder, no code)"]
        DOCS["docs/ (this documentation set)"]
    end

    subgraph BE["apps/backend — Express + Prisma + MySQL (ESM)"]
        direction TB
        R[("routes/")] --> MW["middleware/ (auth, rbac, validate, rate-limit)"]
        MW --> CT[("controllers/ (thin)")]
        CT --> SV[("services/ (business logic)")]
        SV --> RE[("repositories/ (Prisma)")]
        RE --> PR["Prisma client + MySQL"]
        SV --> SCH["blockchainScheduler (60s retry)"]
        SCH --> SV
    end

    subgraph FE["apps/frontend — React 19 + Vite + TS"]
        direction TB
        PG[("pages/")] --> HK[("hooks/ (TanStack Query)")]
        HK --> SRV[("services/*.ts")]
        SRV --> API["src/api/axios (JWT + refresh interceptors)"]
    end

    subgraph CT["apps/contracts — Hardhat + Solidity 0.8.24"]
        direction TB
        BLS["BudgetLedger.sol (allocation/document anchors)"]
        ALS["AuditLedger.sol (audit event anchors)"]
    end

    API -->|"HTTP /api (Vite proxy :3000 → :5000)"| R
    SV -->|"ethers v6 (record / verify / auditRecord)"| BLS
    SV -->|"ethers v6"| ALS

    classDef done fill:#e8f5e9,stroke:#2e7d32;
    class BE,FE,CT done;
```

### 3.2 Backend request flow (endpoint pattern)

Every protected endpoint follows the same pipeline, enforced by the router files:

```mermaid
sequenceDiagram
    participant C as Client (frontend)
    participant RT as routes/<module>Routes.js
    participant AU as authenticate (JWT)
    participant AZ as authorize(...roles)
    participant V as validateRequest(zod, source)
    participant CT as controllers/<module>Controller.js
    participant SV as services/<module>Service.js
    participant RP as repositories/<module>Repository.js
    participant DB as Prisma / MySQL

    C->>RT: HTTP request
    RT->>AU: authenticate
    AU-->>RT: req.user (fresh role/status from DB)
    RT->>AZ: authorize(role list)
    AZ-->>RT: ok
    RT->>V: validateRequest(schema, body/query/params)
    V-->>RT: ok
    RT->>CT: controller handler
    CT->>SV: business logic
    SV->>RP: data access
    RP->>DB: Prisma query
    DB-->>RP: rows
    RP-->>SV: rows
    SV-->>CT: serialized result (Decimal → number)
    CT-->>RT: formatted JSON envelope
```

All routes mount in `apps/backend/routes/apiRouter.js:19` under `/api`. A central error handler (`middleware/errorHandler.js`) normalizes Prisma and operational errors; a 404 handler catches unmatched routes.

### 3.3 Blockchain anchoring flow (fail-soft)

```mermaid
flowchart LR
    A["Record created / approved (service layer)"] --> B{"Ledger configured?"}
    B -- "No" --> C["DB row stays Pending<br/>(no anchor attempted)"]
    B -- "Yes" --> D["anchorUnlessExists():<br/>verify hash → record() if absent"]
    D -- "Tx confirmed" --> E["BlockchainRecord status = Confirmed<br/>(txHash, blockNumber, confirmedAt)"]
    D -- "Node unreachable / tx error" --> F["status = Failed (reason logged + audited)"]
    E --> G["Scheduler (60s) or manual retry:<br/>find Pending/Failed → retry"]
    F --> G
```

The same pattern applies to three anchor sources: allocation records (`BlockchainRecord`), document hashes (`DocumentVersion.sha256Hash`), and audit events (`AuditLog.eventHash` on `AuditLedger`). Anchors are never duplicated: content/event hashes are unique in DB and the contracts revert on duplicate hashes (`HashAlreadyRecorded` / `EventAlreadyRecorded`).

---

## 4. Recommended Reading Order

### For developers (first time in the repo)

1. **`README.md`** (root) — high-level stack, install/run steps, seed credentials.
2. **`AGENTS.md`** (root) — *authoritative* operational guide: commands, conventions, gotchas.
3. **`docs/INDEX.md`** — this map.
4. **`docs/ARCHITECTURE.md`** — how the pieces fit together.
5. **`docs/BACKEND.md`** — layering, security, audit logging.
6. **`docs/DATABASE.md`** — schema and workflows.
7. **`docs/API.md`** — endpoints and RBAC.
8. **`docs/FRONTEND.md`** — UI structure and data flow.
9. **`docs/CONTRACTS.md`** → **`docs/BLOCKCHAIN.md`** — the ledger layer.
10. **`docs/TESTING.md`** — how to verify changes.

### For AI agents (task-oriented)

1. **`docs/INDEX.md`** — navigation + source-of-truth hierarchy.
2. **`AGENTS.md`** — command reference and hard rules (ESM `.js` imports, no `@/` alias, test list maintenance, Prisma workflow).
3. **`docs/ARCHITECTURE.md`** — the mental model.
4. The single topic doc matching the task (backend / frontend / contracts / database / api / blockchain / testing).
5. Verify with the test/lint commands documented in **`docs/TESTING.md`** and `AGENTS.md`.

---

## 5. AI Workflow

Guidelines for AI agents (and humans acting as one) working in this repo:

1. **Start here.** Read `docs/INDEX.md`, then `AGENTS.md`. `AGENTS.md` is the authoritative command/convention reference; this documentation set explains the *what* and *why*.
2. **Never trust stale prose.** Root `CLAUDE.md`, `USER_MANAGEMENT_SUMMARY.md`, `apps/backend/README.md`, and `apps/backend/docs/API_DOCUMENTATION.md` describe older snapshots. When prose conflicts with code, **code wins**.
3. **Follow the layer boundaries.** Backend logic belongs in `services/`, database access in `repositories/`, HTTP in `controllers/`+`routes/`, validation in `validators/` (Zod), and error classes in `errors/`. Do not add new modules in the wrong layer.
4. **New endpoints must follow the pipeline** `authenticate` → `authorize(...roles)` → `validateRequest(schema, source)`, and must be mounted in `routes/apiRouter.js`.
5. **ESM discipline (backend).** All local imports need the `.js` extension (`import x from '../services/foo.js'`).
6. **Frontend import discipline.** Use relative imports only; `@/` is not configured and breaks the Vite build.
7. **Enums are PascalCase in Prisma** (`Administrator`, `Draft`) and mirrored as UPPER_SNAKE constants in `apps/backend/constants/`. Keep them in sync.
8. **Migrations are append-only.** Never edit an applied migration; create a new one with `npx prisma migrate dev`.
9. **Money is `Decimal(14,2)`** in the DB and plain numbers at the API boundary via `utils/amountUtils.js` `toNumber()`.
10. **Adding a backend test file** requires adding it to the hardcoded `test` script list in `apps/backend/package.json`.
11. **Verify before finishing.** Run the relevant suites (see `docs/TESTING.md` and `AGENTS.md`). Backend tests need no DB; frontend tests use Vitest + Testing Library.
12. **When updating documentation**, update the relevant topic doc, this index if the map changed, and re-check the source-of-truth rules in [Section 6](#6-source-of-truth-hierarchy).

---

## 6. Source of Truth Hierarchy

When any two sources disagree, resolve in this order (highest first):

1. **Source code** — the actual implementation (highest authority).
   - `apps/backend/` — routes, controllers, services, repositories, middleware, validators, config, constants.
   - `apps/frontend/src/` — components, hooks, services, pages, types.
   - `apps/contracts/` — Solidity contracts and Hardhat scripts.
2. **`apps/backend/prisma/schema.prisma` + `prisma/migrations/`** — the database contract.
3. **`AGENTS.md`** (root) — operational instructions; describes the intended repo conventions and commands. Trusted, but verify exact behavior against code/tests when unsure.
4. **This documentation set (`docs/`)** — maintained to reflect 1–3. Update it when code changes.
5. **Root `README.md`** — useful overview and run instructions, but not authoritative for details.
6. **Unreliable / legacy Markdown** — treat as historical notes only; never as a spec:
   - `CLAUDE.md` (root)
   - `USER_MANAGEMENT_SUMMARY.md` (root)
   - `apps/backend/README.md`
   - `apps/backend/docs/API_DOCUMENTATION.md`
   - `.claude/` skill files and `skills-lock.json` (tooling config, not project docs)

**Explicitly unknown / not determinable from code** (do not guess):
- Why `packages/shared` is empty beyond a README (no usage found in any workspace).
- Deployment topology beyond local dev (no Docker/k8s config, no CI pipeline files present in the repo).
- Whether `AUDIT_LOG_DB_ENABLED=false` was ever used in a real environment (defaults to `true`).
- The `S3` storage driver path: `config/storage.js` validates the option but no S3 implementation exists; only `local` is implemented.

---

## 7. Documentation Maintenance Guidelines

- **Keep docs code-derived.** After every material change to behavior, update the affected topic doc. Never copy text from stale Markdown; re-derive from code.
- **Schema changes** require: a new Prisma migration, an update to `docs/DATABASE.md`, and a check that `apps/backend/constants/` mirrors any new enum values.
- **New/changed endpoints** require updates to `docs/API.md` and, if the route set changes, `docs/ARCHITECTURE.md`.
- **New backend modules** must follow the existing layering and the endpoint pipeline; document them in `docs/BACKEND.md`.
- **New contracts / ABI changes** require updates to `docs/CONTRACTS.md` and `docs/BLOCKCHAIN.md`, plus redeploy + regenerate `apps/contracts/deployments/contracts.json`.
- **Test changes** belong in `docs/TESTING.md`; remember the backend test-script list lives in `apps/backend/package.json`.
- **Update this index** whenever a doc is added, removed, or renamed, or when the documentation map changes.
- **Mark plans clearly.** Roadmap-only features (e.g. Phase 5 "Expense Tracking") appear as placeholders in the UI/routes; label them "planned" in docs and do not describe them as implemented.
- **Keep diagrams honest.** Mermaid diagrams must match the code (layers, flows, tables). Stale diagrams are worse than none.
- **State unknowns.** If a fact cannot be determined from code, say so explicitly (see the list in [Section 6](#6-source-of-truth-hierarchy)).

---

## 8. Links to Every Documentation File

### This documentation set (`docs/`)

| Document | Description |
|----------|-------------|
| [docs/INDEX.md](./INDEX.md) | **This file.** Central navigation, doc map, reading order, AI workflow, source-of-truth hierarchy. |
| [docs/ARCHITECTURE.md](./ARCHITECTURE.md) | 🚧 Planned — end-to-end architecture, request flow, module responsibilities, diagram. |
| [docs/BACKEND.md](./BACKEND.md) | 🚧 Planned — backend structure, layering, security model, audit logging, scheduler. |
| [docs/API.md](./API.md) | 🚧 Planned — REST API reference, RBAC matrix, validation/pagination/error conventions. |
| [docs/DATABASE.md](./DATABASE.md) | 🚧 Planned — Prisma models, enums, relations, migrations, seed data. |
| [docs/FRONTEND.md](./FRONTEND.md) | 🚧 Planned — frontend structure, data flow (services → hooks → pages), routing, styling. |
| [docs/CONTRACTS.md](./CONTRACTS.md) | 🚧 Planned — Solidity contracts, Hardhat toolchain, deployment, smoke tests. |
| [docs/BLOCKCHAIN.md](./BLOCKCHAIN.md) | 🚧 Planned — anchoring, verification, retry scheduler, unified ledger history, audit trail. |
| [docs/TESTING.md](./TESTING.md) | 🚧 Planned — test suites, run commands, conventions, mocking approach. |

### Authoritative repo references (not part of `docs/`)

- `AGENTS.md` — command reference and repository conventions (trusted).
- `README.md` — overview and setup (partially trusted).

### Legacy / stale Markdown (do not use as a spec)

- `CLAUDE.md` — historical AI-guidance file.
- `USER_MANAGEMENT_SUMMARY.md` — phase-2 summary, superseded by code.
- `apps/backend/README.md` — early-phase backend guide.
- `apps/backend/docs/API_DOCUMENTATION.md` — stale API spec.
- `apps/contracts/README.md`, `packages/shared/README.md` — short workspace notes (check against code).
