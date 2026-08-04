# Frontend Improvement Roadmap

Prioritized analysis of `apps/frontend` against `docs/DESIGN_SYSTEM.md`,
`docs/COMPONENT_LIBRARY.md`, and `docs/PROJECT_KNOWLEDGE.md`. Analysis only —
no code changes in this document.

## P0 — Correctness (broken/dead behavior)

| # | Finding | Where |
|---|---------|-------|
| 0.1 | **Bootstrap dropdowns are dead**: `data-bs-toggle="dropdown"` used, but no Bootstrap JS bundle is loaded → the "⋯" menus on Dashboard do nothing. Either wire real menus (Radix `DropdownMenu` is already a dep) or remove. | `pages/Dashboard.tsx:350,421,532` |
| 0.2 | **Placeholder links**: 8× `href="#"` ("View Details", "Export Data", "View All") navigate nowhere. | `pages/Dashboard.tsx` |
| 0.3 | **"Pending Approvals" card is hard-coded `0`** with dead TODO comments, not wired to data. | `pages/Dashboard.tsx:217-238` |
| 0.4 | Docs specify *every business component supports loading/empty/error states*; Dashboard renders `blockchainStatus.connected` without a null guard when the error branch is skipped. | `pages/Dashboard.tsx:548-566` |

## P1 — Consistency & tech debt (biggest visual + maintainability wins)

### 1.1 Theme: two competing primary colors

Design tokens (`index.css`) define navy `#1B3A5C` + gold `#D4A843`, and the Login
page + Bootstrap `.btn-primary`/`.form-control` overrides use them — but
`Button.tsx`, `Modal.tsx`, `Pagination.tsx`, `Select.tsx`, `Avatar.tsx`, `Sidebar`
brand, and 100+ usages across all management/dialog components hard-code Tailwind
**indigo-600** (`#4f46e5`). Decide one primary; if navy wins, swap `indigo-*` for
token-backed classes (or map `--color-primary` and replace `bg-indigo-600` etc.).
This is the single most visible doc-vs-code violation of `DESIGN_SYSTEM.md`.

### 1.2 Two modal systems

`ui/Modal.tsx` (custom portal, z-9999, confirm pattern, used by UserList) vs.
`ui/Dialog.tsx` (Radix, used by allocation + management dialogs).
`COMPONENT_LIBRARY.md` defines one `Dialog` + one `ConfirmationDialog`.
Consolidate on one (Radix).

### 1.3 User module is off-pattern

`UserList.tsx` hand-rolls debounce, pagination, `<table>`, search input,
`formatDate`, and raw `api.get/delete` — all equivalents already exist
(`useListControls`, `ui/Table`, `ui/Pagination`, `ui/SearchInput`,
`utils/format.ts`, service/hook pattern). `UserForm`/`UserDetail` also use raw
`api` + `yup`, while every other module uses **zod** + services + React Query.
Migrate to the standard pattern.

### 1.4 Dashboard bypasses the data layer

5 independent `useState`/`useEffect` clusters + raw `apiClient`
(`Dashboard.tsx:38-121`) instead of the service→hook→component pattern used
everywhere else (e.g. `useAllocations`). Move `/dashboard/*` into a service +
`useQuery` hooks; also localizes `formatNumber`/`truncateText`/`getStatusVariant`/
`getTailwindColorFromType` instead of `utils/format.ts`/tokens.

### 1.5 Duplicated types

`FiscalYear` is defined in both `hooks/useFiscalYears.ts:5` and
`tables/FiscalYearTable.tsx:18`; only allocation has a home in `src/types/`.
Centralize domain types in `src/types/`.

### 1.6 Orphaned CSS

Half of `index.css` (`.badge*`, `.table`, `.dropdown-*`, `.modal-*`, `.page-link`,
`.list-group-item`) targets Bootstrap class names that components no longer use
(they use Tailwind/custom classes), so it's dead weight — while `.btn`/
`.form-control`/`.card`/`.sidebar*`/`.login*` are load-bearing. Audit and prune;
fix duplicate `box-sizing` blocks (lines 97 & 107) and the global `.card:hover`
shadow lift.

### 1.7 Variant/alias drift

`Button` accepts both `danger` and `destructive`; `Badge` double-maps role strings
AND semantic strings. Keep one canonical set of variants per
`COMPONENT_LIBRARY.md` (Badge: default/secondary/outline/success/warning/
destructive).

## P2 — Docs alignment, a11y, tests

- **2.1** Build the documented shared components that are currently inlined
  per-page: `EmptyState`, `ErrorState`, `ChartCard`/chart wrappers, `KPIGrid`,
  `ProgressBar`, `AvatarGroup`, `StatusBadge` conventions (docs:
  `DataDisplay.md`, `Business Components`). Dashboard chart code in
  `Dashboard.tsx` should live behind reusable chart-card components.
- **2.2** `COMPONENT_LIBRARY.md` Appendix A (shadcn/ui, TanStack Table, Framer
  Motion, Sonner, Zustand) is not used — that's fine (Radix + custom is a
  defensible stack), but the docs are stale. Decide: update docs to reflect
  reality, or adopt the stack. Otherwise `CLAUDE.md`/docs churn will keep
  misleading future work.
- **2.3** A11y: mobile sidebar backdrop is an `aria-hidden="true"` clickable div
  with no accessible name (`Sidebar.tsx:22-26`); make it a labelled button.
  `:focus-visible` global outline is already good; add
  `prefers-reduced-motion` for the CSS animations (`index.css:1377`).
- **2.4** Tests only cover allocation components; docs require
  rendering/interaction/a11y/loading/error tests per component. Prioritize `ui/`
  primitives (Button, Badge, Pagination) and a Dashboard/user smoke test.
- **2.5** Route hardening: `/users/*` are admin-guarded, but `/budget-allocation/*`
  routes are not role-restricted (only `canCreateAllocation` inline on one
  button). Consider centralizing permission checks via a `PermissionGuard`/
  `RoleGuard` as `COMPONENT_LIBRARY.md` defines.

## Suggested order

1. P0: 0.1–0.3 (broken UI)
2. P1: 1.1 (theme) → 1.2/1.3/1.4 (consolidate modals, migrate user + dashboard to
   service/React Query) → 1.5/1.6/1.7
3. P2: docs alignment, a11y, tests
