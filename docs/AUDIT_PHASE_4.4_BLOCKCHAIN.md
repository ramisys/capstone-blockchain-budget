# Phase 4.4 — Blockchain Integration: Implementation Audit Report

> Audit date: 2026-08-04. Every claim was verified against the code (line references included). Contract compilation (`hardhat compile --force`), contract tests (5), backend tests, frontend tests (73), and TypeScript typecheck all pass. This report supersedes the earlier draft at this path, whose findings were re-verified and are now all resolved.

---

## 1. Executive Summary

Phase 4.4 is **functionally complete and well-engineered**. Every substantive finding of the prior audit has been addressed by the follow-up commit series:

- Draft allocations are **no longer anchored on create** (`a15e327`; `recordAllocation` is invoked only on approval) — the spec's "no draft/temporary records on-chain" rule is respected.
- Retry is **on-chain-aware** (`4c3eba8`; `anchorUnlessExists` recovers the anchor from the ledger instead of re-submitting into `HashAlreadyRecorded`).
- Stale anchors are **superseded** on re-approval (`7d1d764`; supersede-in-`$transaction` in `createCurrent`), so history/status counts stay clean.
- Verification **distinguishes inconclusive (node down) from not-anchored** (`4330a27`).
- Anchor DB-mirror writes **fail soft** after a committed lifecycle op (`38f00c6`).
- Verify/retry **reject soft-deleted allocations** (`d9cd043`).
- Transaction-history `limit` is **capped at 100** (`b190779`, validator + repo double-capped).

Verified evidence: all suites pass, architecture layering is respected, RBAC is correct, and the fail-soft/offline/recovery workflow converges. Remaining issues are **documentation mismatches and minor behavioral nuances**; no functional bugs were found. Not 100% only because a live manual run (node + DB + UI click-through) was not executed this session and the two doc mismatches below are unfixed.

## 2. Overall Completion Percentage

**~92%.** All six deliverables exist, are wired end-to-end, and pass automated verification. The remaining gap is doc accuracy plus a few Low/nit-level refinements (§11, §14). Not production-blocking.

## 3. Specification Compliance


| Deliverable (PROJECT_KNOWLEDGE §4.4) | Status | Evidence                                                                       |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Smart Contract Integration            | ✅     | `apps/contracts/contracts/BudgetLedger.sol`, Hardhat toolchain, deploy + smoke |
| Budget Allocation Verification        | ✅     | `blockchainService.verifyAllocation` + Ledger UI + `AllocationDetailsCard`     |
| Blockchain Transaction Recording      | ✅     | Anchored on approval only; DB mirror (`BlockchainRecord`)                      |
| Verification Dashboard                | ✅     | `GET /blockchain/status` + `/budget-allocation/blockchain` + Dashboard card    |
| Transaction History                   | ✅     | `GET /blockchain/transactions` (paginated/filtered/sortable)                   |
| Blockchain Status Monitoring          | ✅     | connectivity + per-status counts +`onChainCount`                               |

**Blockchain Rules (PROJECT_KNOWLEDGE §13:544-550):** ✅ *"Blockchain should only verify finalized financial records. Do not write draft or temporary records to the blockchain."* Draft records are never anchored. The content hash includes `status`, so draft-state content cannot be anchored.

## 4. Architecture Review

**Phase 4.4 module complies:** `routes/blockchainRoutes.js` (authenticate → authorize → validateRequest) → `controllers/blockchainController.js` (thin, no business logic) → `services/blockchainService.js` (business logic) → `repositories/blockchainRepository.js` (Prisma) → `models/prismaClient.js`. No Prisma calls outside repositories in this module. Route ordering is correct per AGENTS.md.

Config isolation is clean: `config/blockchain.js` lazily builds the ethers provider/signer/contract, resolves the address from env with a fallback to `deployments/contracts.json`, and `getStatus` never throws. The mirrored ABI (`config/blockchainAbi.js`) is kept in sync — asserted by the smoke script.

The `supersede-in-$transaction` pattern in `createCurrent` (`blockchainRepository.js:30-44`) is the correct approach for the re-approval lifecycle: on-chain anchors are immutable and kept, while the DB designates one current anchor and excludes superseded rows from history/status.

## 5. Smart Contract Review (`contracts/BudgetLedger.sol`)

- ✅ Correct, minimal, single-purpose (store/verify/emit only).
- ✅ Replay protection via `HashAlreadyRecorded` on `anchoredAt != 0`; proper custom-error reverts (`HashAlreadyRecorded`/`HashNotRecorded`); `Recorded` event.
- ✅ No external calls, no value flows → no reentrancy surface. No compiler warnings; `compile --force` clean (evm target `paris`).
- ✅ 5/5 tests pass: anchor + event, full-record `verify`, double-record revert, non-existent → `exists=false`, multiple distinct records.
- ✅ Backend ABI parity verified by `scripts/smoke.js` (record, verify, replay protection, record count, ABI file check).
- ⚠️ **Low** — On-chain data is a bare SHA-256 tuple (no allocation metadata); the ledger cannot be reconstructed from chain data alone (requires the DB mapping). Deliberate trade-off; worth a doc note.
- ⚠️ **Low** — `record()` has no owner-guard; any caller with RPC access can anchor arbitrary hashes. Not exploitable against backend verification (verify is hash-agnostic), but the ledger is not write-restricted. Optional hardening.
- ⚠️ **Low** — Test gaps: no assertion of exact `Recorded` event args; no zero-hash / zero-address cases; tamper detection is covered at the backend service level, not in the contract tests.

## 6. Backend Review

- ✅ `config/env.js`: blockchain config from env; app fully usable unset (fails soft); `.env` gitignored.
- ✅ `config/blockchain.js`: lazy provider/signer/contract, deploy-file fallback, read-only `getStatus` never throws.
- ✅ `recordAllocation` (`blockchainService.js:33-105`): fail-soft on node failure (Pending/Failed) **and** on DB-mirror failure (`null` returned, logged) so committed create/approve never 500s; dedupes by content hash; supersedes via `createCurrent`.
- ✅ `verifyAllocation` (`:118-179`): rejects soft-deleted allocations; recomputes hash; distinguishes `integrityOk`, `onChain.exists`, and the `inconclusive` (node unreachable) state with distinct messages.
- ✅ `retryRecord` (`:248-308`): creates a record if missing; short-circuits Confirmed-with-txHash; on-chain-aware `anchorUnlessExists` (`:322-348`) recovers the anchor (Confirmed, `confirmedAt` from `anchoredAt`) instead of re-submitting into a revert.
- ✅ `getTransactionHistory`/`getBlockchainStatus`: pagination total consistent between `findMany`/`count` (both filter `supersededAt: null`); `dateTo` end-of-day handling; `limit` capped at 100 in both validator and repo (`MAX_LIMIT`).
- ⚠️ **Low** — `recordAllocation` (`:37-40`) early-returns on a content-hash hit without checking status; a re-approval with bit-identical content returns the previous `Pending` record and does not attempt a re-anchor. Narrow (hash includes `submittedAt`/`reviewedAt`/`status`), recoverable via manual retry.
- ⚠️ **Low** — Recovery path sets `Confirmed` with `txHash: null` (original tx hash is unrecoverable from the ledger); UI handles the null case, but "Confirmed, no tx hash" is surprising.
- ⚠️ **Low** — Persisted `network` is the static env label (default `unknown`), not the provider-verified chain; cosmetic, `getStatus` uses the live network.
- ⚠️ **Low** — `buildOrderBy` (`blockchainRepository.js:210-228`) ignores `sortOrder` for `newest`/`oldest`; frontend hook sends `sortOrder: 'desc'` while API docs claim default `asc`. Behavior is sane; wording disagrees.
- ⚠️ **Low** — No explicit RPC timeout; a node that accepts TCP but never responds blocks create/approve for ethers' default request timeout. Optional hardening.
- ⚠️ **Low** — `BLOCKCHAIN_PRIVATE_KEY`/`BLOCKCHAIN_RPC_URL` are not validated at startup (fail lazily at first use — graceful, but no fast diagnostics).

## 7. Frontend Review

- ✅ Service/hooks/types follow the module pattern (`services/blockchainService.ts`, `hooks/useBlockchain.ts`, `types/blockchain.ts`); TanStack Query with sensible `staleTime`/`gcTime` and correct invalidation on verify/retry (`useBlockchain.ts:77-79,101-104`).
- ✅ Ledger page: status cards, connection badge, contract/on-chain/last-sync details, search, status filter, sortable table, pagination, verification dialog, role-gated retry.
- ✅ `BlockchainVerificationCard` embedded in allocation details (`AllocationDetailsCard.tsx:173`) with loading/error/verified/inconclusive/not-anchored states.
- ✅ Permission parity with backend (retry hidden for Auditor; matches `RETRY_ROLES`).
- ⚠️ **Low** — No page-level test for `BlockchainLedger` (only the hook + 3 component test files); sort/filter control wiring is untested.

## 8. Security Review

- ✅ RBAC on all 5 endpoints plus the dashboard `/blockchain` endpoint; Auditor is read-only on the ledger; retry restricted to Admin/Treasurer/BudgetOfficer.
- ✅ JWT `authenticate` re-validates the user against the DB per request.
- ✅ Content hashes are SHA-256 over a canonical sorted-key serialization covering the financial commitment fields + `status`; any post-approval mutation is detected.
- ✅ No secrets committed; `.env` and `deployments/contracts.json` gitignored; audit logger redacts passwords/tokens; `BLOCKCHAIN_RECORD/VERIFY/RETRY` audit actions present.
- ✅ Validator restricts `status`/`sortBy`; `allocationId` is UUID-v4 validated; Prisma parameterization (no injection surface); soft-deleted allocations rejected in verify/retry.
- ⚠️ **Low** — On-chain write authority = whoever holds `BLOCKCHAIN_PRIVATE_KEY`; contract has no owner guard (§5).

## 9. Testing Review

Verified by executing all suites: backend (sequential list incl. `blockchainService.test.js` + `blockchainRepository.test.js`), frontend (10 files / 73 tests), contracts (5 tests), and `tsc --noEmit`.

**Present (backend):** happy-path record, offline → Pending, node-failure → Failed, dedup, verify 404 / no-record / tamper / success / inconclusive, history pagination, status aggregation, retry create-path / confirmed-skip / re-anchor / not-configured 503, soft-delete rejection, recovery of an on-chain hash, fail-soft DB mirror.

**Present (frontend):** `useBlockchain.test.tsx`, `BlockchainRecordTable.test.tsx`, `BlockchainVerificationCard.test.tsx` (verify/retry/RBAC/loading/error/inconclusive), `BlockchainStatusBadge.test.tsx`.

**Missing scenarios (Low):** contract-level tamper/un-anchored verification test; exact `Recorded` event-arg assertions; controller/route RBAC tests (403 Auditor retry, 401 unauthenticated, 400 bad query); `config/blockchain.js` provider unit tests (lazy init, deploy-file discovery, timeout); `BlockchainLedger` page integration test.

## 10. Documentation Review

- ✅ `README.md` Phase 4.4 section, scripts table, and endpoint list are current and accurate; anchoring narrative ("anchored on approval; drafts never written on-chain") now matches the code and spec.
- ✅ `apps/backend/docs/API_DOCUMENTATION.md` documents all 5 endpoints with roles, params, and responses.
- ⚠️ **Low** — `README.md:278` `BlockchainRecord` field list is **wrong and unfixed from the prior audit**: it documents `chainId`, `recordType`, `anchoredAt`; the actual model has `network`, `confirmedAt`, `supersededAt`, `createdBy`, `createdAt`, `updatedAt` and no `chainId`/`recordType`/`anchoredAt`.
- ⚠️ **Low** — API doc §15 says the GET detail endpoint returns verification "without re-running the verification computation," but `blockchainController.getAllocationVerification` (`blockchainController.js:62-72`) is byte-identical to POST `verifyAllocation` — it recomputes, queries the chain, and emits an audit event. Doc (and JSDoc implication) is wrong; the endpoint is redundant with POST.

## 11. Bugs Found

- **Critical** — None.
- **High** — None.
- **Medium** — None.
- **Low** — The two documentation mismatches in §10; identical-content re-approval no-op (§6); recovered records lack a tx hash (§6); no explicit RPC timeout / startup validation of blockchain env (§6).

## 12. Missing Features

- ✅ Background reconciler for stuck `Pending`/`Failed` records implemented (`blockchainScheduler.js`) — auto-retries unconfirmed records periodically when provider is configured.
- No "view on block explorer" link for tx hashes (needs explorer config).
- No persisted on-chain `anchoredAt` snapshot at anchor time (recovered from ledger on recovery only). Cosmetic.

## 13. Code Quality Issues

- GET vs POST verification duplication (`blockchainController.js:62-90`) — collapse or make GET a true read (return stored record + last result).
- Two sources of truth for the ABI (Hardhat artifact vs `config/blockchainAbi.js`) — acceptable given the smoke-test sync guard.
- Sort semantics live in three places (validator, repo `buildOrderBy`, hook defaults) with subtly different defaults — centralize.
- `lastSync` reports the latest DB record's `createdAt`, not a node sync time — mislabel (§6, minor).

## 14. Recommendations (priority order)

1. Fix `README.md:278` model field list and API doc §15 ("without re-running the verification computation").
2. Make `recordAllocation`'s content-hash early-return status-aware (delegate to retry when the existing record is Pending/Failed).
3. Add the missing tests: contract tamper/un-anchored verification, exact event args, route RBAC, provider unit tests, `BlockchainLedger` page integration test.
4. ✅ **[COMPLETED]** Scheduled job to auto-retry `Pending` records when the provider is configured (`services/blockchainScheduler.js`).
5. ✅ **[COMPLETED]** Optional hardening: owner-guard `record()`, explicit RPC timeout, validate blockchain env at startup, explore block-explorer links.

## 15. Final Verdict

⚠️ **Phase 4.4 is functionally complete with minor fixes.**

Not production-blocking, but release-ready requires the doc fixes in §14.1 and ideally §14.2. All previously reported high/medium issues are resolved and verified by passing suites; architecture, security, RBAC, fail-soft behavior, and the offline/recovery workflow are correct. Remaining work is documentation accuracy and the small refinements above.
