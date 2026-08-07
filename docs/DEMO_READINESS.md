# Demo Readiness Report — Pre-Orals August 10

**Owner:** Technical Lead
**Assessed:** 2026-08-07
**Tree:** `15b9dde` (main)
**Method:** backend booted against the live MySQL instance, API endpoints probed with a real login attempt, live database schema diffed against `schema.prisma`, all test suites and builds executed.
**Scope constraint:** demo readiness only. No architectural rewrites, no new blockchain subsystems, nothing that cannot realistically land before August 10.

---

## Baseline — what is already healthy

| Check | Result |
|---|---|
| `vite build` (frontend production build) | Clean, built in 19.67s |
| `tsc --noEmit` (frontend typecheck) | Clean, zero errors |
| `vitest run` (frontend) | **174/174 passed**, 22 files |
| `npm test` (backend) | All 38 test files passed |
| Blockchain provider degradation | Graceful — returns `not configured` / `unreachable` instead of throwing |

**Every Critical issue below is environment and database drift, not application code.** The codebase itself is in good shape.

---

## CRITICAL — blocks the demo entirely

### C1. Login is 100% broken — `refresh_tokens` is never created by any migration

```
POST /api/auth/login → 500
{"success":false,"message":"A required table does not exist in the database"}

Prisma P2021 on prisma.refreshToken.create()
The table `refresh_tokens` does not exist in the current database.
```

`RefreshToken` is declared at `apps/backend/prisma/schema.prisma:279-292` and is called on **every** login through `apps/backend/repositories/refreshTokenRepository.js:14`. But:

```bash
grep -rin "refresh" apps/backend/prisma/migrations/   # → no matches
```

No migration has ever created this table.

**This is not merely live-database drift.** A clean `prisma migrate deploy` against a fresh database also produces no `refresh_tokens`. Resetting alone will not fix it — a new migration must be generated and committed.

### C2. Treasurer and Auditor accounts cannot exist — ✅ RESOLVED 2026-08-07

```sql
users.role = enum('Administrator','BudgetOfficer')   -- missing Treasurer, Auditor
```

The live database holds only 2 users. `prisma/seed.js` seeds 4 and aborts on the third (Treasurer) because the enum value does not exist. A four-role RBAC walkthrough — the core of the authorization story — is impossible in the current state.

**Verified fixed.** `users.role` is now `enum('Administrator','Treasurer','BudgetOfficer','Auditor')` and all four accounts exist and are `Active`. All four credentials return **HTTP 200** from `POST /api/auth/login` with the correct role in the payload.

### C3. The approval workflow is dead at the database layer — ✅ RESOLVED 2026-08-07

- `allocation_approvals` table is **gone** (renamed to `allocation_approvals_archive`)
- `budget_allocations.status = enum('Draft','Active','Closed','Reverted')` — missing `PendingApproval`, `Approved`, `Rejected`, `Archived`
- `budget_allocations` is missing `submittedAt`, `reviewedAt`, `reviewedBy`, `rejectionReason`

The backend endpoints all exist and are tested (`apps/backend/routes/allocationRoutes.js:124-174` — submit / approve / reject / return / approvals). Every one of them will return 500 against this database.

**Verified fixed.** `allocation_approvals` is present, the status enum is `Draft / PendingApproval / Approved / Rejected / Archived`, and all four workflow columns exist. `GET /api/allocations/:id/approvals` returns **HTTP 200** for every seeded allocation — no 500s.

**A second defect was found and fixed at the seed layer.** The tables existed but the data contradicted itself: allocations were seeded directly into `Approved` / `Rejected` / `PendingApproval` with `submittedAt`, `reviewedAt`, `reviewedBy` and `rejectionReason` all `NULL`, and **zero** rows in `allocation_approvals`. Opening an approved allocation showed a blank approver and an empty history — the exact screen the approval-workflow demo lands on.

`prisma/seed.js` now declares an approval *history* per allocation and derives the header fields from it via `deriveWorkflow()`, replaying the same rules as `allocationService.performTransition()`. The two can no longer disagree, and a seed-time assertion fails the run if a declared status ever drifts from the history that produced it. Seeded history now covers all four actions:

| Allocation | Status | History |
|---|---|---|
| BA-2026-001 | Draft | — |
| BA-2026-002 | PendingApproval | Submitted (BudgetOfficer) |
| BA-2026-003 | Approved | Submitted → Approved (Treasurer) |
| BA-2026-004 | Draft | Submitted → Returned (Treasurer) |
| BA-2026-005 | Rejected | Submitted → Rejected (Treasurer) |

The workflow fields are also restated in the upsert `update` branch, so re-running the seed overwrites manual-testing residue instead of compounding it. Confirmed idempotent — two consecutive runs hold at 7 approval rows.

### C4. The database is empty — ✅ RESOLVED 2026-08-07

```
fiscalYear=0  department=0  fundSource=0  budgetCategory=0
budgetProgram=0  budgetAllocation=0  managedDocument=0  blockchainRecord=0
```

Even with login fixed there is nothing to demonstrate.

**Verified fixed.** Seeded: 4 users · 2 fiscal years (FY-2026 active) · 3 departments · 3 fund sources · 3 categories · 4 programs · 5 allocations · 7 approval entries · 4 documents with versions and activities · 11 audit logs.

`blockchainRecord` is still **0** — anchoring is deliberately left for the live demo, and it depends on H3 (Hardhat node kept running).

---

### Residual schema drift found while verifying C2–C4 — ✅ FIXED

`prisma migrate diff` still reported two indexes present in `schema.prisma` but created by no migration:

```
[*] Changed the `document_versions` table   [+] Added index on columns (sha256Hash)
[*] Changed the `managed_documents` table   [+] Added index on columns (documentCode)
```

Both columns are already `@unique`, which creates an index on its own — the extra `@@index` lines were redundant, and inconsistent with every other `@unique` column in the schema (`storageKey`, `txHash`, `currentVersionId` carry no duplicate). Like C1 this was a **repository** defect, not local drift: a fresh clone reproduced it.

Removing the two redundant `@@index` lines was the zero-risk fix — no DB change, no new migration. Both diffs are now clean:

- live database vs `schema.prisma` → *No difference detected*
- migrations replayed into a shadow DB vs `schema.prisma` → *No difference detected*

A fresh clone now produces a database that matches the schema exactly.

---

### Correction to `IMPLEMENTATION_PLAN.md` §0.2

The plan concludes that the `rescope_to_budget_execution` migration "could not be reproduced" and should not be scheduled as work. The **migration file** is indeed absent from the repository — but the live database proves the migration **was applied**:

- `allocation_approvals_archive` (the rename it performed)
- a stray `expense_transactions` table with no corresponding Prisma model
- the truncated `users.role` and `budget_allocations.status` enums

`prisma migrate status` reports *"Database schema is up to date!"* because `_prisma_migrations` was left intact — which is exactly what masks the drift.

**C1 through C4 are one root cause, not four.**

---

### Fix — one sequence, roughly 15 minutes — ✅ APPLIED 2026-08-07

```bash
cd apps/backend
npx prisma migrate dev --name add_refresh_tokens   # generates the missing CREATE TABLE
npx prisma migrate reset --force                   # replays all migrations + runs the seed
```

Reset is safe here: 2 users and zero business records are lost, and `blockchainRecord=0` means there is no on-chain / off-chain divergence to reconcile.

**Then verify all four role logins before doing anything else.** Commit the generated migration — C1 is a genuine repository defect and will bite any teammate who clones fresh.

**Outcome.** The migration is committed (`f9a8ce9`), all 9 migrations replayed cleanly, and all four role logins were re-verified at 200. The follow-on work that the reset alone did **not** cover — the redundant-index drift and the self-contradicting approval data — is described in the two sections above. Backend suite re-run after both changes: **all 38 test files pass**.

Seed credentials (`prisma/seed.js`):

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@university.edu` | `AdminPassword123!` |
| Budget Officer | `budgetofficer@university.edu` | `BudgetOfficer123!` |
| Treasurer | `treasurer@university.edu` | `Treasurer123!` |
| Auditor | `auditor@university.edu` | `Auditor123!` |

---

## HIGH — will visibly break during the demo

### H1. No React ErrorBoundary anywhere

`grep -rn "ErrorBoundary\|componentDidCatch" apps/frontend/src/` returns **zero hits**. Any render-time throw produces a permanent white screen, recoverable only by a full reload.

**Fix:** add a single boundary around `<AppRoutes />` in `apps/frontend/src/App.tsx`. ~20 min.

### H2. Dashboard crashes on partial API success

Guards check `loading` and `error` only. If a request resolves but the payload shape differs, `stats` remains `null` and `formatNumber(stats.totalUsers)` calls `.toString()` on `undefined`.

- `apps/frontend/src/pages/Dashboard.tsx:152, 171, 190, 238, 257, 276, 295, 314`
- `apps/frontend/src/pages/Dashboard.tsx:501` — same exposure on `blockchainStatus.connected`

Combined with H1, this white-screens the first page the panel sees.

**Fix:** add `!stats` to the guard chain; use `stats?.x ?? 0`. ~15 min.

### H3. Hardhat node state is ephemeral

Contract addresses are deterministic across restarts, but **anchored hashes are not**. Anything anchored before a node restart will verify as *not on chain* — the verification demo fails silently while appearing to function.

`apps/contracts/deployments/contracts.json` was deployed 2026-08-07.

**Fix:** start the Hardhat node once and leave it running between rehearsal and demo. Re-anchor after any restart. No code change.

### H4. Prisma logs every SQL query to stdout in development

`apps/backend/models/prismaClient.js:7` enables `['query','info','warn','error']` when `NODE_ENV=development` — 71 query lines were emitted from a handful of requests. This buries real errors and looks alarming if the terminal is visible.

**Fix:** drop `'query'` from the dev log array. ~2 min.

---

## MEDIUM — polish the panel will notice

### M1. Bootstrap JS is never loaded — all Dashboard dropdowns are dead

`apps/frontend/src/index.css:2` imports Bootstrap **CSS only**. Three `data-bs-toggle="dropdown"` menus on the Dashboard (Users by Role, Users by Status, Blockchain Status) do nothing when clicked.

**Fix:** delete the three dropdown blocks — fastest and safest. ~10 min.

### M2. Bootstrap Icons is not installed — 4 invisible icons

`bootstrap-icons` is absent from both `node_modules` and `package.json`, yet `Dashboard.tsx` uses 4 `bi bi-*` classes (`bi-three-dots` ×3, `bi-bell` ×1). The notification list renders coloured circles with no glyph inside.

**Fix:** swap to `lucide-react`, already a dependency and used everywhere else in the app. ~10 min.

### M3. Seven dead `href="#"` links on the Dashboard

`Dashboard.tsx:335, 336, 406, 407, 446, 487, 488` — "View Details", "Export Data" (×2 each), "View All", "Refresh". Clicking any of them jumps the page to top and does nothing.

**Fix:** remove them, or wire "View All" → `/audit`. ~10 min.

### M4. Two sidebar entries lead to bare unstyled placeholder text

- `/budget-allocation/approval-workflow` → "Planned feature in Phase 5" (`AppRoutes.tsx:110-118`)
- `/expense-tracking` → "Planned feature in Phase 4" (`AppRoutes.tsx:173-182`)

Both are raw `<div>`s outside the app's card design, with a non-functional "Notify Me When Available" button. Approval Workflow is doubly awkward — its backend endpoints actually exist.

**Fix:** hide both from the sidebar for the demo, or style them consistently. `sidebarConfig.ts` already supports `status: 'Planned'` badges. ~20 min.

### M5. Bootstrap and Tailwind mixed inside the same components

`grid grid-cols-4` sits next to `display-4 fw-bold`, `text-muted`, and `d-flex justify-content-between` in the same file. Affected: `Dashboard.tsx`, `Login.tsx`, `Profile.tsx`, `DashboardLayout.tsx`, `components/ui/Alert.tsx`, `components/ui/Spinner.tsx`, `components/dashboard/FinancialActivityTimeline.tsx`.

Reads as inconsistent spacing and typography against the rest of the app, which is clean Tailwind.

**Fix — deliberately partial:** scope to **Dashboard only**. It is the first and longest page on screen. Rewriting styling across six files 72 hours out risks more than the inconsistency costs. ~45 min.

### M6. Four allocation routes render the same component

`AppRoutes.tsx:96-99` — `/allocations`, `/allocations/new`, `/allocations/:id/edit`, and `/allocations/:id` all resolve to `AllocationList`. Deep-linking to an allocation shows the list, not a detail view.

**Fix:** none. Drive the demo via dialogs and avoid refreshing on those URLs.

---

## LOW — note, do not necessarily fix

| # | Issue |
|---|---|
| **L1** | ~~Stray `expense_transactions` table with no Prisma model.~~ Removed by the C1–C4 reset, as predicted. Confirmed absent. |
| **L2** | `.env` omits `JWT_ISSUER`, `JWT_AUDIENCE`, `STORAGE_DRIVER`, `STORAGE_ROOT`, and the upload rate limits present in `.env.example`. All have safe defaults (`config/env.js:103-135`), so there is no runtime impact — but a fresh clone will not behave identically. |
| **L3** | `LOGIN_RATE_LIMIT_MAX=5000` and `SENSITIVE_RATE_LIMIT_MAX=10000` in `.env` vs `5` / `10` in `.env.example`. Useful for rehearsal (no lockout); do not present these as production values if asked. |
| **L4** | Backend `npm test` is a 38-command `&&` chain that fails fast — one failure hides the other 37. Do not run it live. |
| **L5** | `CLAUDE.md` is deleted but `AGENTS.md:324` still mandates that all agents read it. Cosmetic, unless a panelist opens the repository. |

---

## Recommended order

### Today — August 7 · ~1 hour · unblocks everything
1. ✅ **C1** — `refresh_tokens` migration generated and committed (`f9a8ce9`)
2. ✅ **C2 / C3 / C4** — reset sequence applied; plus the redundant-index drift and the approval-history seed defect found during verification
3. ✅ **Verify all four role logins** — all four return 200
4. **H4** — silence Prisma query logging *(outstanding)*

### August 8 — ~1.5 hours · stops visible failures
5. **H1** — ErrorBoundary
6. **H2** — Dashboard null guards
7. **M1**, **M2**, **M3** — dead dropdowns, invisible icons, dead links

### August 9 — ~1 hour · polish, then rehearse
8. **M4** — placeholder routes
9. **M5** — Dashboard styling only
10. **Full dry run on the actual demo machine**, including **H3** (start the Hardhat node once and leave it up)

### August 10 — demo day
No code changes. Boot in the H3 order and rehearse once.

---

## Two judgement calls worth flagging

**C1 is a repository defect, not just a dirty local database.** The generated migration must be committed or every fresh clone reproduces the broken login.

**M5 is intentionally left mostly unfixed.** The Bootstrap/Tailwind mix spans six files. Rewriting all of them three days before orals risks more than the visual inconsistency costs. Dashboard only.
