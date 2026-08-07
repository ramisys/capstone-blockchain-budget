# IMPLEMENTATION_PLAN.md

**Owner:** Project Manager (per `AGENTS.md`)
**Date:** 2026-08-07
**Inputs:** `docs/BUSINESS_RULES.md` (BR-001…BR-113), `docs/AUDIT_REPORT.md` (2026-08-07), `CLAUDE.md` (see §0.1), full repository analysis
**Constraint honoured:** no production code, schema, contract, or test was modified in producing this plan.

---

## 0. Preconditions and Findings About the Inputs Themselves

### 0.1 `CLAUDE.md` does not exist in the working tree

`AGENTS.md` §Project References requires all agents to consult `CLAUDE.md`, but the file was deleted in commit `7327ad3` ("docs: remove initial documentation for regeneration") and is currently staged as deleted. I read the last committed version (`e3b3aa3`). Its content is **stale and now actively misleading**:

| `CLAUDE.md` (last committed) | Repository reality |
|---|---|
| "Phase 3 Complete… Next Phase: Phase 4" | `docs/PHASES.md` claims Phases 1–5 complete |
| "`apps/contracts` — Placeholder for blockchain integration (future phases)" | Two deployed Solidity contracts + 22 Hardhat tests exist |
| "No linting configured by default" | Still true — this is the one accurate line |
| Roles: Administrator, Treasurer, BudgetOfficer, Auditor | Matches `schema.prisma`, but conflicts with the catalog's role model |

**A governance document that all agents must obey is missing.** This is a blocker for coordinated work and is scheduled as **H5**.

### 0.2 The audit is partly stale — verified against the current tree

Two audit findings could not be reproduced and must not be scheduled as work until re-verified:

| Audit claim | Verification result |
|---|---|
| §2 / §7-High-8: untracked migration `20260807000000_rescope_to_budget_execution` applied to the live DB | **Not present.** `apps/backend/prisma/migrations/` ends at `20260806000000_add_audit_logs`. `git status` shows no untracked migration. |
| §2: "applied to the live DB per `docs/MIGRATION_PLAN.md`" | **`docs/MIGRATION_PLAN.md` does not exist.** |
| §7-High-8 / BR-091: `expense_transactions` table and `payee` column | **No occurrence** of `expense_transactions`, `ExpenseTransaction`, or `payee` in `apps/`, `packages/`, `prisma/schema.prisma`, or any `.sql` migration. The only hit is `docs/EXPENSE_MONITORING.md:143`, a *proposed* schema in documentation. |

**Conclusion:** the "mid-re-scope schema drift" finding describes either a reverted change or a state that existed only in the auditor's working copy. It is re-issued as **H4 — verify live DB against `schema.prisma`** (a `prisma migrate status` / `prisma db pull` diff), not as a rework task. The BR-091 `payee` hazard is downgraded from "prospective 🚨" to a **design constraint** (**L3**) on documentation that has not been implemented.

Everything else in the audit was confirmed against the code:

- `BudgetLedger.sol:53` / `AuditLedger.sol:72` — `record(bytes32)` and `recordEvent(bytes32,string)` are owner-gated hash registries with **zero domain logic**. Confirmed by reading both contracts in full.
- `.env.example:42` — the documented `BLOCKCHAIN_PRIVATE_KEY` is Hardhat account #0 (`0xac0974…ff80`), a publicly known key. Confirmed.
- `blockchainService.js` — anchoring is fail-soft by design; failures persist a `Pending`/`Failed` record and the business write still commits. Confirmed at lines 23–30, 64–72, 104–107.
- `utils/amountUtils.js` — money is `Decimal(14,2)` normalised through `toNumber()` into JS `Number`. Confirmed; directly contradicts BR-110.
- `allocationService.js` — `softDelete` (l.254), `updateAllocation` (l.290) with ceiling re-validation, self-approval guard (l.435), non-atomic `validateBudgetCeiling` (l.769). Confirmed; BR-013 violation and TOCTOU race stand.
- `schema.prisma` — no Ordinance, Appropriation, Allotment, Obligation, ORS, RuleVersion, Realignment, or Compliance model. Confirmed.

### 0.3 Two additional gaps the audit did not report

1. **`AGENTS.md` folder-ownership paths are wrong.** It assigns `prisma/` to the Database Engineer and `tests/` to the QA Engineer. Neither path exists at the repo root — the real paths are `apps/backend/prisma/` and `apps/backend/tests/`. Ownership is therefore undefined for the two most rule-critical directories.
2. **The QA gate is unrunnable.** `AGENTS.md` mandates that the QA Engineer always run `npm test`, `npm run lint`, and `npm run typecheck`. Root `package.json` defines **no `lint` script anywhere in the monorepo**, `typecheck` exists **only** in `apps/frontend`, and root `npm test` runs backend + frontend but **omits `apps/contracts`** (`hardhat test`) entirely — meaning the only layer where Tier 1 rules can ever be enforced is outside the default test gate.

### 0.4 The published roadmap is not aligned to the catalog

`docs/PHASES.md` defines a 12-phase roadmap ending in AWS S3 storage, Redis caching, httpOnly cookies, and Playwright E2E. **None of Phases 6–12 implement a single Business Rule.** The roadmap plans infrastructure polish while 67 of 78 Tier 1 rules are unimplemented and the pre-orals gate sits at 10%. It must be re-based (**H6**). (`PHASES.md` §2.2 also claims a `Suspended` user status that `schema.prisma` does not define — minor doc drift, folded into H6.)

---

## 1. Gap Analysis: Repository vs. Business Rules Catalog

### 1.1 The structural problem, stated once

The catalog specifies an **Appropriation and Obligation** system in which the smart contract is the enforcement point. The repository implements a **Budget Allocation** system in which the database is the enforcement point and the chain is an optional hash log. These are not the same system at different levels of completeness — they are different domain models with inverted trust.

| Catalog concept | Repo concept | Relationship |
|---|---|---|
| Ordinance → Appropriation line → Allotment → Obligation (ORS) | `BudgetAllocation` (Draft→PendingApproval→Approved→Archived) | **No mapping.** The repo has one mutable entity where the catalog has four immutable ones. |
| `BUDGET_OFFICER`, `RULE_ADMIN`, department head, observer — on-chain, granted by transaction | `Administrator`, `Treasurer`, `BudgetOfficer`, `Auditor` — DB enum, JWT-carried | Name collision on one role only; no on-chain binding at all |
| Chain = sole source of truth; DB = projection (BR-100) | DB = truth; chain = fail-soft anchor | **Inverted** |
| Integer centavos, basis points (BR-110/111) | `Decimal(14,2)` → JS `Number` | **Contradicted** |
| Statutory rule registry, versioned by fiscal year (BR-060…068) | One hardcoded fiscal-year ceiling check | **Absent** |

Because the trust direction is inverted, **no amount of service-layer work can raise a Tier 1 rule above Tier 3.** This is why the plan front-loads contract work.

### 1.2 Pre-orals milestone gate (31 rules) — current state

Per catalog §13, the rules that must be *demonstrably enforced* for pre-orals are BR-001…008, BR-010…017, BR-030…034, BR-040…049.

| Band | Rules | Enforced at Tier 1 | Weak Tier 3 analog exists | Nothing at all |
|---|---|---|---|---|
| Identity & authorization | BR-001…008 (8) | 0 | BR-004, BR-007 | BR-001, 002, 003, 005, 006, 008 |
| Ordinance & appropriation | BR-010…017 (8) | 0 | BR-012, BR-014, BR-015 | BR-010, 011, 016, 017 — and **BR-013 is actively violated** |
| Allotment | BR-030…034 (5) | 0 | — | all 5 |
| Obligation | BR-040…049 (10) | 0 | BR-043, BR-045, BR-048, BR-049 (on the wrong entity) | BR-040, 041, 042, 044, 046, 047 |
| **Total** | **31** | **0** | **9 (all wrong tier or wrong entity)** | **22** |

The audit's 10% score for this band is confirmed and, if anything, generous: the 9 "analogs" enforce rules about `BudgetAllocation`, an entity that does not survive the re-scope.

### 1.3 Later-phase rules — current state

| Band | Rules | Status |
|---|---|---|
| Provincial review (BR-020…024) | 5 | Absent |
| Realignment / supplemental (BR-050…057) | 8 | Absent |
| Rule registry (BR-060…068) | 9 | Absent |
| Compliance evaluation (BR-070…075) | 6 | Absent (one hardcoded ceiling check ≠ BR-060) |
| Documents & verification (BR-080…084) | 5 | **BR-080 ✅, BR-082 ✅**; BR-081 ⚠ (supersession DB-only), BR-083 ❌, BR-084 ⚠ |
| Data privacy (BR-090…093) | 4 | **BR-090 ✅**; BR-092 ⚠, BR-093 ❌, BR-091 unconstrained |
| Ledger integrity (BR-100…105) | 6 | **BR-102 ✅**; BR-103 ⚠, BR-100/101/104 🚨, BR-105 ⚠ |
| Monetary (BR-110…113) | 4 | **BR-113 ✅**; BR-110 🚨, BR-111/112 ❌ |

**Defensible today (5 rules):** BR-080, BR-082, BR-090, BR-102, BR-113. These are the only claims the manuscript may currently make without qualification, and this plan protects them — the anchoring, dedup (`anchorUnlessExists`), and no-PII design are sound and must be carried forward, not rewritten.

---

## 2. Decisions Required Before Work Starts

These are escalations, not tasks. Work in Stage 1 cannot start until they are resolved.

### DECISION-1 — Trust direction (blocks everything)

Audit recommendation #3. Two options:

- **(A) Make the chain authoritative for the pre-orals domain.** Ordinance/appropriation/allotment/obligation writes go to the contract first; the DB becomes an event-indexed projection. Preserves every Tier 1 claim. Cost: the ledger half of the backend is rewritten.
- **(B) Downgrade the manuscript claim to "tamper-evident hash anchoring."** Zero contract work. The catalog's Tier 1 column becomes fiction and the integrity claim is abandoned.

**PM recommendation: (A), scoped to the 31 pre-orals rules only.** Option B forfeits the thesis contribution. Option A is scoped, not open-ended: the four ledger contracts in Stage 2–3 are small, and everything outside the pre-orals band (rule registry, compliance, realignment, provincial review) stays at Medium and can slip without touching the gate. **This plan is written assuming (A).**

### DECISION-2 — Fate of `BudgetAllocation`

The existing allocation module (service, repository, routes, frontend, 5 test files, 8 migrations) has no place in the catalog's domain. Options: (a) retire it once the appropriation ledger lands, (b) keep it as a Tier 4 planning view over appropriations, (c) keep both indefinitely. **PM recommendation: (b)** — it preserves the working dashboard/reporting UI without asserting it enforces anything. This decision determines whether C8 (BR-013 immutability remediation) is a rewrite or a deletion.

### DECISION-3 — BR-043 (certifier ≠ requester)

The catalog itself (§5 note) flags this as relaxable for a small partner LGU. Confirm with the partner office before Stage 3; the answer changes the `ObligationLedger` signature.

### DECISION-4 — Role mapping

The repo's `Treasurer` and `Auditor` have no catalog equivalent; the catalog's `RULE_ADMIN`, department head, and observer have no repo equivalent. A mapping must be ratified before C2, because BR-003 and BR-008 (the SoD conflict matrix) are defined over it.

---

## 3. Work Breakdown

Effort is in **engineer-days** for a capstone-scale team. Owners follow `AGENTS.md`.

### 3.1 CRITICAL — pre-orals gate; nothing ships without these

| ID | Work | Rules | Owner | Est. | Depends on |
|---|---|---|---|---|---|
| **C1** | Ratify DECISION-1…4. Produce a target architecture note: trust direction, contract inventory, event schema, projection boundary, role mapping, SoD conflict matrix. | — | System Architect + PM | 3 | — |
| **C2** | **`RoleRegistry.sol`** — on-chain identity→role binding; `grantRole`/`revokeRole` as recorded transactions carrying grantor + block timestamp; `RULE_ADMIN`⊥`BUDGET_OFFICER` enforced in-contract; SoD conflict matrix; observer addresses accepted by no state-changing function; revocation prospective-only (historical attribution preserved). Every other ledger contract calls into it. | BR-001…008 | Blockchain + Security | 8 | C1 |
| **C3** | **Monetary representation.** All amounts become `uint256` centavos on-chain and `BigInt` in DB/API; all rates `uint16` basis points; BR-112 rounding helper (ceilings floor-divide, floors ceil-divide). Retire `toNumber()` from every logic path — display-only conversion at the serialization boundary. **Must land before C4**, because it fixes the type of every amount in every subsequent contract and migration. | BR-110, 111, 112 | Backend + Database + Blockchain | 5 | C1 |
| **C4** | **`OrdinanceRegistry.sol` + `AppropriationLedger.sol`** — enacted-ordinance reference; (ordinance no., FY) uniqueness; amount > 0; **no update path at all** (BR-013); mandatory fund / implementing office / **PAP code** / expense class; `FiscalYearParameters` precondition; supplemental→annual reference; inoperative flag blocking new allotments and obligations. | BR-010…017 | Blockchain, then Backend | 10 | C2, C3 |
| **C5** | **`AllotmentLedger.sol`** — Σ allotments ≤ adjusted appropriation, checked in-function; amount > 0; exactly one appropriation line; append-only with a distinct withdrawal event referencing the original release; withdrawal ≤ unobligated portion. | BR-030…034 | Blockchain, then Backend | 7 | C4 |
| **C6** | **`ObligationLedger.sol`** — **BR-040 is the core invariant and the centrepiece of the demo**: Σ certified obligations ≤ Σ allotments, evaluated **at certification, not at request** (BR-041), so the second of two competing certifications reverts. Plus: only `REQUESTED` certifiable; certifier ≠ requester (per DECISION-3); ORS uniqueness; certifying identity + block timestamp; expense-class match; amount > 0; state machine with cancellation-as-record; requested obligations reserve nothing. | BR-040…049 | Blockchain, then Backend | 12 | C5 |
| **C7** | **Event indexer + projection rebuild.** Backend indexes contract events into MySQL; every projected row records block number, tx hash, **and log index**; `rebuild --from-block 0` must reproduce state byte-identical to incremental indexing (BR-104 acceptance test). Retire fail-soft anchoring on the ledger path — a ledger write that does not confirm on-chain **did not happen**. | BR-100, 103, 104 | Backend + Database | 10 | C4 (can start in parallel with C5) |
| **C8** | **Immutability remediation.** Per DECISION-2: remove `update`/`softDelete` from any entity the chain protects; corrections flow only through amending ordinance → new immutable line. Also fixes the false-positive tamper alarm where a legitimate Draft edit makes a valid anchor read as tampered. | BR-013 | Backend + Database | 5 | C4, DECISION-2 |
| **C9** | **Traceability matrix + Tier 1 revert tests.** Catalog §13: rule ID → enforcing contract function → proving test → FR reference. **Every Tier 1 rule needs a Hardhat test asserting the violating transaction reverts.** Rules without a test are claims, not controls — and an untested rule counts as unimplemented for pre-orals. Runs continuously alongside C2–C7, not after. | catalog §13 | QA + Documentation | 12 (spread) | C2 onward |

**Critical subtotal: ~72 engineer-days.**

### 3.2 HIGH — security, correctness, and the ability to demonstrate

| ID | Work | Rules / Audit | Owner | Est. | Depends on |
|---|---|---|---|---|---|
| **H1** | **Signer key hygiene.** `.env.example:42` documents a publicly known Hardhat key as `BLOCKCHAIN_PRIVATE_KEY`; if any deployment uses it, anyone can call `record()`/`recordEvent()` on the deployed contracts. Remove the literal, generate per-environment keys, add an owner-transfer / multi-sig path (both contracts fix `_owner` at construction with no recovery), and issue one address per role identity for C2. | BR-001, 006; audit High-6 | Security + Blockchain | 3 | — (start immediately) |
| **H2** | **DB role separation (BR-101).** Split `DATABASE_URL` into an app-write role and a read-only role over a dedicated `ledger` schema. The API must hold **no write privilege** on the projection. | BR-101 | Database | 4 | C7 |
| **H3** | **TOCTOU ceiling race.** `validateBudgetCeiling` (`allocationService.js:769`) reads an aggregate, then inserts in a *separate* transaction — two concurrent approvals can both pass and overspend. Move validation inside the same serializable transaction as the write. Interim fix while C4–C6 land; **skip if DECISION-2 retires the module.** | audit Med-10 | Backend | 2 | DECISION-2 |
| **H4** | **Verify live DB vs. `schema.prisma`** (`prisma migrate status`, `prisma db pull` diff). Confirm or close the audit's schema-drift finding, which is not reproducible in the working tree (§0.2). **Do this before any migration work in C3/C4** — a divergent live DB will break them. | audit High-8 | Database | 1 | — (start immediately) |
| **H5** | **Governance repair.** Regenerate `CLAUDE.md` (deleted, still referenced by `AGENTS.md`); correct `AGENTS.md` folder ownership to `apps/backend/prisma/` and `apps/backend/tests/`; add a root `lint` script, extend `typecheck` beyond the frontend, and **add `apps/contracts` (`hardhat test`) to root `npm test`** — the contract layer is where every Tier 1 rule will live and it is currently outside the QA gate. | §0.1, §0.3 | Documentation + QA | 3 | — (start immediately) |
| **H6** | **Re-base `docs/PHASES.md`** onto the catalog. Phases 6–12 (S3, Redis, cookies, Playwright, multi-step approvals) implement zero Business Rules; demote them below the Tier 1 work. Fix the `Suspended` status drift. | §0.4 | Documentation + PM | 2 | C1 |
| **H7** | **Demo UI for the new domain.** Ordinance, appropriation line, allotment release, obligation request + certification screens, wired to the C4–C6 APIs. Tier 4 — **guidance only, never enforcement**; every rejection must originate from a reverted transaction surfaced to the user, not from a client-side check. Without this the pre-orals gate cannot be *demonstrated*, only asserted. | BR-tier-4 | Frontend | 12 | C4, C5, C6 |

**High subtotal: ~27 engineer-days.**

### 3.3 MEDIUM — completes the catalog beyond the pre-orals gate

| ID | Work | Rules | Owner | Est. |
|---|---|---|---|---|
| **M1** | **`RuleRegistry.sol`** — no statutory rate/threshold/base/income-class as a literal anywhere in contract or app code; versions resolve by fiscal year; income-class version beats general version at equal effective year; legal citation + anchored basis-document hash; `RULE_ADMIN`-only writes; append-only; retroactive versions flagged (advisory) not blocked; **seeding via ordinary recorded amendment transactions — never constructor args or migration scripts** (BR-067 is easy to violate accidentally); `PERCENT_OF_BASE` vs `ABSOLUTE_FLOOR_PER_UNIT` shape validation. | BR-060…068 | Blockchain | 10 |
| **M2** | **Compliance evaluation** — each rule evaluated against the base measure named in *its own* definition; `MAX`/`MIN` comparator semantics; blocking reverts / advisory flags; ordinance with an unjustified advisory flag cannot be completed; justifications immutable with author + timestamp; results **recomputed, never cached as authoritative**. | BR-070…075 | Blockchain + Backend | 9 |
| **M3** | **Realignment & supplemental** — authorizing ordinance; source ≠ target; ≤ unobligated source balance; **statutory floor cannot be breached, re-checked on every movement** (BR-053 — this closes the gap an enactment-time-only validator leaves open and is worth highlighting in the defense); no cross-fund realignment; append-only with reversal-as-new-record; non-empty justification; full compliance re-evaluation after each movement. | BR-050…057 | Blockchain + Backend | 10 |
| **M4** | **Provincial review state machine** — defined transitions only, no arbitrary jumps; effective date + anchored review document per transition; advisory flag on release against a not-yet-operative ordinance; obligations on a line later declared inoperative retained and flagged, never deleted; partial inoperativeness scoped to identified lines. | BR-020…024 | Blockchain + Backend | 8 |
| **M5** | **BR-083 / BR-084.** A deleted off-chain blob must return a distinct `unavailable` verification result, not HTTP 404 — otherwise every lawful Data Privacy Act erasure registers as evidence of tampering and the verification metrics become meaningless. Add records-checked, mismatches-found, and duration to every verification run. | BR-083, 084 | Backend | 3 |
| **M6** | **Anchor document supersession on-chain.** Today `currentVersionId` / `replaceReason` are DB-only, so the supersession relationship BR-081 requires is not tamper-evident. | BR-081 | Backend + Blockchain | 3 |
| **M7** | **Tier 2 database constraints.** CHECK constraints for amount > 0 on every monetary column; `logIndex` column on all projected rows; no mutable balance column (already satisfied — protect it in review). | BR-102, 103; audit Med-11/12 | Database | 3 |
| **M8** | **Continuous divergence monitoring (BR-105).** Scheduled projection-vs-chain comparison. Divergence is reported as an **integrity failure and never reconciled by writing to the projection**. Extends the existing `blockchainScheduler`. | BR-105 | Backend | 4 |

**Medium subtotal: ~50 engineer-days.**

### 3.4 LOW — deferrable without risk to the gate or the thesis claim

| ID | Work | Rules | Owner | Est. |
|---|---|---|---|---|
| **L1** | Public explorer exposing appropriation / allotment / obligation aggregates with no payee references. | BR-093 | Frontend + Backend | 6 |
| **L2** | Erasure implementation — hard-delete the off-chain object; anchors remain (a digest is not personal data). Today "delete" is a soft-delete and the blob stays on disk. | BR-092 | Backend | 3 |
| **L3** | **Standing constraint, not a task:** no PII on chain; payees by opaque reference only. Blocks the `payee String @db.VarChar(200)` field proposed in `docs/EXPENSE_MONITORING.md:143` from ever reaching the ledger schema. Enforce in code review; add a CI grep. | BR-090, 091 | Security + Database | 1 |
| **L4** | Retire or re-label the legacy `BudgetAllocation` UI per DECISION-2. | — | Frontend | 4 |
| **L5** | Regenerate `docs/` (`ARCHITECTURE.md`, `SMART_CONTRACTS.md`, `DATABASE.md`, `API.md`, `BUDGET_ALLOCATION.md`, `EXPENSE_MONITORING.md`) against the delivered system. | — | Documentation | 5 |
| **L6** | Former `PHASES.md` 8–12: S3 driver, Redis, httpOnly cookies, multi-step approvals, Playwright E2E. **Zero Business Rules. Explicitly deferred past pre-orals.** | — | — | — |

**Low subtotal: ~19 engineer-days (excluding L6).**

---

## 4. Implementation Order

```
Stage 0  ──  C1 · H1 · H4 · H5              (unblock + stop the bleeding)
Stage 1  ──  C3 · C2                        (money types, then on-chain identity)
Stage 2  ──  C4 · H6                        (ordinance + appropriation)
Stage 3  ──  C5 → C6                        (allotment, then obligation — BR-040)
Stage 4  ──  C7 · H2 · C8                   (projection, rebuild, immutability)
Stage 5  ──  H7 · H3                        (demo path)
         ══  PRE-ORALS GATE ══
Stage 6  ──  M1 → M2 → M3 → M4              (registry → compliance → realignment → review)
Stage 7  ──  M5 · M6 · M7 · M8
Stage 8  ──  L1 · L2 · L4 · L5              (L3 runs from Stage 0 as a review rule)
             C9 runs continuously from Stage 1 to the gate.
```

### Rationale for the sequence

- **Stage 0 first, and in parallel.** H1 (public signer key), H4 (live-DB verification), and H5 (governance) are independent of every design decision, each ≤ 3 days, and each blocks or endangers later work. H4 in particular must precede any migration in C3/C4.
- **C3 before C2 and C4.** Monetary representation fixes the type of every amount in every contract signature, migration, and API payload. Changing it after the ledger contracts exist means re-deploying and re-migrating all of them.
- **C2 before C4.** Every ledger contract calls `RoleRegistry` for authorization. Building appropriation first would mean writing it twice.
- **C5 strictly before C6.** BR-040 — the core invariant and the demonstration centrepiece — is *defined* as Σ obligations ≤ Σ allotments. The obligation ledger cannot be tested before allotments exist.
- **C7 may run parallel to C5.** Indexing depends on event schemas from C4, not on the allotment or obligation logic.
- **H7 last before the gate.** UI against a moving contract API is rework. It is nonetheless a hard prerequisite: an enforced rule that cannot be shown reverting in a live demo does not pass a defense.
- **C9 continuously, never deferred.** Per catalog §13, an untested rule is a claim, not a control. Writing revert tests after the fact reliably discovers that a rule was never actually enforced — at the point where there is no schedule left to fix it.
- **Everything Medium sits after the gate**, by explicit design. M1–M4 are ~37 days; attempting them before pre-orals is the single most likely way to miss the gate.

### Timeline

| Stage | Days (sequential) | With 3 parallel engineers |
|---|---|---|
| 0 | 7 | ~3 |
| 1 | 13 | ~8 |
| 2 | 12 | ~10 |
| 3 | 19 | ~19 (C5→C6 is serial) |
| 4 | 19 | ~12 |
| 5 | 14 | ~12 |
| **To pre-orals gate** | **~84** | **~64 (≈13 weeks)** |
| 6–8 | ~69 | ~40 |

Includes C9 spread across Stages 1–5. Excludes L6.

---

## 5. Exit Criteria for the Pre-Orals Gate

The gate is met when **all** of the following hold:

1. All 31 milestone rules (BR-001…008, 010…017, 030…034, 040…049) are enforced **in contract code**, and each has a Hardhat test asserting that the violating transaction **reverts**.
2. The traceability matrix (catalog §13) is complete for those 31 rules: rule ID → contract function → test ID → FR reference.
3. `rebuild --from-block 0` produces state identical to incrementally indexed state (BR-104).
4. The API database role holds no write privilege on the `ledger` schema (BR-101), demonstrated by a failing write.
5. No monetary value is a float anywhere in the system (BR-110); no statutory constant is a literal (BR-060, once M1 lands).
6. Root `npm test` runs backend, frontend, **and contract** suites, all green.
7. A live demo shows two departments each requesting more than the remaining balance, the **first certification succeeding and the second reverting** — the BR-041/BR-049 scenario the catalog flags as the question a panel will ask.

---

## 6. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| DECISION-1 stalls | Blocks all Critical work | Force resolution in week 1; the plan assumes (A) so Stage 0 can proceed regardless |
| C4–C6 contract scope creeps toward the full catalog | Misses the gate | Hard scope: pre-orals band only. M1–M4 are post-gate and may slip. |
| BR-013 immutability is challenged as impractical | Re-litigation late in the project | The catalog anticipates this (§2 note): hold the line, document the amendment path. Settle in C1, not in Stage 4. |
| The 5 currently-defensible rules regress during the rewrite | Loses the only claims that survive today | Freeze `documentBlockchainService` verify semantics and `anchorUnlessExists`; add regression tests in H5. |
| Legacy allocation module and new ledger diverge | Two sources of truth — the exact failure the thesis critiques | DECISION-2 in week 1; C8 executes it |
| Live DB diverges from `schema.prisma` (audit High-8, unverified) | Breaks migrations in C3/C4 | H4 in Stage 0, before any migration |
| Solidity capacity is the bottleneck (C2, C4, C5, C6, M1–M4 all land on one owner) | Serial critical path | Backend engineer pairs on contracts from Stage 1; C7 and H7 absorb the other engineers |

---

## 7. Honest Position Statement

Compliance today is **14% overall, 10% on Tier 1, 10% on the pre-orals gate**. The audit's verdict is confirmed: the repository is a competent Express/Prisma/MySQL budget-allocation system with tamper-evident hash anchoring bolted on, not a permissioned blockchain system. The engineering already done is not wasted — the anchoring design, hash dedup, document verification, audit trail, RBAC, and test discipline are sound and are carried forward — but **none of it enforces a Tier 1 rule**, and no service-layer work ever will.

Until Stages 1–5 are delivered, the only claims defensible in the manuscript are: tamper-evident hash anchoring (BR-080/082), no PII on chain (BR-090), derived balances (BR-102), and PHP-only amounts (BR-113). Everything else in the catalog is a target specification, and this plan is the route to it.

*No code was modified in producing this plan.*
