# UI / UX Audit Report — BudgetChain Frontend

**Audit scope:** `apps/frontend` (React 19, Vite 6, TypeScript, Tailwind CSS 4, Bootstrap 5.3 CSS, Radix UI primitives)
**Audit method:** Static source-code review (no browser rendering, no performance instrumentation).
**Date:** August 2026

---

## 1. Executive Summary

The BudgetChain frontend is in **good overall shape**. The core application pages — allocation management, document management, audit logs, and the blockchain ledger — share a single, polished, internally consistent design system built on Tailwind's slate/indigo palette with lucide icons and Radix primitives. Empty states, loading skeletons, toasts, role-aware actions, and consistent form validation are present throughout.

The dominant weakness is a **second, parallel design system** (Bootstrap) that leaks into a handful of pages (`Dashboard`, `Profile`, master-data tables). Because Bootstrap's CSS is loaded but its **JavaScript is not**, and `bootstrap-icons` is **not installed**, those pages render blank icon glyphs and dead dropdown controls. The brand colors are also split between CSS variables (`#1B3A5C` navy) and Tailwind utilities (`indigo-600`), so the app does not speak with one visual voice.

---

## 2. Strengths

- **Consistent component library.** Shared primitives (`ui/Button`, `ui/Badge`, `ui/Card`, `ui/Table`, `ui/Pagination`, `ui/Dialog`, `ui/Select`, `ui/DropdownMenu`, `ui/Skeleton`, `ui/Toast`, `ui/Avatar`) are reused across allocations, documents, audit, and blockchain screens.
- **Strong data states.** Every list has loading skeletons, empty states, error handling, and pagination; mutations show inline spinner + disabled states and toasts.
- **Good accessibility fundamentals.** Radix Dialog/Select/DropdownMenu provide focus management and ARIA; icon-only buttons carry `aria-label`/`title`; progress bars expose `role="progressbar"` with `aria-valuenow/min/max`; empty-state icons use `aria-hidden`.
- **Role-aware UI.** Buttons/actions are gated by role (`canEditAllocation`, `canArchiveAllocation`, `WRITE_ROLES`/`RETRY_ROLES`), and the sidebar config is role-filtered.
- **Well-organized constants.** Statuses, labels, and badge variants are centralized (`constants/allocationStatus.ts`, `allocationApproval.ts`, `blockchainStatus.ts`, `audit.ts`) so color semantics stay consistent.
- **Thoughtful details.** Copy-to-clipboard hashes with feedback, truncated hash + block-explorer links, `formatCurrency`/`formatDateTime`, debounced search (400 ms), and `useListControls` gives consistent search/sort/page behavior everywhere.
- **Route-level code splitting** via `React.lazy` + Suspense + `PageSpinner`.

---

## 3. Weaknesses

- **Bootstrap leak (High).**
  - `src/index.css:2` imports `bootstrap/dist/css/bootstrap.min.css`, yet `bootstrap-icons` is **not** a dependency and `bi bi-*` icons in `pages/Dashboard.tsx:332,403,460,484` render as **blank glyphs**.
  - Bootstrap JS is **not** imported, so `data-bs-toggle="dropdown"` in `pages/Dashboard.tsx:331,402,483` does **nothing** — the "three-dot" card menus are dead controls.
  - `index.css` also ships custom `.btn-*`/`.form-control` overrides that no longer match the Button/Input components, a third button styling layer that is effectively dead code.
- **No unified design tokens (Medium).** `index.css` defines a navy brand (`--color-primary: #1B3A5C`) while `ui/Button.tsx`, `ui/Select.tsx`, `ui/Dialog.tsx`, and the sidebar use Tailwind `indigo-600/500`. The app therefore renders two "primary" blues.
- **Inconsistent tables (Medium).** Three table styles coexist: the shared `ui/Table` (allocations, documents, audit, blockchain), a raw `<table>` with Tailwind in `components/user/UserList.tsx`, and `components/tables/FiscalYearTable.tsx` which uses inline SVGs instead of lucide and renders its header with `TableCell` instead of `TableHead`.
- **Duplicate "code" badge variants (Low).** `components/user/Profile.tsx` passes `accent`/`info` to `Badge`, which does not support those variants (`ui/Badge.tsx`), so the role badge falls through to default gray.
- **Bootstrap mixed into Tailwind pages (Medium).** `pages/Dashboard.tsx` and `pages/Profile.tsx` mix Bootstrap utilities (`display-4`, `badge bg-success`, `btn btn-link`, `text-muted`) with the custom design system, breaking visual harmony and using classes that may not exist in the override stylesheet.
- **StrictMode imported but unused (Low).** `src/main.tsx` imports `StrictMode` but renders `<App />` without it.

---

## 4. Accessibility

**Score: 7 / 10**

Good:
- Radix primitives handle dialog/select/menu keyboard interaction and focus trapping.
- Focus rings defined for buttons, icon buttons, and table-row interactions (`focus:ring-2`).
- Color is never the only signal on status badges: they pair a dot + label text.

Gaps:
- `FiscalYearTable.tsx` header cells use `TableCell` instead of `TableHead`, losing `<th scope>` semantics.
- `ui/DropdownMenu` lacks focus-on-open/arrow-key navigation beyond what Radix provides by default (verify).
- `ui/Tooltip` is CSS-hover only — no keyboard/focus trigger, no ARIA (`role="tooltip"`), so truncated file names in `VersionTable` are inaccessible to keyboard/screen-reader users.
- `CopyableHash` copies silently on failure (catch swallows) — no feedback when the API is unavailable.
- The Dashboard's dead Bootstrap dropdowns fail both mouse and keyboard paths.
- No `lang` concerns are addressed (fine) but there is no focus-visible management on route change (`PageSpinner` swaps without focus reset to page title).

---

## 5. Responsiveness

**Score: 7 / 10**

Good:
- Tables wrapped in `overflow-x-auto` with `min-w-*` column hints (AuditLogs, Blockchain, Allocation, Version tables).
- Layout collapses below `lg`; sidebar becomes an off-canvas drawer with backdrop overlay on mobile (`DashboardLayout`).
- Grids adapt `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`; dialog footers stack (`flex-col-reverse sm:flex-row`).

Gaps:
- Dashboard and master-data pages carry wide Bootstrap classes and fixed paddings that do not stack cleanly on small screens.
- `DashboardLayout` switches at `<992px` (a tablet width), so tablets get the mobile drawer prematurely.
- The sidebar breakpoint mixes "collapsed icons" and "hidden + overlay" behaviors — needs a verified desktop/mobile test.
- No touch-target sizing pass for icon-only buttons (`w-8 h-8` may be under 44×44 px).

---

## 6. UX Findings

- **Navigation is well structured.** Grouped, role-aware sidebar with active states, badges, and collapsed-mode tooltips.
- **Workflow clarity is strong.** The allocation approval flow (Submit → Approve/Reject/Return, with `ApprovalHistory`) is explicit and understandable.
- **Verification UX is good.** "Verify Now"/"Retry Anchor" with inline loading and clear outcome messaging ("Hash matches stored record" vs. tampering warning) is genuinely useful.
- **Potential confusion:** "Archive" vs "Delete" labels differ by role in `AllocationDetailsDialog` for the same action; the confirmation copy in `ConfirmDeleteDialog` always says "Archive Allocation" even when an admin sees "Delete".
- **Empty states are friendly** and consistent (icon + title + description + optional action).
- **Minor:** `ActivityTimeline` renders raw `JSON.stringify(details)` in a `<pre>` — technically informative but ugly for end users.

---

## 7. High-Priority Improvements

1. **Remove the Bootstrap dependency and dead widgets.**
   - Drop `bootstrap/dist/css/bootstrap.min.css` from `src/index.css`.
   - Replace `bi bi-*` icons with lucide in `pages/Dashboard.tsx` (lines 332, 403, 460, 484).
   - Replace `data-bs-toggle="dropdown"` with the existing Radix `ui/DropdownMenu`.
   - Delete the `.btn-*`/Bootstrap overrides from `index.css` or move them into Tailwind tokens.
2. **Unify the primary brand color.** Decide navy (`#1B3A5C`) vs indigo and apply it in one place — either CSS variables consumed by Tailwind theme or one token file — then update `Button`, `Select`, `Dialog`, `Sidebar`, `index.css`.
3. **Migrate `UserList.tsx` to the shared `ui/Table`** and replace `FiscalYearTable.tsx` inline SVGs with lucide + fix its header to `TableHead`.
4. **Fix `Profile.tsx` badge variants** (`accent`/`info`) to map to real `Badge` variants.

---

## 8. Quick Wins

- Unused `StrictMode` import in `main.tsx` (restore wrapping or remove the import).
- Add `role="tooltip"` + focus handling to `ui/Tooltip`, or fall back to native `title`.
- Standardize Archive vs Delete label based on role in `ConfirmDeleteDialog`/`AllocationDetailsDialog`.
- Replace `JSON.stringify` preview in `ActivityTimeline` with key/value rows.
- Add a `lang="en"` attribute and focus page-title on route change in the layout.
- Remove `bootstrap-icons` icon class leftovers once converted (they render as empty boxes).
- Add `aria-label`s to all icon-only `ui/DropdownMenu` triggers (already done in BlockchainRecordTable; apply to Dashboard replacements).

---

## 9. Long-Term Recommendations

- **Introduce a real token layer** (primitive → semantic → component) and generate Tailwind theme from it, so `index.css` variables and utility classes can never drift apart.
- **Adopt a single table component** (extend `ui/Table`) for 100% of tables, with sort headers built in, replacing `SortableHeader` + raw-table variants.
- **Add visual regression testing** (e.g., Playwright screenshot diffs) so the two design systems can't silently diverge again.
- **Add keyboard-accessible tooltip and a toast announcer** (`role="status"`/`aria-live`) for screen readers.
- **Introduce an app-wide focus manager** for route changes and dialog open/close transitions.
- **Measure performance** (LCP, bundle size, recharts render cost on Dashboard) once visual regressions are locked in.

---

## 10. Overall Score

| Area | Score (1–10) |
|---|---|
| Visual consistency | 6 |
| Component quality | 8 |
| Accessibility | 7 |
| Responsiveness | 7 |
| UX / workflow clarity | 8 |
| Consistency with brand tokens | 5 |
| **Overall** | **7 / 10** |

Bottom line: a strong, coherent core with a high-quality shared component system, held back by a partially-ported Bootstrap layer (missing JS + icons) and a split brand palette. Fixing the Dashboard + token unification would move the score to 8–9.
