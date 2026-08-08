# BudgetChain Dashboard — UI/UX Audit & Redesign Plan

**Scope:** The main dashboard at `/dashboard` (`apps/frontend/src/pages/Dashboard.tsx`) and its supporting components, hooks, services, and backend endpoints.
**Method:** Static source-code inspection of `apps/frontend`, `apps/backend`, and `apps/backend/prisma/schema.prisma`. No browser rendering, no runtime instrumentation. `npm run typecheck` was executed in `apps/frontend` to establish a baseline (passes clean).
**Role:** Senior UI/UX Designer · Frontend Architect · Product Design Reviewer
**Date:** August 2026
**Status:** Analysis only — **no code was modified**.
**Related documents:** `docs/UI_AUDIT_REPORT.md` (whole-frontend audit), `docs/UX_REDESIGN_REPORT.md` (whole-frontend redesign review). This document is narrower and deeper: it covers the dashboard exclusively.

---

## 1. Executive Summary

The current `/dashboard` is a **functional but mis-targeted administrative dashboard**. It works, it fetches real data, and it has no obvious runtime breakage — but it does not do the job the product exists to do.

The single most damaging finding: **the dashboard of a budget allocation and expense monitoring system displays no monetary values at all.** Not one peso figure appears on the page. All four hero KPI cards and both charts are about *user accounts*. The genuine financial numbers — total budget, total allocated, remaining budget, utilization — already exist, are already computed correctly by the backend, and are already exposed via working endpoints (`GET /api/allocations/remaining-budget`, `GET /api/allocations/statistics`). They are simply not on the dashboard; they sit on a secondary page three navigation clicks deep (`/budget-allocation/allocations/dashboard`).

The second most damaging finding: **`apps/frontend/src/pages/Dashboard.tsx:215` hardcodes "Pending Approvals: 0"**, with a block of five apologetic comments (lines 210–214) admitting it is a placeholder. On a financial governance system, a hardcoded zero in a workflow-queue card is not a cosmetic issue — it actively misinforms. The real value (`pendingApprovalCount`) is already returned by `/api/allocations/statistics`.

Beyond those two, the page suffers from: dual-framework styling (Bootstrap 5 classes like `display-4 fw-bold text-success` interleaved with Tailwind v4 utilities, bypassing the project's own CSS token system), chart redundancy (a pie with outside labels *and* a legend *and* a tooltip; a bar chart with a legend for a single series), raw technical event names leaking into the feed (`DOCUMENT_ANCHOR_RETRY`), a confusing blockchain panel ("Connected" beside "Last Sync: Never"), a dead `View All` link (`<a href="#">`), an error-handling pattern that renders the same error message up to nine times simultaneously, and no page header of any kind.

Structurally the app is in good shape. The redesign is achievable as **a frontend information-architecture change plus two small, additive backend aggregation endpoints** — no rewrite, no framework change, no schema change, no breaking of any existing contract.

---

## 2. Current Dashboard Architecture

### 2.1 Frontend stack (verified)

| Concern | Implementation |
|---|---|
| Framework | React 19.0 + TypeScript 5.9 |
| Build | Vite 6, `type: module` |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) **+ Bootstrap 5.3 CSS** (both imported at `src/index.css:1-2`) + ~1,400 lines of custom CSS with a full design-token `:root` block |
| Component library | Radix UI primitives (dialog, select, dropdown-menu, checkbox, label) wrapped in local `src/components/ui/*` |
| Icons | `lucide-react` |
| Routing | `react-router-dom` v7, lazy-loaded routes, `ProtectedRoute`/`PublicRoute` guards |
| Server state | **TanStack Query v5** — used by every module **except `Dashboard.tsx`** |
| API client | Axios singleton at `src/api/axios.ts`, re-exported by `src/api/apiClient.ts` |
| Charts | **Recharts v3** — imported in exactly one file: `pages/Dashboard.tsx:7` |
| Forms | react-hook-form + `@hookform/resolvers` + yup + zod |
| Tests | Vitest + Testing Library — **no test exists for `Dashboard.tsx`** |
| TS config | `strict: false`, `noImplicitAny: false`. `npm run typecheck` passes cleanly today (verified) |

### 2.2 Dashboard components and data sources

| Section | Component | Data source | Fetch mechanism |
|---|---|---|---|
| 4 user KPI cards | inline in `Dashboard.tsx:140-221` | `GET /api/dashboard/stats` | raw `useState`/`useEffect` + axios |
| 5 setup-count cards | inline `Dashboard.tsx:224-322` | same `/dashboard/stats` payload | same |
| Users by Role (pie) | inline `Dashboard.tsx:327-384` | `GET /api/dashboard/charts` | same |
| Users by Status (bar) | inline `Dashboard.tsx:387-410` | same `/dashboard/charts` payload | same |
| Financial Activity | `components/dashboard/FinancialActivityTimeline.tsx` | `GET /api/dashboard/timeline` | **TanStack Query** via `useFinancialTimeline` |
| Notifications | inline `Dashboard.tsx:421-453` | `GET /api/dashboard/notifications` | raw `useState`/`useEffect` |
| Blockchain Status | inline `Dashboard.tsx:457-488` | `GET /api/dashboard/blockchain` | raw `useState`/`useEffect` |

### 2.3 Data flow (verified end to end)

```
Dashboard.tsx  →  apiClient.get('/dashboard/stats')
   → dashboardRoutes.js  (authenticate → authorize(all 4 roles) → validateRequest)
   → dashboardController.getStats
   → dashboardService.getDashboardStats
   → Promise.all([ userRepository.getDashboardStatsAggregated(),
                   fiscalYearRepository.count(), fundSourceRepository.count(),
                   departmentRepository.count(), budgetCategoryRepository.count(),
                   budgetProgramRepository.count() ])
   → Prisma / MySQL
   → { data: { stats: {...} } }  →  setStats()  →  render

FinancialActivityTimeline → useFinancialTimeline (React Query)
   → dashboardApi.getTimeline → GET /dashboard/timeline
   → timelineController → timelineService
   → in-memory union of 4 tables: allocation_approvals, document_activities,
     audit_logs, blockchain_records → sort desc → slice → paginate
```

### 2.4 Notable architectural observations

- **`GET /api/dashboard/activities` is dead code.** It is registered (`dashboardRoutes.js:51`) and implemented (`dashboardService.getRecentActivities`), but no frontend file calls it. It was superseded by `/dashboard/timeline`.
- **The dashboard is the only React Query holdout.** Every other page uses hooks + cache. The dashboard re-fetches from scratch on every mount, cannot dedupe with other components, and has no invalidation path.
- **`/dashboard/blockchain` and `/blockchain/status` return identical payloads** (both call `blockchainService.getBlockchainStatus()`). The dashboard uses the raw axios path; `BlockchainLedger.tsx` uses the cached `useBlockchainStatus()` hook. Two paths, one truth.
- The blockchain payload carries `recordCount`, `confirmedCount`, `pendingCount`, `failedCount`, `chainId`, `contractExplorerUrl`, and `message` — **the dashboard discards all of them**.

---

## 3. Current Strengths — Do Not Change

These are working well and should survive the redesign untouched:

1. **`FinancialActivityTimeline.tsx`** — the strongest component on the page. Proper React Query, kind filters, badges + icons per kind, real pagination, distinct loading/error/empty states, `aria-label` on the filter group. It needs refinement, not replacement.
2. **The backend financial computation is correct and honest.** `computeRemainingBudget` scopes the ceiling to fiscal years actually referenced by matching allocations, counts only `Approved` allocations as committed, and excludes soft-deleted rows. Do not touch it.
3. **The design token system in `index.css:5-92`** — a complete, coherent institutional navy/gold palette (`--color-primary: #1B3A5C`, `--color-accent: #D4A843`), typographic scale, spacing scale, shadow scale, radius scale. It is good. The problem is that `Dashboard.tsx` ignores it.
4. **Reusable components that already solve dashboard problems**: `StatisticsCard` (icon + title + value + subtitle + skeleton + optional click), `BudgetSummary` (three stats + accessible `role="progressbar"` utilization bar), `Card`/`CardHeader`/`CardBody`/`CardFooter`, `Badge`/`StatusBadge`, `Skeleton`, `Pagination`, `Alert`, `Spinner`.
5. **`utils/format.ts`** — `formatCurrency` correctly uses `Intl.NumberFormat` with `en-PH`/`PHP` from `constants/currency.ts`. Every peso value on the new dashboard must go through it.
6. **RBAC plumbing** — `ProtectedRoute roles={[...]}`, `useAuth().hasRole(...roles)`, `ROLES`/`ROLE_LABELS` constants, backend `authorize()` middleware. Role-aware dashboard sections are cheap to build on this.
7. **The timeline's human-label mapping for documents** (`timelineService.documentActionLabel`) already converts `UPLOAD → "Document uploaded"`, `ANCHOR_RETRY → "Document anchor retried"`. The pattern exists; it just was not applied to audit-log entries.

---

## 4. UX Problems, Ranked

### CRITICAL

**C1 — Hardcoded financial/workflow value.** `Dashboard.tsx:215` renders a literal `0` for "Pending Approvals", surrounded by comments conceding it is fake. The true count is one field away in `/allocations/statistics.pendingApprovalCount`. This violates the project's own "no hardcoded financial values" constraint and misreports the state of the approval queue.

**C2 — Zero financial content on a financial dashboard.** No currency symbol appears anywhere on the page. Total Budget, Total Allocated, Remaining Budget, and Utilization Rate all exist server-side and are all absent. The page cannot answer "how is our money doing?" — the only question it exists to answer.

**C3 — Administrative statistics occupy the entire visual apex.** The first screenful is Total Users / Active Users / Inactive Users / Pending Approvals (fake), then five master-data counts, then two user charts. A Budget Officer or Treasurer must scroll past ~1,400px of user administration before reaching anything financial.

**C4 — Fabricated system-health assertion.** `dashboardService.getNotifications()` unconditionally pushes `{ title: 'System Status', message: 'All services are operating normally.', type: 'success' }` regardless of actual system state. It is a green checkmark that means nothing, and it permanently consumes a notification slot.

### HIGH

**H1 — Bootstrap/Tailwind class collision.** `display-4 fw-bold text-success mb-2` (Bootstrap) sits inside `grid grid-cols-1 md:grid-cols-4 gap-4` (Tailwind) inside a `Card` styled with Tailwind. Consequences: Bootstrap's `.text-success` (#198754) overrides the brand `--color-success` (#2B8A4E); `display-4` renders at 3.5rem while the token scale tops out at `--font-size-3xl: 2rem`; `.text-muted` resolves to `--color-text-muted` (#8B93A0) which fails contrast. The dashboard visually does not belong to the same product as `/budget-allocation`.

**H2 — Error state renders up to nine times at once.** `statsError` is rendered inside all four KPI cards *and* all five setup cards. One failed request paints the same red `Alert` nine times. There is no retry affordance anywhere.

**H3 — Crash surface on unexpected payloads.** `stats.totalUsers` (line 153) and `blockchainStatus.connected` (line 469) are dereferenced when only `loading` and `error` have been checked. A 200 response with a changed envelope produces a white screen, not a graceful state.

**H4 — Chart redundancy and off-brand color.** The Users-by-Role pie carries a custom outside label (`Administrator: 3`), a `<Legend />`, *and* a `<Tooltip />` — three encodings of the same fact. The Users-by-Status bar has a `<Legend />` for a single unnamed series (renders the literal word "count"). Colors are hardcoded `#2563EB / #10B981 / #F59E0B / #EF4444` and `#4361ee` — none from the token palette. The `COLORS[index % length]` mapping is positional, so a role with zero users shifts every subsequent role's color.

**H5 — Raw technical event names in the activity feed.** `timelineService.serializeAuditLog` sets `label: log.action`, so `DOCUMENT_ANCHOR_RETRY`, `ALLOCATION_STATUS_CHANGE`, `AUTH_REFRESH_TOKEN` render verbatim on the dashboard. The frontend already ships `AUDIT_ACTION_LABELS` (`constants/auditActions.ts:107`) — it is simply not applied.

**H6 — Blockchain panel is simultaneously confusing and information-starved.** "Connected" + "Last Sync: Never" reads as a contradiction. The truth (traced through `blockchainService.js:251` → `config/blockchain.js:426`) is that `lastSync` falls back to `_lastSync`, which is only set on a *write*; with a connected chain and no anchored records yet, it is legitimately `null`. "Never" is the wrong word for "nothing anchored yet." Meanwhile the panel throws away `recordCount`/`confirmedCount`/`pendingCount`/`failedCount` — the only blockchain numbers a non-engineer cares about — and prints the full 42-character contract address as unbreakable `<small>` text with no copy action and no explorer link.

**H7 — Dead "View All" link.** `<a href="#">View All</a>` (line 425) navigates nowhere and, being a bare hash anchor, scrolls to top. Notifications themselves are non-actionable: "3 budget allocations require approval" does not link to the pending queue.

### MEDIUM

**M1 — Nested scrolling.** The timeline uses `max-h-96 overflow-y-auto` inside a card inside the page scroll, with pagination controls *below* the scroll box. Two scroll contexts and a paginator competing for the same gesture.

**M2 — No page header.** No `<h1>`, no title, no greeting, no fiscal-year context, no "last updated", no manual refresh. `const { user } = useAuth()` is destructured at line 12 and never used.

**M3 — Broken heading semantics.** Card titles are `<h6>`; the numbers inside them are `<h2 class="display-4">`. So the DOM order is h6 → h2 → h6 → h2, with no h1 on the page. Screen-reader heading navigation is unusable.

**M4 — Spinners instead of skeletons.** Every section swaps a small spinner for full content, producing large cumulative layout shift as the four independent requests land.

**M5 — Backend exposes user statistics to all four roles.** `dashboardRoutes.js:21-26` authorizes `/dashboard/stats` for Administrator, Treasurer, BudgetOfficer, and Auditor, while the frontend restricts `/users` to Administrator only (`AppRoutes.tsx:59`). A Budget Officer can read the user census from the API. Flagged as an inconsistency, not a request to change auth behavior — demoting/gating the user section in the UI narrows it in practice.

**M6 — Responsive breakpoint choices are wrong for the content.** `lg:grid-cols-5` for setup cards gives ~210px per card at the 1200px `.dashboard-content` cap, each holding a 3.5rem numeral. `md:grid-cols-3` puts the notification card at ~230px and the timeline at ~460px at 768px — badges, labels, and timestamps all collide. Both should step at `lg`, not `md`.

**M7 — Dashboard is outside the app's data-fetching architecture.** Four bespoke `useState` triples and four hand-rolled `fetchX` functions instead of hooks. No caching, no dedupe, no invalidation, no refetch-on-focus, no shared loading semantics.

### LOW

**L1** — `getStatusVariant` (lines 111–118) is defined and never called; `truncateText` re-implements CSS truncation in JS.
**L2** — `notifications.map((n, index) => <div key={index}>)` uses array index as key.
**L3** — Notifications carry no timestamp or severity ordering.
**L4** — `formatNumber` is re-implemented locally with a regex (line 106) while `utils/format.ts` already exports an `Intl`-based `formatNumber`.
**L5** — `Dashboard.tsx` is a `.tsx` file with essentially no types; it compiles only because `strict` and `noImplicitAny` are off.
**L6** — Dead endpoint `/api/dashboard/activities` is still routed and validated.

---

## 5. Recommended Dashboard Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ 0. PAGE HEADER                                                          │
│    "Dashboard" · greeting · RoleBadge · Fiscal Year selector           │
│    · Last updated · Refresh                                            │
├────────────────────────────────────────────────────────────────────────┤
│ 1. FINANCIAL OVERVIEW              ← the apex; currency, immediately   │
│    ┌──────────┬──────────┬──────────┬──────────┐                       │
│    │  Total   │  Total   │Remaining │Utilization│                      │
│    │  Budget  │ Allocated│  Budget  │   Rate    │                      │
│    └──────────┴──────────┴──────────┴──────────┘                       │
│    (Obligated / Spent deliberately OMITTED — no data model. §7)        │
├────────────────────────────────────────────────────────────────────────┤
│ 2. BUDGET UTILIZATION           │ 3. ACTION REQUIRED                   │
│    Allocated vs Remaining bar   │    Pending approvals  → queue        │
│    + % + committed/uncommitted  │    Drafts             → drafts       │
│    (reuse BudgetSummary)        │    Rejected           → rejected     │
│                                 │    Failed anchors     → ledger       │
├────────────────────────────────────────────────────────────────────────┤
│ 4. FINANCIAL ANALYTICS   (Phase D — needs 1 new backend endpoint)      │
│    Allocation by Department  │  Allocation by Category                 │
├────────────────────────────────────────────────────────────────────────┤
│ 5. FINANCIAL ACTIVITY                    │ 6. NOTIFICATIONS            │
│    (existing timeline, refined)          │    actionable only          │
│    2/3 width                             │    1/3 width                │
├────────────────────────────────────────────────────────────────────────┤
│ 7. SYSTEM INTEGRITY (compact strip)                                    │
│    ● Connected · Sepolia · Block #123456 · 48 anchored (2 pending)     │
│    · 0x1234…abcd ⧉  → View ledger                                     │
├────────────────────────────────────────────────────────────────────────┤
│ 8. ADMINISTRATIVE STATISTICS  (collapsed; Administrator-first)         │
│    Users · Master data counts · Users by role · Users by status        │
└────────────────────────────────────────────────────────────────────────┘
```

Priority principle: **currency before counts; actions before analytics; analytics before administration.**

---

## 6. Component-by-Component Changes

### 6.1 Page header — *does not exist*

- **Current:** none. The page starts abruptly with a KPI grid. `user` is fetched and discarded.
- **Problem:** no context (which fiscal year are these numbers about?), no identity, no data freshness, no refresh, no `<h1>`.
- **Recommended:** `<h1>Dashboard</h1>` + "Welcome back, {fullName}" + `<RoleBadge>` + a fiscal-year `<Select>` (from `useAllocationOptions().fiscalYears`, defaulting to `isActive === true`) + "Updated {time}" + a Refresh button calling `queryClient.invalidateQueries`.
- **Reason:** Financial figures without a period are meaningless. The fiscal-year selector is the scoping control every downstream number depends on, and `/allocations/statistics` and `/allocations/remaining-budget` both already accept `fiscalYearId`.

### 6.2 Hero KPI row

- **Current:** Total Users, Active Users, Inactive Users, Pending Approvals (**hardcoded 0**).
- **Problem:** C1, C2, C3, H1, H2, H3, M3 all live here.
- **Recommended:** four `StatisticsCard`s — **Total Budget**, **Total Allocated**, **Remaining Budget**, **Utilization Rate** — driven by `useRemainingBudget({ fiscalYearId })`, values through `formatCurrency`, subtitles naming the scope ("FY 2026" / "All fiscal years"), skeletons while loading, one shared error banner above the row with a Retry.
- **Reason:** This is the promotion that turns a CRUD dashboard into a financial one. It requires **zero backend work** — the endpoint, the computation, and the React Query hook (`useRemainingBudget`) all already exist and are already used by `AllocationDashboard.tsx`.

### 6.3 Budget utilization

- **Current:** absent from `/dashboard`; exists on `/budget-allocation/allocations/dashboard` as `<BudgetSummary>`.
- **Problem:** the single most important visual on a budget system is behind three clicks.
- **Recommended:** render the existing `<BudgetSummary data={budget} loading={budgetLoading} />` directly on the dashboard. Extend it (additively, preserving the current props) with a segmented allocated-vs-remaining bar and an explicit caption stating that "allocated" means *approved* allocations only.
- **Reason:** Maximum value for near-zero risk — a component already written, already accessible (`role="progressbar"` with valuenow/min/max), already color-graded at the 70%/90% thresholds. The caption matters because the backend genuinely excludes Draft and PendingApproval from committed budget; users will otherwise misread the number.

### 6.4 Action Required — *new section*

- **Current:** does not exist. The one gesture toward it is the hardcoded zero.
- **Problem:** the dashboard never answers "what needs my attention?"
- **Recommended:** a compact list from `useAllocationStatistics(fiscalYearId)` — Pending Approval → `/budget-allocation/allocations?status=PendingApproval`, Draft → drafts, Rejected → rejected — plus failed/pending blockchain anchors from the blockchain payload → `/budget-allocation/blockchain`. Hide rows whose count is 0; if all are 0, show a genuine "Nothing needs your attention" empty state. Gate approval rows on `hasRole(ADMINISTRATOR, TREASURER)` to match the backend's `APPROVAL_ROLES`.
- **Reason:** Every count is already in `/allocations/statistics`; the deep-link pattern is already proven at `AllocationDashboard.tsx:139`. This converts passive numbers into a work queue.

### 6.5 Financial analytics — *new section*

- **Current:** the only charts are Users by Role and Users by Status.
- **Problem:** no chart on the page answers a budget question.
- **Recommended:** horizontal bar — **Allocated amount by Department** (top 8 + "Other"); horizontal bar — **Allocated amount by Category**. Axis labels with compact peso formatting, tooltip with full `formatCurrency`, no legend (single series), colors from a sequential ramp derived from `--color-primary`. Empty state when no approved allocations exist.
- **Reason:** These are the two questions a Budget Officer actually asks. **This is the one section that requires new backend work** (see §7) — the data exists in `budget_allocations` but no aggregation endpoint does. Explicitly *not* proposed: fetching `/allocations?limit=100` and grouping client-side — inaccurate past 100 rows and wasteful.

### 6.6 Financial activity timeline

- **Current:** good component; four issues.
- **Problem:** raw audit action names (H5); nested scroll + paginator (M1); `md:grid-cols-3` squeeze (M6); no "View All"; filter buttons lack `aria-pressed`.
- **Recommended:** apply `AUDIT_ACTION_LABELS[entry.action] ?? entry.label` in the render (frontend-only — no API change, `entry.action` is already in the payload); drop `max-h-96 overflow-y-auto` and let the paginator own the length (default `limit={8}` on the dashboard); move the grid split to `lg:`; add `aria-pressed` to the filter pills and switch the active color from `bg-indigo-600` to `var(--color-primary)`; add a "View All →" footer link to `/audit`; use relative timestamps ("2 hours ago") with the absolute time in `title`.
- **Reason:** Preserves a working component while removing the exact problems named in the brief. `DOCUMENT_ANCHOR_RETRY` stays correct in the audit log, where a machine-readable name belongs, and reads as "Document anchor retried" on the dashboard.

### 6.7 Notifications

- **Current:** three synthesized items, non-actionable, dead View All, index keys, one permanently fake.
- **Problem:** C4, H7, L2, L3.
- **Recommended:** frontend — map each notification type to a link target (Pending Approvals → allocation queue, Inactive Users → `/users`, admin only), replace the bell-in-a-colored-circle with type-specific icons (`AlertTriangle`/`Info`/`CheckCircle2`) so severity is not color-only, drop `truncateText` in favor of `line-clamp-2`, key by `title`. Backend — make the "System Status" notification conditional on real signals (blockchain connectivity, failed anchors) or remove it; return an `actionPath` per notification.
- **Reason:** A notification that cannot be acted on is decoration. An unconditional "all normal" is worse than decoration — it is an unearned assurance in a system whose selling point is auditability.

### 6.8 Blockchain status

- **Current:** a full-width card with four `<small>` lines, one raw contract address, "Connected" beside "Last Sync: Never".
- **Problem:** H6 — dominates a full row, confuses non-engineers, discards the numbers that matter.
- **Recommended:** a single-row compact strip: status dot + label, network, latest block, **anchored-record counts** (`recordCount`/`confirmedCount`/`pendingCount`/`failedCount` — already in the payload, currently discarded), truncated contract address `0x1234…abcd` with a copy button and a `contractExplorerUrl` link, and "View Ledger →" to `/budget-allocation/blockchain`. Replace the sync line with a three-state message:
  - `connected && recordCount > 0` → "Last anchor: {relative time}"
  - `connected && recordCount === 0` → "**No records anchored yet**"
  - `!connected` → surface the backend's own `message` ("Blockchain integration is not yet configured.")
- **Reason:** "Never" implies failure; "No records anchored yet" states the actual fact. The backend already distinguishes these states and already sends a `message` field the UI ignores. Switching this section to the cached `useBlockchainStatus()` hook also dedupes with `BlockchainLedger`.

### 6.9 Administrative statistics

- **Current:** four hero cards + five setup cards + two charts = the top ~70% of the page.
- **Problem:** C3, H4, M6 — high visual weight, low business weight.
- **Recommended:** move to the bottom in a collapsible "System Administration" section, expanded by default only for Administrator (`hasRole(ROLES.ADMINISTRATOR)`). Compress the nine cards to a compact stat strip. Keep **one** user chart: **Users by Role**, as a **horizontal bar** (donut + outside labels + legend + tooltip is three encodings of four numbers). Drop the Users-by-Status chart — Active/Inactive is two numbers and belongs in the strip, not on an axis. Assign role→color from an explicit `Record<Role, string>` map built on design tokens, never positional indexing.
- **Reason:** The brief's own priority order puts administrative statistics last. Nothing is removed — a Treasurer simply stops seeing it before the budget numbers. This also directly answers "do not use charts merely because space is available."

---

## 7. Data / API Gap Analysis

Every proposed metric was traced to a concrete endpoint, service method, and Prisma model. **No metric below is assumed.**

### 7.1 Available today — no backend change required

| Metric | Existing data? | API exists? | Backend change? | Frontend change |
|---|---|---|---|---|
| Total Budget | ✅ `FiscalYear.budgetAmount` | ✅ `GET /allocations/remaining-budget` → `totalBudget` | **None** | Use `useRemainingBudget()`; `formatCurrency` |
| Total Allocated | ✅ sum of Approved `allocatedAmount` | ✅ same endpoint → `totalAllocated` | **None** | Same hook |
| Remaining Budget | ✅ computed `computeRemainingBudget` | ✅ same endpoint → `remainingBudget` | **None** | Same hook |
| Utilization Rate | ✅ derivable | ✅ (client-side `allocated/budget`) | **None** | Reuse `BudgetSummary` math |
| Pending Approvals | ✅ `AllocationStatus.PendingApproval` | ✅ `GET /allocations/statistics` → `pendingApprovalCount` | **None** | **Replaces hardcoded `0`** |
| Draft / Approved / Rejected counts | ✅ | ✅ same endpoint | **None** | New Action Required list |
| Total allocation count | ✅ | ✅ `totalAllocations` | **None** | Admin strip |
| Fiscal year list + active year | ✅ `isActive`, `budgetAmount` | ✅ `GET /fiscal-years` | **None** | `useAllocationOptions()` for the selector |
| Master-data counts | ✅ | ✅ `GET /dashboard/stats` | **None** | Move to admin section |
| Users total/active/inactive, by role, by status | ✅ | ✅ `/dashboard/stats`, `/dashboard/charts` | **None** | Demote to admin section |
| Financial activity feed | ✅ union of 4 tables | ✅ `GET /dashboard/timeline` | **None** | Label mapping, layout |
| Notifications | ✅ derived live | ✅ `GET /dashboard/notifications` | *Optional* (`actionPath`, conditional health) | Make actionable |
| Blockchain connection / network / block / contract | ✅ | ✅ `GET /dashboard/blockchain` | **None** | Compact strip |
| Anchored record counts (total/confirmed/pending/failed) | ✅ | ✅ **already in the same payload, currently discarded** | **None** | Surface them |
| Audit totals, success/failure, pending anchors | ✅ | ✅ `GET /audit-logs/summary` | **None** | Optional Auditor panel |
| Document count | ✅ | ✅ `GET /documents?limit=1` → `pagination.total` | **None** | Optional |

### 7.2 Requires a small, additive backend endpoint

| Metric | Existing data? | API exists? | Backend change needed | Frontend change |
|---|---|---|---|---|
| Allocation by Department | ✅ `budget_allocations.departmentId` + amount | ❌ **no aggregation endpoint** | **Yes — additive.** `allocationRepository.groupByDimension('departmentId', where)` + `GET /api/allocations/breakdown?dimension=department&fiscalYearId=` | New chart |
| Allocation by Category | ✅ `categoryId` | ❌ | **Yes — same endpoint**, `dimension=category` | New chart |
| Utilization by Department | ✅ (departments have no own ceiling) | ❌ | **Yes** — returns share-of-total, not share-of-ceiling | Chart + honest label |
| Monthly / quarterly allocation trend | ✅ `createdAt` | ❌ | **Yes — additive.** `GET /api/allocations/trend?fiscalYearId=&interval=month` | Optional line chart |

Both are **additive `GET` routes** reusing the existing `authenticate` → `authorize` → `validateRequest` chain and the existing repository. No schema change. No modification to any existing route, controller, or response shape. If zero backend changes are preferred, Phase D is simply omitted — every other phase stands alone.

### 7.3 Cannot be supported — omit from the design

| Metric | Finding |
|---|---|
| **Total Obligated** | ❌ **No obligation concept exists.** `schema.prisma` has no obligation model, field, or status. `AllocationStatus` is `Draft \| PendingApproval \| Approved \| Rejected \| Archived` — none of which represents obligation. |
| **Total Spent / Expenses** | ❌ **No expense model exists.** There is no expense, disbursement, or payment table. `AppRoutes.tsx:173-182` routes `/expense-tracking` to a literal "Planned feature in Phase 4" placeholder. |
| **Pending document verification** | ❌ **No such state.** `DocumentStatus` is `Active \| Archived` only. The nearest real signal is `DocumentVersion.blockchainStatus = Pending` ("awaiting anchor"), which is *not* human verification and has no aggregate endpoint. |

**Recommendation:** ship **four** primary KPIs — Total Budget, Total Allocated, Remaining Budget, Utilization Rate — not six. Adding Obligated and Spent would require either hardcoding values or inventing a schema, both of which the brief forbids. If they must be visible for the capstone narrative, the honest treatment is a dimmed card reading "Not yet tracked — Expense Monitoring (Phase 4)", which communicates the roadmap without fabricating a number. That is a product decision, pending confirmation.

---

## 8. Responsive Design Plan

Baseline: `.dashboard-content` is `max-width: 1200px; padding: 2rem`, dropping to `1rem` below 992px. The sidebar is fixed at 260px and becomes an overlay below 992px (`index.css:781-796`). All grids below are Tailwind and stay inside that container.

**Desktop (≥1280px)**
- Financial KPIs: `grid-cols-4`
- Utilization + Action Required: `grid-cols-3` (2/3 + 1/3)
- Analytics: `grid-cols-2`
- Activity + Notifications: `grid-cols-3` (2/3 + 1/3)
- Blockchain: single-row horizontal strip
- Admin: 4-col strip + one chart

**Laptop (992–1279px)**
- KPIs stay `grid-cols-4` (~270px each — comfortable at `--font-size-2xl`, which is why `display-4` must go)
- Analytics drop to `grid-cols-1` stacked — a horizontal bar chart with department names needs ≥600px
- Activity/Notifications remain `lg:grid-cols-3`

**Tablet (768–991px)** — sidebar is now an overlay, full content width
- KPIs → `sm:grid-cols-2` (2×2)
- Utilization and Action Required stack full-width
- Activity and Notifications stack full-width (**this is the M6 fix**: `md:grid-cols-3` currently squeezes notifications to ~230px)
- Blockchain strip wraps to two rows via `flex-wrap`
- Charts: `height={280}`, department labels truncated with tooltip

**Mobile (<768px)**
- Everything `grid-cols-1`
- KPI cards become compact rows (label left, value right) to avoid a 4-screen scroll
- Utilization bar full-width; the three sub-stats stack
- Charts: `height={240}`; if a bar chart has >6 categories, render a ranked list instead of a chart
- Timeline: badge above text rather than inline; relative timestamps only
- **Contract address must use `truncate` or `break-all`** — the current full 42-char string in `<small>` is the page's clearest horizontal-overflow risk at 360px
- Notifications: `line-clamp-2`

**Overflow guarantee:** no `min-w-` on grid children; every long string (contract address, tx hash, department name, document title, email) gets `truncate` + `title`; any table that appears wraps in `overflow-x-auto`; `ResponsiveContainer width="100%"` throughout. QA at 360 / 768 / 1024 / 1440px with the sidebar both expanded and collapsed.

---

## 9. Accessibility Plan

**Contrast (WCAG 2.2 AA — 4.5:1 body, 3:1 large text and UI components)**
- `text-slate-400` on white ≈ **3.0:1 — fails** for the timeline timestamps and KPI subtitles → move to `text-slate-500` (≈4.6:1) minimum.
- Bootstrap `.text-muted` is overridden to `--color-text-muted: #8B93A0` ≈ **2.9:1 — fails**; it is used on every current KPI subtitle. Eliminating Bootstrap classes from the dashboard fixes this class of bug at the root.
- Verify `--color-warning: #C99200` on `--color-warning-bg` and the utilization bar's amber/red states.

**Non-color status encoding**
- Blockchain: dot + **text label** ("Connected" / "Not configured"), never a bare dot.
- Notifications: distinct icon per severity, not a single `Bell` in a colored circle.
- Charts: pattern or direct labeling in addition to hue; never "the green slice".
- Utilization bar: keep the numeric percentage adjacent at all times.

**Semantics**
- One `<h1>` ("Dashboard"); section titles `<h2>`; card titles `<h3>`. Fix the current h6→h2 inversion.
- Each band as `<section aria-labelledby="...">`.
- KPI values as `<p>`, not headings — a number is not a heading.

**Keyboard and focus**
- Timeline filter pills: `aria-pressed={active}` and a visible `focus-visible` ring (currently only a color swap).
- Contract-address copy button: `aria-label="Copy contract address"` + an `aria-live="polite"` "Copied" confirmation.
- Every icon-only control gets `aria-label`.
- Clickable KPI/Action cards must be real `<button>`s — `StatisticsCard` already does this correctly when `onClick` is passed; follow that pattern.
- Remove `<a href="#">`; use `<Link>` or `<button>`.
- Verify tab order top-to-bottom and that focus rings are visible against every card background.

**Screen readers**
- `aria-live="polite"` on each async region so refreshed figures are announced.
- `aria-busy="true"` on loading skeletons.
- Each chart: `role="img"` + a summarizing `aria-label` ("Allocation by department: Health ₱2.4M, Education ₱1.8M, …"), plus a visually-hidden `<table>` fallback for the analytics charts.
- Currency: `aria-label="2.4 million pesos"` where the visual form is abbreviated.
- Empty and error states must be text, not icon-only.

**Motion**
- The repo already respects `prefers-reduced-motion` (commit `08587ee`). The `animate-pulse` dot in `StatusBadge` and any chart entry animation must honor it — set Recharts `isAnimationActive={false}` under reduced motion.

---

## 10. Visual Design Recommendations

**Preserve the existing identity.** The token block at `index.css:5-92` — institutional navy `#1B3A5C`, gold accent `#D4A843`, muted semantics — is exactly right for a government financial system. The problem is not the design system; it is that the dashboard does not use it.

- **Typography.** Delete every Bootstrap type class from the dashboard (`display-4`, `fw-bold`, `small`, `text-muted`, `fs-6`). KPI values at `--font-size-2xl` (1.5rem) semibold; section headings at `--font-size-lg`; labels at `--font-size-sm`; captions at `--font-size-xs`. Tabular numerals (`font-variant-numeric: tabular-nums`) on all currency so digits align across cards.
- **Spacing.** `--space-6` (1.5rem) between cards, `--space-8` (2rem) between bands, `--space-5`/`--space-6` card padding. One rhythm, no ad-hoc `mb-3`/`me-3` Bootstrap margins.
- **Cards.** Keep `components/ui/Card` as-is (`rounded-2xl`, `border-slate-200/90`, `shadow-sm`). Do not introduce a second card style. Note the existing `rounded-2xl` (16px) exceeds `--radius-xl` (12px) — a pre-existing inconsistency worth reconciling later, but out of scope here.
- **Color.** Financial values in `--color-text-primary` — money is not decoration. Reserve semantic color for state: success for healthy utilization, warning ≥70%, error ≥90% (thresholds already implemented in `BudgetSummary`). Replace all hardcoded chart hex with a token-derived ramp. Replace the timeline's `bg-indigo-600` active pill with `--color-primary`.
- **Icons.** `lucide-react` only, 16px inline / 20px in KPI badges. Keep the established mapping (`Landmark` allocations, `FileText` documents, `ScrollText` audit, `Link2` blockchain).
- **Charts.** Horizontal bars for categorical comparisons. No legend for single-series. No gridlines beyond a light X axis. Tooltips with full `formatCurrency`; axes with abbreviated (`₱2.4M`) values. No pie unless the parts genuinely sum to a meaningful whole — and even then, prefer bars.
- **Borders / shadows / radius.** `--shadow-sm` at rest, `--shadow-md` on hover for interactive cards only. Static cards must not have hover states — hover affordance without a click target is a lie.

---

## 11. Implementation Plan

Ten phases, each independently shippable and independently revertable. **Phases A, B, C, E, F, G, H, I require no backend change whatsoever.**

---

### Phase A — Dashboard architecture cleanup
**Objective:** Convert `Dashboard.tsx` to the app's standard data layer and strip Bootstrap, changing *no* content or ordering yet. A pure-plumbing commit whose diff can be verified as visually neutral.

- **Files:** `pages/Dashboard.tsx`; new `hooks/useDashboard.ts`; extend `services/dashboardService.ts`.
- **Frontend:** Add `getStats/getCharts/getNotifications/getBlockchainStatus` to `dashboardService.ts` (mirroring the existing `getTimeline`). Create `useDashboardStats`, `useDashboardCharts`, `useDashboardNotifications` React Query hooks; reuse the existing `useBlockchainStatus`. Replace the four `useState`/`useEffect` triples. Replace every Bootstrap class with Tailwind/token equivalents. Add optional-chaining guards (H3). Remove dead `getStatusVariant`, `truncateText`, local `formatNumber` (L1, L4). Extract `DashboardSection` and `DashboardStateBoundary` (one shared loading/error/empty renderer, fixing H2).
- **API dependencies:** none — identical endpoints, identical contracts.
- **Risk:** **Low.**
- **Validation:** `npm run typecheck` clean; `npm test` green; the page renders identically; DevTools shows one request per endpoint; a forced 500 shows one error with a working Retry.

---

### Phase B — Financial KPI section
**Objective:** Replace the user KPI row with the four real financial KPIs. **Kills the hardcoded `0`.**

- **Files:** `pages/Dashboard.tsx`; new `components/dashboard/DashboardHeader.tsx`; reuse `StatisticsCard`, `useRemainingBudget`, `useAllocationStatistics`, `useAllocationOptions`.
- **Frontend:** Page header with `<h1>`, greeting, `RoleBadge`, fiscal-year `Select` (default = `isActive` year), last-updated, Refresh. Four KPI cards through `formatCurrency`. Skeleton loading. Fiscal-year state flows to all financial queries.
- **API dependencies:** `GET /allocations/remaining-budget`, `GET /allocations/statistics` — **both already exist and are already in use**.
- **Risk:** **Low.**
- **Validation:** No hardcoded numeral remains in the file; every figure traceable to an API field; values match `/budget-allocation/allocations/dashboard` for the same fiscal year; switching the year re-fetches; empty DB shows ₱0.00, not `NaN`.

---

### Phase C — Budget utilization + Action Required
**Objective:** Make utilization immediately legible and tell the user what needs doing.

- **Files:** `pages/Dashboard.tsx`; new `components/dashboard/ActionRequiredPanel.tsx`; extend `components/allocations/BudgetSummary.tsx` (additive props only — `AllocationDashboard.tsx` must keep working unchanged).
- **Frontend:** `<BudgetSummary>` on the dashboard; segmented allocated/remaining bar; explicit "approved allocations only" caption. Action panel from `useAllocationStatistics` with deep links; zero-count rows hidden; genuine all-clear empty state; approval rows gated on `hasRole(ADMINISTRATOR, TREASURER)`.
- **API dependencies:** none new.
- **Risk:** **Low–Medium** — `BudgetSummary` is shared; changes must be strictly additive.
- **Validation:** `AllocationDashboard` visually unchanged; every action link lands on a correctly pre-filtered list; a Budget Officer does not see approve-only actions; utilization threshold colors flip correctly at 70% and 90%.

---

### Phase D — Financial analytics *(the only phase with backend work)*
**Objective:** Allocation by Department and by Category.

- **Files:** *Backend* — `repositories/allocationRepository.js` (add `groupByDimension`), `services/allocationService.js` (`getAllocationBreakdown`), `controllers/allocationController.js`, `routes/allocationRoutes.js` (one new `GET /breakdown`), `validators/allocationValidator.js`, plus a service test. *Frontend* — `services/allocationService.ts`, `hooks/useAllocations.ts`, new `components/dashboard/AllocationBreakdownChart.tsx`.
- **Frontend:** Horizontal bar charts, top 8 + "Other", token colors, no legend, `formatCurrency` tooltips, `role="img"` + visually-hidden table, empty and error states.
- **API dependencies:** **New additive endpoint** `GET /api/allocations/breakdown?dimension=department|category&fiscalYearId=`, reusing the existing `authenticate` → `authorize` → `validateRequest` chain. **No schema change. No existing endpoint modified.**
- **Risk:** **Medium** — the only phase touching backend files.
- **Validation:** Breakdown sums equal `totalAllocated` from `/allocations/statistics` for the same scope; RBAC matches sibling allocation routes; existing allocation tests still pass; skipping this phase leaves Phases A–C, E–J fully functional.

---

### Phase E — Notifications
**Objective:** Actionable notifications; remove the fabricated health claim.

- **Files:** `pages/Dashboard.tsx`; new `components/dashboard/NotificationPanel.tsx`; optionally `backend/services/dashboardService.js`.
- **Frontend:** Type→icon+link mapping; stable keys; `line-clamp-2`; real "View All" (to `/audit` until a notifications page exists — or remove the link entirely rather than ship a dead one).
- **API dependencies:** none required. *Optional backend:* add `actionPath` per notification and make "System Status" conditional on real blockchain/anchor signals rather than unconditional.
- **Risk:** **Low** (frontend-only) / **Low–Medium** (with the optional backend tweak).
- **Validation:** Every notification either links somewhere or is explicitly informational; no unconditional success claim; empty state present; severity distinguishable in greyscale.

---

### Phase F — Activity feed refinements
**Objective:** Human-readable labels; eliminate nested scrolling.

- **Files:** `components/dashboard/FinancialActivityTimeline.tsx`; possibly `constants/auditActions.ts`.
- **Frontend:** `AUDIT_ACTION_LABELS[entry.action] ?? entry.label`; remove `max-h-96 overflow-y-auto`; `limit={8}` on the dashboard; relative timestamps with absolute in `title`; `aria-pressed` on filter pills; token colors; "View All →" to `/audit`.
- **API dependencies:** none — `entry.action` is already in the payload.
- **Risk:** **Low.**
- **Validation:** `DOCUMENT_ANCHOR_RETRY` renders as "Document anchor retried" on the dashboard **and still renders raw in `/audit`**; existing `FinancialActivityTimeline.test.tsx` passes or is updated deliberately; only one scrollbar on the page; kind filters still work.

---

### Phase G — Blockchain status redesign
**Objective:** Compact, honest, non-dominant.

- **Files:** new `components/dashboard/BlockchainStatusStrip.tsx`; `pages/Dashboard.tsx`.
- **Frontend:** Single-row strip; surface the discarded `recordCount`/`confirmedCount`/`pendingCount`/`failedCount`; three-state sync messaging (H6); truncated address + copy + explorer link; "View Ledger →"; switch to the cached `useBlockchainStatus()`.
- **API dependencies:** none — every field is already in the existing payload.
- **Risk:** **Low.**
- **Validation:** Connected-with-zero-records shows "No records anchored yet", never "Never"; unconfigured shows the backend's own message; no horizontal overflow at 360px; copy button announces success.

---

### Phase H — Administrative statistics demotion
**Objective:** Move admin content below financial content; one useful chart instead of two.

- **Files:** `pages/Dashboard.tsx`; new `components/dashboard/AdminStatsSection.tsx`.
- **Frontend:** Collapsible section, expanded by default only for Administrator. Compact stat strip for the nine counts. Users by Role as a horizontal bar with an explicit role→token-color map (fixes the positional-color bug). Drop the Users by Status chart. Keep master-data counts as text links.
- **API dependencies:** none — same `/dashboard/stats` and `/dashboard/charts`.
- **Risk:** **Low.**
- **Validation:** No user statistic appears above the fold; all nine counts still reachable; role colors stable when a role has zero users; a Treasurer sees the section collapsed, not missing.

---

### Phase I — Responsive and accessibility polish
**Objective:** Land §8 and §9 in full.

- **Files:** all dashboard components; possibly `index.css`.
- **Frontend:** Breakpoint corrections (`md:` → `lg:` for the two-column bands); mobile KPI row treatment; `truncate`/`break-all` on long strings; contrast fixes; heading hierarchy; `aria-live`/`aria-busy`; chart `role="img"` + table fallbacks; focus rings; `prefers-reduced-motion` on charts and the pulsing dot.
- **API dependencies:** none.
- **Risk:** **Low.**
- **Validation:** No horizontal scroll at 360/768/1024/1440px with the sidebar both states; axe DevTools reports zero critical/serious issues; full keyboard traversal with visible focus; VoiceOver/NVDA announces every KPI, chart summary, and status; automated contrast check passes AA.

---

### Phase J — Final QA and regression
**Objective:** Prove nothing broke.

- **Files:** new `pages/__tests__/Dashboard.test.tsx`; updates to existing dashboard tests.
- **Work:** Component tests for loading/error/empty/populated across all sections; a guard test asserting no hardcoded financial literals; manual four-role walkthrough; full `npm test` + `npm run typecheck` in both `apps/frontend` and `apps/backend`; verify all legacy route aliases still redirect.
- **Risk:** **Low.**
- **Validation:** §12 checklist fully green.

---

## 12. Acceptance Criteria

**Preservation**
- [ ] `/dashboard` and every existing route still resolve; legacy aliases still redirect
- [ ] Authentication unchanged — login, refresh, logout, protected redirects
- [ ] RBAC unchanged — `ProtectedRoute` role gates and backend `authorize()` behave identically
- [ ] Every pre-existing API contract unchanged; only additive endpoints introduced (Phase D)
- [ ] No dashboard API integration removed — stats, charts, notifications, blockchain, timeline all still consumed
- [ ] `AllocationDashboard`, `BudgetAllocationOverview`, `BlockchainLedger`, `AuditLogs`, `DocumentList` all unaffected
- [ ] No Prisma schema change; no migration added
- [ ] No new npm dependency
- [ ] `npm test` and `npm run typecheck` pass in `apps/frontend` **and** `apps/backend`

**Data integrity**
- [ ] **No hardcoded financial or workflow value anywhere** — the `0` at `Dashboard.tsx:215` is gone
- [ ] Every figure traceable to a named API field
- [ ] No fabricated production data; no invented metric
- [ ] Obligated / Spent are **absent** (or explicitly labeled "not yet tracked"), never fabricated
- [ ] Dashboard KPIs reconcile exactly with `/budget-allocation/allocations/dashboard` for the same fiscal year

**Information architecture**
- [ ] Financial information occupies the first screenful; currency visible without scrolling
- [ ] Utilization rate legible at a glance
- [ ] "What needs my attention?" answered above the fold
- [ ] Administrative statistics sit below financial content
- [ ] Blockchain occupies one compact strip, not a full row

**Responsive**
- [ ] Desktop / laptop / tablet / mobile verified, sidebar expanded and collapsed
- [ ] **No horizontal overflow at any breakpoint** (contract address specifically checked at 360px)
- [ ] Charts, tables, and the activity feed all reflow without clipping

**Quality**
- [ ] Charts carry useful labels; no redundant legend; every chart answers a business question
- [ ] Loading states are skeletons, not spinners; no significant layout shift
- [ ] Error states appear **once** per failure with a working Retry
- [ ] Empty states exist for every data-driven section
- [ ] **No nested scrolling** — one scroll context per page
- [ ] Blockchain status is unambiguous; "Connected + Last Sync: Never" cannot occur
- [ ] Technical event names are human-readable on the dashboard and unchanged in `/audit`
- [ ] Bootstrap classes eliminated from dashboard components; design tokens used throughout

**Accessibility**
- [ ] WCAG 2.2 AA contrast on all text and UI components
- [ ] Single `<h1>`, correct heading hierarchy
- [ ] Full keyboard operability with visible focus
- [ ] No status conveyed by color alone
- [ ] Icon-only buttons labeled; charts have text alternatives
- [ ] Async regions announced via `aria-live`
- [ ] `prefers-reduced-motion` honored

---

## 13. Role-Based Dashboard Analysis

**Can the architecture support it?** Yes, cleanly, at the section level. `useAuth().hasRole(...roles)` and `ROLES` are already available client-side, and `AllocationDashboard.tsx:31` already precedents role-conditional rendering. What is **not** cleanly supported is four separate dashboard *routes* — `/dashboard` is a single unguarded route inside `DashboardLayout`, and the backend authorizes all dashboard endpoints for all four roles uniformly.

**Recommendation:** do **not** build role-specific dashboards now. Build one dashboard whose *sections* are role-aware (default expansion, action visibility, section ordering). That is a `hasRole()` conditional, not an architecture change, and it keeps a single component under test. Priorities documented now so the layout accommodates them later:

| Role | Should prioritize | Available today? |
|---|---|---|
| **Administrator** | System health, users, approvals, audit activity, blockchain integrity | ✅ fully |
| **Budget Officer** | Total/remaining budget, utilization, allocation by department & category, drafts, rejected | ✅ except breakdowns (Phase D) |
| **Treasurer** | Fund sources, approvals awaiting decision, releases, obligations, expenses | ⚠️ **partially** — approvals ✅, fund-source counts ✅; **obligations and expenses have no data model** |
| **Auditor** | Audit trail, document activity, blockchain records, verification status | ✅ via `/audit-logs/summary`, `/dashboard/timeline`, `/dashboard/blockchain` |

The Treasurer view is the one that cannot be fully realized — the same gap identified in §7.3. It becomes buildable when Expense Monitoring (Phase 4) lands.

---

## 14. Summary

This plan asks for: frontend information architecture, layout, visualization, and component work across nine phases; **one additive backend endpoint** in a single optional phase; no rewrite, no framework change, no schema change, no broken contract, and the removal of the two hardcoded values currently misreporting system state.

**Status: READY FOR IMPLEMENTATION** — awaiting explicit instruction before any code is modified.
