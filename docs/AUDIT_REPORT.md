# Business Rules Compliance Audit — BudgetChain Repository

**Date:** 2026-08-07
**Audit scope:** `apps/contracts`, `apps/backend`, `apps/frontend`, `packages/shared`, Prisma schema + migrations, tests, docs
**Audited against:** Business Rules Catalog (BR-001 … BR-113)

---

## 1. Executive Verdict

The repository implements a **conventional Express/Prisma/MySQL budget-allocation CRUD system with a fail-soft SHA-256 hash-anchoring layer**. It does **not** implement the permissioned blockchain system described in the Business Rules Catalog. The two Solidity contracts contain **zero business logic** — they are single-owner hash registries (`record(bytes32)` / `recordEvent(bytes32,string)`). None of the catalog's core domain objects exist anywhere in the code: **no Ordinance, no Appropriation line, no Allotment, no Obligation, no ORS, no Rule Registry, no Compliance evaluation, no Realignment, no provincial review state machine, no on-chain roles, no RULE_ADMIN, no role-conflict matrix.**

Every Tier 1 rule (67 of 78) is structurally unenforced on-chain. The catalog's milestone gate — BR-001 through BR-008, BR-010–017, BR-030–034, BR-040–049 (31 rules, all Tier 1) — is **0% enforced in the smart contract layer**. Only a handful of *analogous* Tier 3 service-layer checks exist (ceiling validation, self-approval prevention, JWT/RBAC), and they are enforcements of *different, weaker* rules than the ones in the catalog.

The blockchain here is an append-only hash log for the database, not the system of record.

---

## 2. Architecture Consistency

| Claim in Catalog | Reality in Repo | Verdict |
|---|---|---|
| Permissioned ledger; every write signed by role-bound identity (Tier 1) | Single anonymous backend signer key (`BLOCKCHAIN_PRIVATE_KEY`) anchors every record | 🚨 No on-chain identity/roles at all |
| Chain is sole source of truth; DB is a projection (BR-100) | DB is authoritative; anchoring is **fail-soft by design** — approvals succeed with `Pending`/`Failed` chain records | 🚨 Inverted |
| Full rebuild from block zero (BR-104) | Impossible — chain stores only hashes, no business state | 🚨 |
| Appropriation/Obligation lifecycle | Allocation lifecycle (Draft→PendingApproval→Approved…) with update + soft-delete paths | 🚨 Different model, and mutable |
| Integer-centavo money (BR-110) | `Decimal(14,2)` + JS `Number` serialization via `toNumber()` | 🚨 |
| Rule registry, compliance evaluation | Only a fiscal-year ceiling check in the service layer | ❌ |

**Schema/code drift (high severity, independent of BRs):** the migration `20260807000000_rescope_to_budget_execution` (untracked in git, applied to the live DB per `docs/MIGRATION_PLAN.md`) drops Treasurer/Auditor, removes the approval workflow, and creates `expense_transactions` — but `prisma/schema.prisma` **still declares** Treasurer/Auditor, `AllocationApproval`, and approval columns, and has **no `ExpenseTransaction` model, no service, no route**. Backend tests pass because they monkey-patch repositories and never touch the real DB. The repo is mid-re-scope and internally inconsistent. This is the "Budget Execution" system, not the "Appropriation and Obligation" system in the catalog.

---

## 3. Traceability Matrix

### Pre-orals milestone rules (BR-001…008, 010…017, 030…034, 040…049)

| Rule | Description (abbrev.) | Implemented | Location | Enforcement Layer | Tests | Status |
|---|---|---|---|---|---|---|
| BR-001 | Ledger write signed by role-bound identity | No — single backend key anchors; no on-chain role binding | `BudgetLedger.sol:53`, `AuditLedger.sol:72` | Tier 3 only (JWT/RBAC) | Contract tests assert `NotOwner`, not roles | ❌ / 🚨 Wrong layer |
| BR-002 | Role grants/revocations are chain transactions | No — role changes are DB updates + audit logs | `services/userService.js:230`, `audit_logs` | Tier 3 | `userService.test.js` | ❌ |
| BR-003 | RULE_ADMIN ∉ BUDGET_OFFICER holders | No RULE_ADMIN role anywhere | — | — | — | ❌ |
| BR-004 | Only BUDGET_OFFICER certifies appropriation | Allocation creation open to `[Admin, BudgetOfficer]`; no "certification" concept | `routes/allocationRoutes.js:30,87`, `services/allocationService.js:41` | Tier 3 | `allocationService.test.js` | ⚠ Analog only |
| BR-005 | Dept. head submits obligations vs own office | No department-head role; no obligations | — | — | — | ❌ |
| BR-006 | Observers have no write capability | No Observer role | — | — | — | ❌ |
| BR-007 | Deactivation prospective only | `status=Inactive` blocks new JWT auth; historical rows keep attribution | `middleware/authMiddleware.js:45`, `userService.js:247` | Tier 3 | `authMiddleware.test.js` | ⚠ Tier 3 only |
| BR-008 | No SoD-conflicting roles on one account | No conflict matrix; only self-approval prevention | `services/allocationService.js:431` | Tier 3 | — | ❌ |
| BR-010 | Appropriation references enacted ordinance | No ordinance entity | — | — | — | ❌ |
| BR-011 | Ordinance no. + FY unique | No ordinance | — | — | — | ❌ |
| BR-012 | Appropriation amount > 0 | `allocatedAmount` positive via Zod + service | `validators/allocationValidator.js:37`, `allocationService.js:802` | Tier 3, no DB CHECK | ✓ allocation tests | ⚠ Wrong entity/tier |
| BR-013 | Appropriation immutable; no update path | **Contradicted**: Draft rows editable, soft-deletable, status-transitionable; edits change content hash → old anchor looks tampered | `allocationService.js:158,242,275` | Tier 3 | — | 🚨 Violates |
| BR-014 | Line has fund, office, PAP, expense class | Has fund/dept/category/program; **no PAP code** | `schema.prisma:170` | Tier 3 | — | ⚠ Partial |
| BR-015 | FY with FiscalYearParameters only | Requires non-archived FiscalYear; no parameter records | `allocationService.js:695` | Tier 3 | — | ⚠ Partial |
| BR-016 | Supplemental ordinance references annual | No ordinance | — | — | — | ❌ |
| BR-017 | Inoperative line accepts no new allotments/obligations | No inoperative concept | — | — | — | ❌ |
| BR-030 | Σ allotments ≤ adjusted appropriation | No allotments (only FY aggregate ceiling vs `budgetAmount`) | `allocationService.js:769` | Tier 3 | ✓ ceiling tests | ❌ (analog ≠ rule) |
| BR-031 | Allotment amount > 0 | No allotments | — | — | — | ❌ |
| BR-032 | Allotment references exactly one line | No allotments | — | — | — | ❌ |
| BR-033 | Allotments append-only; withdrawal event | No allotments (append-only exists only for `blockchain_records`/`audit_logs`) | — | — | — | ❌ |
| BR-034 | Withdrawal ≤ unobligated portion | No allotments | — | — | — | ❌ |
| BR-040 | Σ certified obligations ≤ Σ allotments (core invariant) | **Not implemented anywhere** | — | — | — | ❌ |
| BR-041 | Availability at certification moment | No obligations | — | — | — | ❌ |
| BR-042 | Only REQUESTED obligations certifiable | No obligations | — | — | — | ❌ |
| BR-043 | Certifier ≠ requester | Analog: self-approval prevention on *allocations* | `allocationService.js:431` | Tier 3 | ✓ | ❌ as written |
| BR-044 | ORS numbers unique | No ORS | — | — | — | ❌ |
| BR-045 | Certification records identity + block timestamp | Analog: approval rows + anchor metadata | `allocationService.js:494`, `blockchainService.js` | Tier 3 | ✓ | ⚠ Analog only |
| BR-046 | Obligation expense class = line's | No obligations | — | — | — | ❌ |
| BR-047 | Obligation amount > 0 | No obligations | — | — | — | ❌ |
| BR-048 | Obligation state machine; cancellation recorded | No obligations (allocation state machine is Tier 3 only) | `constants/allocationStatus.js:33` | Tier 3 | ✓ | ❌ as written |
| BR-049 | Only certified obligations count vs balance | Analog: only `Approved` allocations count | `repositories/allocationRepository.js:100` | Tier 3 | ✓ | ❌ as written |

### Later-phase rules

| Rule | Implemented | Status |
|---|---|---|
| BR-020…024 (provincial review) | No | ❌ |
| BR-050…057 (realignment/supplemental) | No | ❌ |
| BR-060…068 (rule registry) | No | ❌ |
| BR-070…075 (compliance evaluation) | No (only FY-ceiling check at Tier 3) | ❌ |
| BR-080 (docs off-chain, SHA-256 anchored) | Off-chain storage + anchored hash | ✅ (anchoring fail-soft) |
| BR-081 (anchor immutable; supersession) | Anchors immutable; supersession link is DB-only (`currentVersionId`, `replaceReason`) | ⚠ |
| BR-082 (recompute + surface mismatch, never silent) | `documentBlockchainService.verifyDocument` recomputes SHA-256, reports mismatch, no re-anchor | ✅ (Tier 3) |
| BR-083 (deleted → "unavailable", distinct) | Deleted doc → HTTP 404, no distinct result | ❌ |
| BR-084 (verification run metrics) | Audit log + activity recorded, **no records-checked count or duration** | ⚠ |
| BR-090 (no PII on chain) | Only hashes on chain | ✅ |
| BR-091 (payee by opaque ref only) | Chain holds hashes only; **pending migration adds `payee` column to DB schema** | ⚠ / prospective 🚨 |
| BR-092 (erasure = delete off-chain) | "Delete" is soft-delete/archive; file blob remains on disk | ⚠ |
| BR-093 (public explorer, no payees) | No public explorer | ❌ |
| BR-100 (DB is projection, chain is truth) | Inverted: DB is truth, chain is optional | 🚨 |
| BR-101 (API DB role read-only on ledger) | Single `DATABASE_URL` role with full DML/DDL; no projection schema | 🚨 |
| BR-102 (no mutable balance column) | Balances derived via aggregates; no balance column | ✅ |
| BR-103 (projected rows record block#/tx/logIndex) | `blockNumber`+`txHash` stored for anchored rows; **no logIndex**; not all rows anchored | ⚠ |
| BR-104 (rebuild from block zero identical) | Impossible — chain has no business state | 🚨 |
| BR-105 (divergence = integrity failure, no projection write) | Manual `verify*` endpoints report mismatch; no continuous reconciliation | ⚠ |
| BR-110 (integer centavos, no floats) | `Decimal(14,2)` DB + JS `Number` in API; no on-chain money | 🚨 |
| BR-111 (rates in basis points) | No rates exist | ❌ |
| BR-112 (ceilings down, floors up) | No rounding policy implemented | ❌ |
| BR-113 (no currency conversion) | True (PHP only) | ✅ |

---

## 4. Security Review

- **On-chain authorization bypass (critical):** The contract `owner()` is the deployer — Hardhat account #0, whose private key (`0xac0974…ff80`, documented in `.env.example:42`) is **publicly known**. If `.env` uses that key, anyone can call `record()`/`recordEvent()` on the deployed localhost contracts. No role check exists to stop it.
- **No identity binding (BR-001):** All on-chain writes are attributable only to the single backend key. A compromised backend can anchor arbitrary hashes; the chain cannot distinguish an Administrator write from a Budget Officer write.
- **No owner-transfer/recovery:** `_owner` is fixed at construction in both contracts.
- **Race condition (medium):** `validateBudgetCeiling` (`allocationService.js:769`) does a read (aggregate) then the insert happens in a *separate* transaction (`allocationRepository.createWithSequentialCode`). Two concurrent approvals can both pass the ceiling and overspend — the ceiling check is **not** atomic. (Code-gen uniqueness *is* protected via `Serializable` isolation.)
- **Immutability contradiction (BR-013):** Legitimate Draft edits (`updateAllocation`) change the allocation content hash; the previously anchored hash then reads as "possible tampering" in `verifyAllocation`. The tamper-detection mechanism is also a false-positive generator.
- **Mutable "ledger" rows:** `budget_allocations` has explicit `update` and `softDelete` paths — no append-only discipline on the entity the chain is supposed to protect.
- **Overflow:** Solidity 0.8.24 uses checked arithmetic; DB `Decimal(14,2)` + `MAX_AMOUNT` guard — no overflow risk.
- **Replay/duplicate tx:** mitigated by `anchorUnlessExists` + contract-level hash dedup — this part is well designed.
- **Missing continuous integrity:** projection-vs-chain divergence is only checked on-demand via verify endpoints; nothing surfaces drift automatically.

---

## 5. Testing Assessment

- **Contract tests (`BudgetLedger.test.js`, `AuditLedger.test.js`)** — 22 passing, but they test only owner gate, dedup, verify semantics, event args. **Zero tests for any BR rule** (no roles, no obligations, no ceilings on-chain).
- **Backend suite** — all 38 scripts pass, covering Tier 3 analogs: ceiling validation, code generation, self-approval prevention, blockchain verify/retry, document verification. These are tests of *different, weaker* rules.
- **Missing:** any test that a Tier 1 rule reverts on-chain; immutability of an appropriation; availability-check race (BR-041/049); SoD conflict (BR-003/008); ORS uniqueness (BR-044); rule-registry/compliance re-evaluation (BR-053/057). Nothing to test — the features don't exist.
- **Frontend:** 174 Vitest tests cover UI components; UI performs no enforcement (correctly, per Tier 4).

---

## 6. Compliance Score

| Scope | Score | Notes |
|---|---|---|
| **Overall** | **14%** | 5 fully + 12 partial of 78 rules |
| **Tier 1** | **10%** | 3 fully (BR-080, BR-090, BR-113) + 7 partial of 67 |
| **Tier 2** | **30%** | BR-102 ✅, BR-103 ⚠ of 5 |
| **Tier 3** | **42%** | BR-082 ✅ + 3 partial of 6 |
| **Pre-orals milestone rules** | **10%** | 6 partial, 25 missing of 31 |

Scoring: ✅ = 1.0, ⚠ = 0.5, ❌/🚨 = 0. *The headline number is 14% because the catalog is a Tier-1-centric specification and the repo has no Tier 1 business logic.*

---

## 7. Critical Issues (prioritized)

**Critical**
1. **Tier 1 enforcement is entirely absent.** Contracts are hash registries; all 31 pre-orals rules and 57 further Tier 1 rules have no on-chain enforcement point. No contract function can revert on a rule violation because no rule logic is in the contract.
2. **No on-chain identity/roles (BR-001, BR-002).** Single anonymous signer key; the chain cannot attribute writes to roles; BR-003/BR-008 structurally impossible.
3. **Chain is not the source of truth (BR-100, BR-104).** Fail-soft anchoring means business state is valid with no chain record; a rebuild-from-block-zero is impossible.
4. **Core domain absent.** No ordinance/appropriation/allotment/obligation/realignment/rule-registry/compliance subsystems at all.
5. **Immutability violated (BR-013).** Mutable allocation rows + update/soft-delete paths; legitimate edits masquerade as tampering.

**High**
6. **Public default signer key** in `.env.example`/deployment = owner compromise risk.
7. **No DB role separation (BR-101):** one full-privilege connection; no read-only projection.
8. **Schema/migration drift:** live DB diverges from `schema.prisma` (mid re-scope); `expense_transactions` orphaned (also introduces `payee`, a future BR-091 hazard).
9. **BR-083 missing:** deleted docs → 404, not "unavailable".
10. **Ceiling TOCTOU race** in approval/creation flow.

**Medium**
11. No DB CHECK constraints for amount>0 (Tier 2 absent).
12. No `logIndex` (BR-103).
13. Supersession not anchored (BR-081); erasure not implemented (BR-092); verification metrics incomplete (BR-084); no public explorer (BR-093); no continuous reconciliation (BR-105).

---

## 8. Missing Business Rules Checklist (pre-orals milestone)

□ BR-001 ☐ BR-002 ☐ BR-003 ☐ BR-004(⚠) ☐ BR-005 ☐ BR-006 ☐ BR-007(⚠) ☐ BR-008
☐ BR-010 ☐ BR-011 ☐ BR-012(⚠) ☐ BR-013 ☐ BR-014(⚠) ☐ BR-015(⚠) ☐ BR-016 ☐ BR-017
☐ BR-030 ☐ BR-031 ☐ BR-032 ☐ BR-033 ☐ BR-034
☐ BR-040 ☐ BR-041 ☐ BR-042 ☐ BR-043 ☐ BR-044 ☐ BR-045(⚠) ☐ BR-046 ☐ BR-047 ☐ BR-048 ☐ BR-049

*(⚠ = only a weaker Tier 3 analog exists)*

---

## 9. Recommendations (in priority order)

| # | Problem | Why it violates the spec | Suggested implementation | Affected files | Priority |
|---|---|---|---|---|---|
| 1 | Contracts carry no business logic | Every Tier 1 BR is a claim, not a control; pre-orals gate cannot be met | Build a real permissioned ledger: on-chain role registry (grant/revoke tx, grantor+timestamp), identity→role binding, and contract functions for certify-appropriation, allot, request-obligation, certify-obligation with in-function checks (BR-030/034/040/041), so violations revert. Keep hashes for docs (BR-080) | `apps/contracts/contracts/*` (+ new `RoleRegistry.sol`, `ObligationLedger.sol`, `RuleRegistry.sol`) | Critical |
| 2 | Single owner / public key | BR-001/006: writes must be role-bound, not a shared key | One address per role identity; `msg.sender` role lookup per write; generate a fresh key for deploys; add owner-transfer or multi-sig | `BudgetLedger.sol`, `AuditLedger.sol`, deploy scripts, `.env.example` | Critical |
| 3 | Chain not source of truth | BR-100/104 | Decide: either (a) make chain authoritative (all writes tx-first, projection indexes events — implement event-log indexing + rebuild), or (b) formally downgrade the "blockchain" claims in the manuscript to "tamper-evident hash anchoring," since the current design cannot support the catalog's integrity claim | `services/blockchainService.js`, `config/blockchain.js` | Critical |
| 4 | No Ordinance/Appropriation/Allotment/Obligation models | BR-010…017, 030…034, 040…049 | Add Prisma models (immutable rows, no update/delete paths; amendments via new rows), sequential ALC/ORS code generation, allocation-vs-approp ceiling, allotment/obligation ledgers, certification state machine with certifier≠requester | `schema.prisma` + migrations, `constants/`, `services/`, `repositories/`, `validators/` | Critical |
| 5 | Immutability contradicted | BR-013 | Remove update/soft-delete from recorded allocations; corrections = amending ordinance + new immutable line; make verify only flag divergence, with an explicit amendment path | `services/allocationService.js`, `repositories/allocationRepository.js` | High |
| 6 | Money representation | BR-110 | Store integer centavos (`BigInt`) in DB and contract; never serialize through `toNumber()` for logic (display-only conversion, basis-point rates for BR-111/112) | `schema.prisma`, `utils/amountUtils.js` | High |
| 7 | DB role separation | BR-101 | Two MySQL users: app-write (business tables) + read-only projection; separate ledger schema if projection is introduced | `config/env.js`, migrations, docs | High |
| 8 | Schema drift + orphaned `expense_transactions` | Blocked, half-migrated state | Either commit the re-scope fully (update `schema.prisma`, add ExpenseTransaction service/routes) or roll it back; reconcile before any further work | `prisma/schema.prisma`, `seed.js`, git | High |
| 9 | Verification "unavailable" result | BR-083 | Return a distinct `verificationStatus: 'unavailable'` for deleted/missing off-chain blobs instead of 404; add metrics (records checked, mismatches, duration) for BR-084 | `services/documentBlockchainService.js`, routes | Medium |
| 10 | TOCTOU ceiling race | BR-030-ish correctness | Move ceiling validation inside the same serializable transaction as the insert/approve | `repositories/allocationRepository.js`, `services/allocationService.js` | Medium |
| 11 | Traceability matrix + tests | Catalog §13 requires rule→function→test mapping | For every rule you implement, add a contract/unit test that proves the violation reverts; produce the matrix table in docs | `apps/contracts/test/*`, `apps/backend/tests/*`, `docs/` | Ongoing |

---

## 10. Bottom Line

Treat the Business Rules Catalog as a target specification for the remaining ~58% of the project, not as a description of the current codebase. The pre-orals milestone (31 rules) cannot be demonstrated as enforced until a Tier 1 permissioned ledger with role-bound identities and appropriation/allotment/obligation state machines is actually written. As it stands, the strongest honest claims that can be defended are:

- tamper-evident hash anchoring (BR-080/082)
- no-PII on chain (BR-090)
- derived balances (BR-102)
- PHP-only (BR-113)
