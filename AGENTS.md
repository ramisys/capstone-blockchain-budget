# AGENTS.md

Monorepo (npm workspaces) for a blockchain-themed budget allocation system: `apps/backend` (Express + Prisma + MySQL), `apps/frontend` (React 19 + Vite + TS), `apps/contracts` (placeholder), `packages/shared` (empty). Root `CLAUDE.md` and `docs/*.md` are largely stale/aspirational — trust the code and this file.

## Commands

Run from root unless noted. Dev requires a running MySQL DB. Backend env lives in `apps/backend/.env` (gitignored; template `apps/backend/.env.example`). `config/env.js` fails fast unless `JWT_SECRET` is a random string ≥ 32 chars — backend tests load `.env` (two import `config/env.js`) but never touch the DB.

```bash
npm run dev:backend      # Express on :5000 (node --watch)
npm run dev:frontend     # Vite on :3000, proxies /api -> :5000
npm run test:backend     # plain node scripts, sequential, NO test runner, no DB needed
npm run test:frontend    # vitest run (apps/frontend)
npm run test             # backend then frontend
npm run build:frontend
```

- `typecheck` exists only in `apps/frontend` (`npm run typecheck --workspace=apps/frontend`; `tsc --noEmit`). Root has no typecheck/lint.
- Backend tests are a hardcoded list in `apps/backend/package.json` `test` script — add new test files to that list (it also includes two that don't match `*.test.js`: `testAuthLogic.js`, `testRateLimiter.js`). Run one file directly: `node tests/<file>.test.js`.
- Prisma commands run from `apps/backend`: `npx prisma migrate dev`, `npm run seed`, `npx prisma studio`.
- Seed users (all `apps/backend/prisma/seed.js`): `admin@university.edu / AdminPassword123!`, `budgetofficer@university.edu / BudgetOfficer123!`, `treasurer@university.edu / Treasurer123!`, `auditor@university.edu / Auditor123!`.

## Backend (`apps/backend`, ESM)

- ESM: `"type": "module"` — all local imports need the `.js` extension.
- No `src/` dir — code is top-level in `apps/backend/`: `routes/`, `controllers/`, `services/`, `repositories/`, `middleware/`, `validators/`, `models/`, `config/`, `utils/`, `errors/`, `constants/`.
- Layered: `routes/` → middleware → `controllers/` (thin) → `services/` (business logic) → `repositories/` (Prisma). Keep logic in services. Zod schemas live in `validators/`, the Prisma client in `models/prismaClient.js`, env loading in `config/env.js`.
- Every endpoint: `authenticate` (router-level), `authorize(...roles)`, then `validateRequest(zodSchema, source)`. New routes must follow this order.
- All routes mount in `routes/apiRouter.js` under `/api`.
- Money is `Decimal(14,2)` in DB; services convert via `utils/amountUtils.js` `toNumber()` so APIs return plain numbers.
- Allocation codes are sequential per fiscal year (`ALC-2026-0001`), generated in `repositories/allocationRepository.js`. Allocations are soft-deleted via `deletedAt`.
- Audit logging = structured console output from `utils/auditLogger.js` + `constants/auditActions.js` (auto-redacts passwords/tokens). It is NOT persisted to any DB table.
- Errors: `errors/appError.js`, `errors/apiError.js` (ValidationError, ForbiddenError...), centralized `middleware/errorHandler.js`.
- Tests in `tests/` use `node:assert/strict` and manually monkey-patch repository/prisma methods (no mocking lib). No live DB required.

## Frontend (`apps/frontend`, TypeScript)

- TS migration is lenient: `strict: false`, `allowJs: true` in `tsconfig.json`. Don't fight it; new files should still be `.ts/.tsx`.
- Styling is hybrid: Tailwind CSS v4 utilities in newer components + Bootstrap 5 CSS classes (`form-control`, `card`, `.btn-*`) + hand-written CSS-variable theme in `src/index.css` (navy `#1B3A5C` + gold `#D4A843`).
- **No `@/` path alias** — it exists only in `vitest.config.ts` but nothing uses it. All imports are relative; using `@/` breaks `vite build`.
- Data flow: `src/services/*.ts` (call `src/api/apiClient` = axios, baseURL `/api`, JWT + token-refresh interceptors, tokens in localStorage) → TanStack Query hooks in `src/hooks/` → pages. Follow this pattern for new modules.
- Shared/domain types live in `src/types/`. UI primitives are hand-rolled in `src/components/ui/` (some Radix-based: Dialog, Select, DropdownMenu).
- Tests: Vitest + Testing Library (jsdom). `src/test/setup.ts` polyfills matchMedia/ResizeObserver/PointerEvent; use `renderWithProviders` from `src/test/test-utils.tsx`. Run one file: `npx vitest run <file>` from `apps/frontend`.

## Database / Prisma

- Schema: `apps/backend/prisma/schema.prisma` (MySQL). Models: User, RefreshToken, FiscalYear, FundSource, Department, BudgetCategory, BudgetProgram, BudgetAllocation.
- Enums are PascalCase (`Administrator`, `Draft`, `PendingApproval`) — mirrored as UPPER_SNAKE constants in `apps/backend/constants/`. Table names are snake_case via `@@map`.
- Never edit applied migrations; create a new one with `npx prisma migrate dev`.
- New entities should follow the existing pattern: uuid ids, `createdAt`/`updatedAt`, `@@index` on queried fields.
