# BudgetChain — UX/UI Redesign Review Report

**Product:** BudgetChain — Permissioned Blockchain-Based Budget Allocation and Expense Monitoring System
**Scope:** `apps/frontend` (React 19, Vite 6, TypeScript, Tailwind CSS v4, Bootstrap 5.3 CSS-only, Radix primitives, React Hook Form + zod/yup, TanStack Query, recharts, lucide-react, react-router-dom 7)
**Role:** Principal Product Designer / UX Researcher / Senior Frontend Architect / Design System Expert
**Date:** August 2026
**Relationship to prior work:** This report refines, corrects, and extends `docs/UI_AUDIT_REPORT.md`. One claim in the earlier audit is corrected (see §7 — the Tooltip *does* expose `role="tooltip"`).

---

## 1. Executive Summary

BudgetChain is a functionally complete, role-driven government financial system that already exceeds typical capstone quality. Workflows are thoughtfully guarded (draft → approval → anchoring), validation is serious, and the new `DocumentTable` / `RejectAllocationDialog` / centralized constants are genuinely good. The product *works*.

The gap is not capability — it is **craft and consistency**. The interface is currently three design systems coexisting in one DOM:

1. **Legacy Bootstrap-skin layer** (`index.css` re-skins Bootstrap classes with a navy/gold token set) used by Dashboard, Profile, Login, `ui/Alert`, `ui/Spinner`, and the sidebar/topnav shell.
2. **A comprehensive but under-used CSS-variable token system** (`--color-primary: #1B3A5C`, gold accent, semantic colors, spacing/radius/type scales) defined in `index.css:5-95` and consumed only by the Bootstrap-skin CSS and layout.
3. **A Tailwind `ui/*` primitive set** (indigo-600 primary, slate-200/400/600/900 neutrals, emerald/amber/red semantics) that never references the brand tokens and sometimes hardcodes hex colors.

Because of this, a user navigating from the navy Sidebar to an indigo `Button` sees two different brands. The primary opportunity is to **unify on one design system** (the CSS tokens already defined), **make the shared primitives the single source of truth for every page**, and **standardize table/loading/stat/icon patterns** that are currently hand-rolled differently on each page.

**Headline verdict:** Strong product logic; inconsistent visual identity; several concrete accessibility and enterprise-polish defects. All fixes below are achievable without touching backend, Prisma, or contracts.

---

## 2. Overall Impression

| Dimension | Impression |
|---|---|
| First load | Clean, competent, mostly Tailwind-consistent in the newest pages (`BudgetAllocationOverview`, `AllocationDashboard`, `DocumentList`) |
| Navigation | Navy sidebar + indigo active states = dual-brand; works but doesn't feel like one product |
| Data pages | Strong table/empty/skeleton patterns in Document module; master-data pages regress to raw text loading + inline hand-drawn SVGs |
| Confidence | High — validation, RBAC gating, and error handling are unusually thorough for a capstone |
| Feel | "Engineer-designed with a designer's vocabulary" — tokens exist but are not wired through the primitives |

The app reads as a serious internal tool that needs one disciplined pass to feel like a Stripe/GitHub/Linear-class product rather than a well-executed academic prototype.

---

## 3. Strengths

1. **Consistent shared primitives exist and are used.** `ui/Button`, `ui/Badge`, `ui/Card`, `ui/Table`, `ui/Dialog`, `ui/Select`, `ui/DropdownMenu`, `ui/Pagination`, `ui/Skeleton`, `ui/Tooltip`, `ui/SearchInput`, `ui/SortableHeader` give ~80% of pages a coherent visual language (`apps/frontend/src/components/ui/`).
2. **A real token system is already authored.** Full color/typography/spacing/radius/shadow/transition scale in `index.css:5-95`. It just needs to be adopted by the primitives.
3. **Centralized, well-documented constants drive badge variants** (`constants/audit.ts`, `blockchainStatus.ts`, `documentStatus.ts`, `ledger.ts`, `currency.ts`). This is the correct foundation for status color consistency and is a model for the rest of the app.
4. **Role-aware actions are enforced consistently in UI** (e.g., `canArchiveDocument` in `components/documents/DocumentTable.tsx:30-34`, `RETRY_ROLES`, canEdit/canArchive gates in Allocation modules) — mirrors `docs/AUTHORIZATION.md`.
5. **Radix-based accessibility where it matters most**: dialogs (`ui/Dialog`, `RejectAllocationDialog`, `AllocationDetailsDialog`) implement proper `DialogTitle`/`DialogDescription`, focus management, and Escape handling.
6. **Document module is the reference implementation**: `DocumentTable` uses `TableHead`, `asChild` dropdown triggers, skeleton rows, `EmptyState`, page-size select, truncation tooltips, and aria-labels on row actions.
7. **Defensive UX**: deletion confirmations, reject-reason requirement with character counter (`RejectAllocationDialog.tsx`), pending-state loading props on buttons, error toasts wired through mutation hooks.
8. **Good mobile discipline in new pages**: `flex-col sm:flex-row` headers, responsive grids, horizontal table scroll, `<992px` sidebar drawer (`index.css:772-796`).

---

## 4. Weaknesses

1. **Three design systems in one DOM** — Bootstrap-skin CSS + CSS-token navy/gold + Tailwind indigo/slate primitives. See §8.
2. **Two palettes for the same product**: sidebar/topnav/legacy pages are navy (`--color-primary: #1B3A5C`) with gold accents; every `ui/Button variant="primary"` is indigo-600. Brand colors are defined but bypassed.
3. **Semantic table markup is inconsistent.** `DocumentTable` uses `TableHead`; `FiscalYearTable` puts `TableCell` (`<td>`) inside `TableHeader` (`components/tables/FiscalYearTable.tsx:90-107`) — headers are unreachable by screen readers there.
4. **Nested interactive elements**: `FiscalYearTable.tsx:153-160` renders a Radix `DropdownMenuTrigger` (a `<button>`) *wrapping* a `Button` (another `<button>`) without `asChild` → invalid nested buttons. `DocumentTable.tsx:201-210` does it correctly with `asChild`.
5. **Loading/empty/error states are inconsistent.** Master-data pages show raw text `Loading fiscal years...` (`pages/fiscal-years/FiscalYearManagement.tsx:115`); Document/Allocation modules use Skeletons, `EmptyState`, and page-level `PageSpinner`.
6. **Icons are hand-rolled in places.** Master-data stat cards use inline `<svg>` paths (`FundSourceManagement.tsx:126-181`, `FiscalYearManagement.tsx:143-197`) while the rest of the app uses lucide-react — including a garbled/incorrect delete-icon path (`FiscalYearTable.tsx:200`).
7. **Stat cards are copy-pasted per page** instead of using the existing `StatisticsCard` (`components/allocations/StatisticsCard.tsx`), and two of them display meaningless numbers: "Current Year" shows the last two digits of the year (`FiscalYearManagement.tsx:171-173`) and "Recently Added" counts rows on the current page (`FundSourceManagement.tsx:170-172`).
8. **Two dialog systems**: legacy custom `ui/Modal` (used by `UserList`) alongside Radix `ui/Dialog`. Both look similar, two code paths to maintain.
9. **Form stack is split**: most new forms use zod (`AllocationCreateDialog`), but `UserForm` uses yup and native `<select>` + emoji option labels (`UserForm.tsx:502-507`) — a different visual and validation system from Radix `Select` used elsewhere.
10. **`ui/Alert` and `ui/Spinner` are coupled to Bootstrap CSS** (classes `alert alert-*`, `btn-close`, `spinner-border`, `d-flex`) — removing Bootstrap breaks them; they also look different from Tailwind siblings.

---

## 5. UX Findings

1. **Good: guard-rails on destructive paths.** Delete dialogs state exactly what will be removed; reject requires a reason; archive is role-gated. Consistent with `docs/BUSINESS_RULES.md`.
2. **Good: progressive data interactions.** `useListControls` + `useSearchParams` keep filters/sort/pagination shareable and bookmarkable (`AllocationList`, `DocumentList`).
3. **Issue: feedback is toasting-only in some flows.** Mutations rely on `Toast`; however `ui/Toast` has no `aria-live`/`role="status"` region (see §7), so toasts are invisible to screen-reader users.
4. **Issue: `UserForm` posts via raw `api` + `useState`, not a mutation hook**, and routes success through `navigate('/users', { state: { toastMessage } })`. The rest of the app uses `useMutation` + `useToast`. Two success-reporting mechanisms.
5. **Issue: form validation promise mismatch.** The `UserForm` password-strength meter advertises "at least one uppercase/lowercase/number" (`UserForm.tsx:72-77`) but the schema only enforces `min(8)` (`UserForm.tsx:50-52`) — the UI over-promises.
6. **Issue: no global search or command palette.** For an enterprise system with 8+ master-data modules, a Cmd/Ctrl-K palette would materially improve navigation.
7. **Issue: detail views are modal-only.** Allocations/documents inspect through dialogs; a full-page detail route (with deep-linkable URL) is the enterprise norm.
8. **Issue: no empty-state for the Dashboard** and quick-access cards link to every module regardless of role permissions — non-permitted modules should hide or lock.

---

## 6. UI Findings

1. **Color**: dual palette (navy/gold tokens vs. indigo/slate Tailwind). Green/emerald, red, amber are broadly aligned; the *primary* is the divergence. Example: sidebar active = `bg-indigo-600` (`components/layout/Sidebar.tsx`) while `.btn-primary` token is navy (`index.css:184-188`).
2. **Typography**: consistent Inter (loaded in CSS vars + Tailwind default), but legacy pages rely on `var(--font-size-*)` while Tailwind pages use `text-sm/2xl` etc. Both are fine; they're just two systems.
3. **Surfaces**: the newer pages use `bg-slate-50/50` + `rounded-2xl border-slate-200/90 shadow-sm` cards; legacy pages use `.card` (token navy border). Slightly different radii/weights.
4. **Icons**: mostly lucide-react, but master-data pages hand-roll SVGs and Profile/Dashboard reference `bi bi-*` glyphs that render **blank** because `bootstrap-icons` CSS is not loaded.
5. **Motion**: `animate-in fade-in` (shadcn) and custom `animate-fade-in`/`animate-scale-up` keyframes (`index.css:1387-1393`) both exist — minor duplication.
6. **Data density**: tables are readable with adequate padding; `whitespace-nowrap` on codes/dates is well chosen. The `Font Mono` document codes in `DocumentTable.tsx:161` are a nice touch to extend elsewhere.
7. **Button styles**: `variant="accent"` (amber) exists in `ui/Button` but is barely used — underused brand device.

---

## 7. Accessibility Findings

1. **Correction to prior audit**: `ui/Tooltip` *does* set `role="tooltip"` (`components/ui/Tooltip.tsx:26`) and opens on `focus`/`blur` as well as hover. It is still incomplete: there is no `aria-describedby` wiring from the trigger, no `aria-hidden` while hidden, and no Escape-to-close.
2. **Toast is not announced.** `ui/Toast` renders a portal with no `role="status"`/`aria-live="polite"` (`components/ui/Toast.tsx`). Screen-reader users miss every mutation result.
3. **`<th scope>` is never used.** Even `DocumentTable` (which correctly uses `TableHead`) omits `scope="col"`. Fixing this is a one-liner in `ui/Table`.
4. **Nested buttons** in `FiscalYearTable.tsx:153-160` create invalid interactive nesting; keyboard/focus and SR behavior are undefined.
5. **Legend/grouping**: field error messages use `role="alert"` + `aria-describedby` correctly in `UserForm` and create dialogs — good. Keep this pattern.
6. **Color contrast**: indigo-600 on white (~4.9:1) and slate-500 on white (~4.6:1) pass AA for normal text; `text-slate-400` (muted, ~3.0:1) is used for secondary info/icons — borderline for small text, fails AA for `<3:1` normal. Audit all `text-slate-400` usages (e.g., row action icons `DocumentTable.tsx:206`, `--color-text-muted #8B93A0`).
7. **Keyboard focus**: `:focus-visible` outline is defined (`index.css:144-147`) but many interactive elements set `focus:ring-*` instead — the ring color (indigo-500/20) is very light; ensure it meets 3:1 against adjacent colors.
8. **Reduced motion**: `animate-fade-in`/`animate-scale-up` have no `prefers-reduced-motion` guard.
9. **`aria-label` quality**: `SortableHeader` (aria-label `Sort by X`) and row action buttons (aria-label `Actions for {code}`) are excellent examples — propagate to master-data tables which lack them.

---

## 8. Design System Findings

1. **Tokens exist but are bypassed by primitives.**
   - `index.css:5-95` defines the full brand system (navy primary, gold accent, semantic colors, type scale, spacing, radius, shadows, transitions).
   - It is consumed by the *Bootstrap-skin* CSS (`.btn-primary` → navy, `.badge-*`, `.table thead th`, `.alert-*`, `.card`, `.modal-content`, `.page-link`, layout `.sidebar/.topnav/.dashboard-*`, Login/Dashboard/Profile/Error page styles).
   - The Tailwind `ui/*` primitives use hardcoded `indigo-600/500`, `slate-*`, `emerald-*` etc. — **none reference the tokens**.
   - Net effect: the brand color you chose (`#1B3A5C`) only shows up in the sidebar, nav, and legacy screens. The primary action color users click all day is unplanned indigo.
2. **`ui/Badge` already maps semantic variants well** (`administrator→red`, `treasurer→blue`, `budget_officer→purple`, `auditor→amber`, plus success/danger/warning). But it maps to Tailwind colors, not the token palette — easy to re-point when tokens are adopted.
3. **Status color contracts are centralized** (constants → `*_VARIANTS`). This is the *right* pattern; it makes re-theming a constants edit.
4. **Spacing/radius inconsistencies**: primitives use `rounded-xl` (12px) and `rounded-2xl` (16px) while tokens define `--radius-xl: 12px` and `.card` uses `--radius-lg` (8px). Harmonize radius scale.
5. **Bootstrap is load-bearing, not decorative.** Because `ui/Alert` and `ui/Spinner`/`PageSpinner` use Bootstrap classes, and index.css re-skins ~25 Bootstrap component classes, Bootstrap removal must be preceded by refactoring those primitives. (Also: Bootstrap's global resets apply after Tailwind's, so some base element styles are Bootstrap's.)
6. **Duplicate dialog system** (`ui/Modal` legacy vs Radix `ui/Dialog`) doubles maintenance and risks divergent behavior.

---

## 9. Dashboard Review

Files: `pages/Dashboard.tsx` + `index.css:1058-1256`.

1. **Layout** (`welcome-section`, `quick-access-grid`, `dashboard-grid`) is solid and responsive.
2. **Fatal visual bug**: quick-access and activity icons use `bi bi-*` glyphs (`Dashboard.tsx:332,403,460,484`) but the `bootstrap-icons` stylesheet is **not imported** (only `bootstrap/dist/css/bootstrap.min.css`). Icons render as empty squares — this is the most visible defect in the app.
3. **Dead dropdowns**: `Dashboard.tsx:331,402,483` use `data-bs-toggle="dropdown"` which requires Bootstrap's JS bundle (not loaded) → menus never open.
4. **Charts**: recharts usage is functional; consider `responsiveContainer` padding and a `100%` height container, plus a consistent indigo/gold series that matches the token palette.
5. **Missing**: activity feed is static/limited; add `aria-live` on recent-activity and link cards to role-filtered destinations (non-permitted modules should lock, not 403 on click).
6. **Recommendation**: rebuild Dashboard on `ui/Card` + lucide icons + `StatisticsCard`, keep the existing CSS where it encodes good layout, and delete the `bi`/bootstrap JS usage.

---

## 10. Workflow Review

1. **Allocation lifecycle** (Draft → For Review → Approved/Rejected → Anchored) is the strongest flow: `AllocationList` orchestrates create/edit/details/delete/reject dialogs with correct role+status gating; `ApprovalHistory` and `AllocationDetailsCard` present the trail clearly.
2. **Document lifecycle** is well-gated (`canArchiveDocument`, view/download/archive) and download flows through a blob helper. Versioning (`VersionTable`) and verification (`FileVerificationCard`, `VerifyDocument` page) are complete.
3. **Master-data CRUD** pages are functional but visually uniform-by-accident (identical dialog-state objects, identical stat grids) — ripe for extraction into a generic `MasterDataPage` component.
4. **User management** (`UserForm`/`UserList`) is the *least consistent* module: yup, native selects, emoji statuses, legacy `ui/Modal`, manual `api` calls. Bring it onto the shared stack.
5. **Gaps**: no audit-read-only hint for `Auditor` beyond badge colors; no cross-module "pending my attention" inbox; `BudgetAllocationOverview` is a good hub but only links to master-data counts — consider surfacing pending-approval counts there for approver roles.
6. **Business-rule alignment** (see §12) is strong; no functional workflow gaps found.

---

## 11. Enterprise Readiness

| Area | Status |
|---|---|
| Authentication / RBAC | Strong (JWT, ProtectedRoute/PublicRoute, role gates) |
| Auditability | Strong (audit logs, blockchain ledger, approval history) |
| Data tables (sort/page/filter) | Strong in Document/Allocation; needs propagation to master-data |
| Error handling | Strong (error toasts, inline errors, retry states) |
| Accessibility | Below enterprise bar (toast, th scope, nested buttons, contrast) |
| Theming/brand | Weak — two palettes; no dark mode; tokens not adopted |
| i18n | None (out of scope for capstone, but note as future work) |
| Responsive | Good; verify touch targets ≥44px on dialogs/table actions |
| Testing | Good — hooks and components have Vitest suites (`__tests__`) |
| Performance | Good for scale (lazy routes, TanStack caching); recharts is the heaviest dep |

---

## 12. Business Rule Alignment

The UI faithfully reflects the rules catalog:

- Draft allocations editable only by submitter role; archive gated by role+status (matches `docs/BUSINESS_RULES.md` + `docs/AUTHORIZATION.md`).
- Rejection requires a stored reason and is recorded in approval history (`RejectAllocationDialog`).
- Budget validation caps amounts (`AllocationCreateDialog` zod `max 999999999999.99`, positive).
- Blockchain anchoring, ledger unification (`LEDGER_RECORD_TYPE`), and verification are surfaced as first-class UI, aligning with `docs/BLOCKCHAIN.md` and `docs/DOCUMENT_VERIFICATION.md`.
- **No rule violations were found.** Remaining work is presentation/consistency, not logic.

---

## 13. High-Priority Fixes (must-do)

1. **Fix blank Dashboard icons + dead dropdowns** — replace `bi bi-*` with lucide and remove `data-bs-toggle` dropdowns. Highest-visibility defect in the app.
2. **Eliminate nested `<button>`** in `FiscalYearTable.tsx:153-160` (use `asChild` on `DropdownMenuTrigger`).
3. **Semantic table headers** — use `TableHead` everywhere; add `scope="col"` in `ui/Table`. Stop using `TableCell` in `TableHeader`.
4. **Make `Toast` screen-reader visible** — add `role="status"` + `aria-live="polite"` to the toast viewport.
5. **Fix misleading master-data stats** ("Current Year" last-two-digits; "Recently Added" page count) or remove them.
6. **Replace hand-rolled SVGs** in master-data pages with lucide icons (including the broken trash icon path).
7. **Wire `ui/Button`, `Badge`, `Spinner`, `Alert`, `Tooltip`, `Table` to the CSS tokens** so the primary color is navy everywhere, not indigo.
8. **Unify `UserForm` onto the shared stack** (zod + Radix Select + mutation hooks + `useToast`).

---

## 14. Quick Wins (small effort, high impact)

1. Delete unused `StrictMode` import in `main.tsx:1`.
2. Add `scope="col"` to `TableHead` in `ui/Table` (one line, fixes all tables).
3. Add `role="status" aria-live="polite"` to `ui/Toast`.
4. Add `prefers-reduced-motion` guard around the custom animation utilities (`index.css:1387-1393`).
5. Raise `text-slate-400` secondary text/icon contrast to `text-slate-500` in row actions and muted labels.
6. Add `aria-label`s to master-data dropdown triggers and sortable headers (mirror `DocumentTable`/`SortableHeader`).
7. Add "rows per page" select to allocation/audit/ledger tables (pattern exists in `DocumentTable.tsx:243-261`).
8. Standardize master-data loading states to `Skeleton` rows / `EmptyState` (pattern exists in `DocumentTable.tsx:36-50,141-146`).
9. Extract the 4-stat-card grid into a shared `<StatsGrid>` using `StatisticsCard`.
10. Replace the local `StatusBadge` re-declared in `FiscalYearTable.tsx:53-62` with the shared badge/status components.

---

## 15. Long-Term Improvements (if time permits)

1. **Adopt the token system as the single source of truth** — generate Tailwind v4 `@theme` colors from `index.css:5-95` so primitives use `bg-primary`/`text-accent` instead of hardcoded hex/indigo.
2. **Decommission Bootstrap** — refactor `ui/Alert` and `ui/Spinner` onto Tailwind, then drop `bootstrap.min.css` and the ~25 re-skin rules in `index.css`. Keeps one layout/component engine.
3. **Migrate legacy `ui/Modal` to Radix `ui/Dialog`** and delete the duplicate.
4. **Extract a `MasterDataPage` generic** (stats grid + search + table + dialogs) reused by fiscal-years/fund-sources/departments/budget-categories/programs — removes ~5 near-identical 250-line files.
5. **Full-page detail routes** for allocations/documents (deep-linkable) with dialogs demoted to quick-actions.
6. **Command palette (Cmd/Ctrl-K)** for navigation and quick actions; role-aware.
7. **Pending-actions inbox** for approvers (counts of allocations awaiting review, failed anchors awaiting retry).
8. **Dark mode** via CSS variables — trivial once primitives use tokens.
9. **Empty/zero-confidence states** for Dashboard (no data yet, onboarding hints).

---

## 16. Suggested Design System

A single token layer, expressed as Tailwind v4 `@theme` so both utilities and components consume it.

- **Primary:** `--color-primary: #1B3A5C` (existing navy) → `primary`, with `primary-soft` (`--color-primary-bg`).
- **Accent:** `--color-accent: #D4A843` (existing gold) → reserved for highlights, "active"/"live" and fiscal-year active states, not default CTA.
- **Semantic:** success/warning/danger/info mapped to the existing `--color-*` pair sets (solid + soft bg).
- **Roles:** keep the `ROLES` → color map but re-point to tokens (administrator red, treasurer blue, budget_officer purple, auditor amber).
- **Neutrals:** slate-50…900 as the neutral ramp; keep it.
- **Type scale:** adopt the existing `--font-size-*` tokens as `text-*` scale.
- **Radii:** one scale — `rounded-md 6px`, `rounded-lg 8px`, `rounded-xl 12px`, `rounded-2xl 16px`; cards = `rounded-2xl`, inputs/buttons = `rounded-xl`, chips/badges = full.
- **Buttons:** 4 variants only — `primary` (navy), `secondary` (slate-800), `outline`, `ghost`; keep `danger` for destructive; drop or quarantine `accent`.
- **Motion:** one set of transitions using the existing `--transition-*` tokens; honor `prefers-reduced-motion`.

---

## 17. Suggested Component Standards

Codify by example — the codebase already contains the models:

1. **Table** — always `TableHead` + `scope="col"`, `SortableHeader` for sortable cols, `Skeleton` rows while loading, `EmptyState` when empty, `Pagination` + optional rows-per-page, row actions via `DropdownMenu` with `asChild` + `aria-label`. Model: `components/documents/DocumentTable.tsx`.
2. **Dialog** — Radix `ui/Dialog` only; always `DialogTitle` + `DialogDescription` (drives a11y wiring), icon-header pattern. Models: `RejectAllocationDialog`, `AllocationDetailsDialog`.
3. **Stat card** — use `StatisticsCard` (or the extracted `StatsGrid`); never hand-roll.
4. **Loading** — `PageSpinner`/`Skeleton` only; no raw `Loading...` text.
5. **Forms** — zod + RHF + Radix `Select`; no native selects, no emoji options; errors with `role="alert"` + `aria-describedby`.
6. **Icons** — lucide-react only (drop inline SVGs and `bi` glyphs).
7. **Status badges** — always through `ui/Badge` using constants-driven variants; delete local re-declarations.
8. **Success feedback** — `useToast` (once it's live-region-enabled); never `navigate(state.toastMessage)`.
9. **Tooltip** — keep `role="tooltip"`, add `aria-describedby` on trigger + Escape dismiss + `aria-hidden` when off.

---

## 18. Suggested Page Redesigns

1. **Dashboard** — rebuild on `ui/Card`/lucide/`StatisticsCard`; kill `bi` + Bootstrap JS; recharts with token palette; role-filtered quick-access.
2. **Master-data pages (×5)** — replace raw-text loading, hand-rolled SVG stats, and per-page dialog-state boilerplate with the `MasterDataPage` generic (§15.4).
3. **UserForm/UserList** — migrate to zod/Radix/`useToast`; native selects → Radix; emoji statuses → `ui/Badge`.
4. **Login** — already strong (split-panel, gradient, zod). Unify input styles with `rounded-xl` and wire to `ui/Button`; ensure the left panel gradient uses the navy token palette (it does).
5. **VerifyDocument** — clean standalone page; standardize on `ui/Card` + `FileVerificationCard` (already present).
6. **Profile** — replace `bi` icons and legacy badge variants with lucide + `ui/Badge`; role badge currently falls back to gray because `accent`/`info` aren't mapped in `ui/Badge`.

---

## 19. Refactoring Roadmap

Ordered by dependency; each step is independently shippable and testable.

1. **Phase A — Correctness & a11y (this sprint)**
   - Dashboard icons + dropdowns; nested buttons; `TableHead`/`scope`; Toast `aria-live`; stat-card bugs; lucide swap; unused import.
2. **Phase B — Token unification**
   - Add Tailwind `@theme` from existing CSS vars; re-point `Button`/`Badge`/`Spinner`/`Alert`/`Tooltip`/`Table`/`Select` colors to tokens; verify visual parity (navy primary everywhere).
3. **Phase C — Bootstrap decommission**
   - Rewrite `Alert` + `Spinner`/`PageSpinner` on Tailwind; remove `bootstrap.min.css` and stale re-skins; port remaining legacy page CSS (Login/Dashboard/Profile) to utilities or kept component CSS.
4. **Phase D — Consolidation**
   - Delete legacy `ui/Modal`; unify `UserForm`; extract `MasterDataPage` generic + `StatsGrid`.
5. **Phase E — Enterprise polish**
   - Full-page detail routes, command palette, approver inbox, dark mode, reduced-motion guard, contrast pass on `slate-400`.
6. **Phase F — QA sign-off**
   - Vitest suite updates for changed components; `npm test`, `npm run lint`, `npm run typecheck` green; manual a11y pass with NVDA/VoiceOver.

---

## 20. Final Score

| Dimension | Score (1–10) | Rationale |
|---|---|---|
| Visual Design | 6 | Coherent in newest pages; dual-brand (navy vs indigo) and blank icons drag it down |
| UX | 7 | Guarded, sensible workflows; toasts not announced, no detail routes/command palette |
| Accessibility | 6 | Good Radix dialogs; fails on toast announcements, `th scope`, nested buttons, slate-400 contrast |
| Performance | 7 | Lazy routes + caching; recharts is heavy; no bundle analysis run |
| Responsiveness | 7 | Solid grids/drawer/scroll; verify dialog touch targets |
| Consistency | 5 | Three styling systems; per-page hand-rolled stats/loading/icons; yup vs zod; two dialog systems |
| Enterprise Readiness | 7 | Strong auth/audit/RBAC/error handling; a11y + theming below bar |
| Business Workflow Support | 8 | Full allocation/document lifecycle correctly gated and surfaced |
| Overall Professionalism | 7 | Serious, well-engineered; inconsistent finish betrays the effort |
| **Overall Score** | **6.5 / 10** | A solid, functionally complete system one disciplined consistency pass from enterprise-grade |

---

*Companion artifacts: `docs/UI_AUDIT_REPORT.md` (original audit), `docs/AUTHORIZATION.md`, `docs/BUSINESS_RULES.md`, `docs/BLOCKCHAIN.md`, `docs/TECH_STACK.md`.*
