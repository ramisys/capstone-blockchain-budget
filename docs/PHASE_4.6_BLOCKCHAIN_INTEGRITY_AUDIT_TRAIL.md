# Phase 4.6 – Blockchain Integrity & Audit Trail

**Project:** Blockchain-Based Budget Allocation and Expense Monitoring System
**Scope:** Secure, transparent, auditable system that records important activities and verifies document integrity using blockchain technology.
**Depends on:** Phases 4.1–4.5 (Authentication, Budget Allocation, Expense Management, Dashboard & Analytics, Document Management).

> **Do NOT redesign or modify Phase 4.5.** Build on top of it by adding blockchain integrity and audit capabilities.

---

## Current State (verified against the code)

Much of the blockchain integrity core already exists. This plan fills the real gaps rather than redoing completed work.

| Capability | Location | Status |
|---|---|---|
| Allocation blockchain anchoring | `services/blockchainService.js` → `BudgetLedger.record` | ✅ Exists |
| SHA-256 document hashing (server-side, streaming) | `services/documentStorageService.js` | ✅ Exists |
| Document hash anchored on-chain | `services/documentBlockchainService.js` (`anchorVersion`) | ✅ Exists |
| Stored-document integrity verification | `verifyDocument` + `GET /api/documents/:id/verify` | ✅ Exists |
| Allocation verification | `verifyAllocation` + `/api/blockchain/allocations/:id/verify` | ✅ Exists |
| Pending/Failed anchor reconciliation | `services/blockchainScheduler.js` (60s interval) | ✅ Exists |
| Allocation status history | `AllocationApproval` table + `ApprovalHistory` UI | ✅ Exists |
| Document lifecycle history | `DocumentActivity` table + `ActivityTimeline` UI | ✅ Exists |
| Audit events (structured) | `utils/auditLogger.js` — **console only, NOT persisted** | ⚠️ Gap |
| Audit events anchored on-chain | — | ❌ Missing |
| Unified blockchain transaction history | — | ❌ Missing |
| Blockchain transaction detail view | — | ❌ Missing |
| Financial activity timeline | — | ❌ Missing |
| External-file verification | — | ❌ Missing |

**Four real gaps** targeted by this phase:

1. **Persist the audit trail** — `auditLogger` writes to console only; nothing is queryable.
2. **Anchor audit/status-change events on-chain** — new contract; content anchors already exist.
3. **A unified, type-aware blockchain history + transaction detail view** — allocation records and document anchors live in separate tables/pages today.
4. **Financial activity timeline + external-file verification** — verification today only works for files already stored in the system.

---

## 1. Feature Breakdown

| Feature | Status | What Phase 4.6 adds |
|---|---|---|
| Blockchain transaction recording (allocation) | ✅ Exists | Nothing structural — surface it in unified history |
| SHA-256 document hashing | ✅ Exists | Reuse for external-file verification |
| Store document hash on blockchain | ✅ Exists | Nothing structural |
| Document integrity verification (stored) | ✅ Exists | Keep; surface via unified UI |
| **Audit trail logging (persisted)** | ⚠️ Console-only | New `audit_logs` table + persistence sink + query API |
| **User activity logging** | ⚠️ Console-only | Covered by persisted audit logs (actor snapshots) + activity feed |
| **Status history tracking** | Partial | Generalized via audit entries carrying `before`/`after`; no duplicate tables |
| **Blockchain transaction history (unified)** | ⚠️ Allocations only | Union query over allocation records + document anchors (+ audit anchors) |
| **Blockchain transaction details** | Partial (verification dialog) | New detail view: tx hash, block, network, explorer link, anchor metadata, related entity |
| **Audit event on-chain anchoring** | ❌ Missing | New `AuditLedger.sol` + fail-soft anchoring |
| **Financial activity timeline** | ❌ Missing | Merged chronological feed (allocations, approvals, documents, blockchain, audits) |
| **External-file verification** | ❌ Missing | Verify a user-uploaded file (not stored) against the ledger |

---

## 2. System Workflow

### 2.1 Recording a blockchain transaction (anchor)

Already works for allocations and documents. Phase 4.6 extends it to audit events and adds the audit-log side effect.

```
Actor triggers business action
   │
   ▼
Service performs action (e.g., approveAllocation)
   │  ┌──────────────────────── fail-soft ─────────────────────────────┐
   │  ▼                                                                 │
   ├─ computeAllocationContentHash(allocation) ──────────────────────┐  │
   │  ▼                                                                │  │
   ├─ blockchainRepository.createCurrent(...)  (Pending/Confirmed)    │  │
   │  ▼                                                                │  │
   ├─ if provider configured → blockchainProvider.record(0x…hash)      │  │
   │     └─> tx.wait() → txHash + blockNumber → status=Confirmed        │  │
   │     └─> node down/not configured → status=Pending/Failed (kept for  │  │
   │          retry by blockchainScheduler every 60s)                    │  │
   │  ▼                                                                │  │
   ├─ auditLogger.logSuccess(...)  ── NEW ──> persist to audit_logs (fire- │
   │     &-forget) ──> async anchor event hash to AuditLedger (Pending →   │
   │     Confirmed, scheduler retries)                                   │  │
   └─ response to client (never blocks on ledger)                    │  │
```

### 2.2 Upload → hash → store hash on-chain

1. `multer` writes upload to temp file → `uploadMiddleware` validates type/size.
2. `documentService.uploadDocument` streams the file via `documentStorage.storeStream`, **hashing in the same pass** (`sha256Hash`).
3. Duplicate check: `documentRepository.findVersionByHash` (unique on `sha256Hash`).
4. `documentRepository.createDocumentWithVersion` persists document + v1 atomically.
5. `UPLOAD` activity + `DOCUMENT_UPLOAD` audit entry.
6. `documentBlockchainService.anchorVersion` → `blockchainService.anchorUnlessExists` → `blockchainProvider.record(0x…sha256)` → Confirmed (or Pending/Failed, retried by scheduler).

### 2.3 Verify a stored document

`GET /api/documents/:id/verify` (`documentBlockchainService.verifyDocument`):
1. Resolve document + version (current or by `versionNumber`).
2. Re-stream stored bytes → recompute SHA-256 → compare with `version.sha256Hash` → `integrityOk`.
3. `blockchainProvider.verify(0x…sha256)` → `onChain.exists`.
4. `verified = integrityOk && onChain.exists`; `inconclusive` when integrity passes but node is unreachable.
5. Record `VERIFY` activity + `DOCUMENT_VERIFY` audit entry.

**New in 4.6 — verify an external file:** `POST /api/verification/documents` (multipart). Server streams the uploaded file, computes SHA-256, looks up a matching `DocumentVersion` by hash, then runs steps 2–5. Result returns `{ verified, integrityOk, onChain, inconclusive, message, matchedVersion, verifiedAgainst: 'blockchain' | 'database' | 'none' }`.

### 2.4 Recording user activities

```
Any action (login, role change, upload, status change…)
   │
   ▼
auditLogger.log() ── console (unchanged, structured, sanitized)
   │
   └─ NEW persistAuditEntry(entry)  (fire-and-forget, never throws)
         │
         ├─ auditLogRepository.create({ action, result, actorId/Email/Name/Role,
         │       ip, resourceType/Id/Code, details, eventHash })
         └─ auditEventBlockchainService.anchorEvent(auditLog)  (fail-soft)
               ├─ eventHash = sha256(canonical(event payload))
               └─ AuditLedger.recordEvent(eventHash, category)
```

Because the sink is wired inside `auditLogger.log()`, **every existing call site** (auth, users, allocations, documents, blockchain) is automatically persisted without touching those services.

### 2.5 Tracking record status changes

- **Allocations:** `allocationService.performTransition` already writes `AllocationApproval` rows (Submitted/Approved/Rejected/Returned) + `ALLOCATION_*` audit actions with `fromStatus`/`toStatus`. Keep as-is.
- **Documents:** `DocumentActivity` rows (UPLOAD/REPLACE/ARCHIVE/…) already exist. Keep as-is.
- **System-wide:** every transition also lands in `audit_logs` with `details: { fromStatus, toStatus, comment }`. The "Status History" view = `audit_logs` filtered by resource + status-change actions. **No new table.**

---

## 3. Database Design

### New table: `audit_logs` (model `AuditLog`)

Append-only, no FK to `User` (system actors like `system-scheduler` aren't in `users`, and a user record must never block audit writes). Actor fields are **denormalized snapshots** so history survives account deactivation.

```prisma
enum AuditResult {
  Success
  Failure
}

enum AuditAnchorStatus {
  Pending
  Confirmed
  Failed
}

model AuditLog {
  id           String             @id @default(uuid())
  action       String             @db.VarChar(100)      // from AUDIT_ACTIONS
  result       AuditResult        @default(Success)
  actorId      String?                                   // no FK — system/anon actors
  actorEmail   String?            @db.VarChar(255)       // snapshot
  actorName    String?            @db.VarChar(255)       // snapshot
  actorRole    String?            @db.VarChar(50)        // snapshot
  ip           String?            @db.VarChar(45)
  resourceType String?            @db.VarChar(100)       // 'Allocation' | 'Document' | ...
  resourceId   String?
  resourceCode String?            @db.VarChar(255)
  details      Json?              // fromStatus/toStatus, versionNumber, etc. (sanitized)
  eventHash    String?            @unique                 // sha256 of canonical payload
  anchorStatus AuditAnchorStatus  @default(Pending)
  txHash       String?            @unique
  blockNumber  BigInt?
  network      String?
  confirmedAt  DateTime?
  createdAt    DateTime           @default(now())

  @@index([action])
  @@index([result])
  @@index([actorId])
  @@index([resourceType, resourceId])
  @@index([anchorStatus])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Migration note:** `npx prisma migrate dev` from `apps/backend`. Do not hand-edit applied migrations. New enums follow the PascalCase convention; mirror them as `AUDIT_RESULTS` (already exists) and a new `AUDIT_ANCHOR_STATUS` constant file.

### Explicit non-changes (avoid duplication)
- **Do not** add a separate `status_history` table — allocation/document status history already lives in `allocation_approvals` + `document_activities`; `audit_logs` provides the system-wide superset.
- **Do not** copy document anchor fields into `BlockchainRecord`. Document versions already carry `sha256Hash/txHash/blockNumber/network/status/confirmedAt`. The unified history is a **read-time union**, not a schema duplicate.
- **No columns changed** on `BlockchainRecord`, `DocumentVersion`, `ManagedDocument`.

---

## 4. Smart Contract Changes

**Recommendation: new `AuditLedger.sol` — do not extend `BudgetLedger`.**

Rationale:
- `BudgetLedger` is **deployed and holds live allocation/document anchors** (`deployments/contracts.json`). Changing its storage/signature means redeploy + losing or migrating the existing ledger.
- Clean separation of concerns: `BudgetLedger` = content integrity of financial records; `AuditLedger` = immutable activity/status events.
- Keeps `recordCount()` semantics meaningful (it currently counts anchors; mixing status events would pollute it).

### New contract `apps/contracts/contracts/AuditLedger.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Immutable registry for audit/status-change events. Each event is
/// anchored by its SHA-256 payload hash + category. Owner-only writes; anyone
/// may verify. Fail-soft: the backend persists events locally regardless.
contract AuditLedger {
    struct AuditEvent {
        bytes32 eventHash;
        string category;
        address anchoredBy;
        uint256 anchoredAt;
        uint256 blockNumber;
    }

    address private _owner;
    mapping(bytes32 => AuditEvent) private _events;
    mapping(string => uint256) private _categoryCounts;
    uint256 private _eventCount;

    event EventRecorded(bytes32 indexed eventHash, string indexed category,
                        address indexed anchoredBy, uint256 blockNumber, uint256 timestamp);

    error EventAlreadyRecorded(bytes32 eventHash);
    error InvalidCategory();
    error NotOwner();

    constructor() { _owner = msg.sender; }

    function owner() external view returns (address) { return _owner; }

    /// @notice Anchor an event. Category must be non-empty.
    function recordEvent(bytes32 eventHash, string calldata category)
        external returns (uint256)
    {
        if (msg.sender != _owner) revert NotOwner();
        if (bytes(category).length == 0) revert InvalidCategory();
        if (_events[eventHash].anchoredAt != 0) revert EventAlreadyRecorded(eventHash);
        _events[eventHash] = AuditEvent({
            eventHash, category, msg.sender, block.timestamp, block.number
        });
        _categoryCounts[category] += 1;
        _eventCount += 1;
        emit EventRecorded(eventHash, category, msg.sender, block.number, block.timestamp);
        return _eventCount;
    }

    function verifyEvent(bytes32 eventHash)
        external view
        returns (bool exists, string memory category, address anchoredBy,
                 uint256 anchoredAt, uint256 blockNumber)
    { /* …as BudgetLedger.verify… */ }

    function eventCount(string calldata category) external view returns (uint256) { /* … */ }
    function totalEvents() external view returns (uint256) { return _eventCount; }
}
```

**Functions:** `recordEvent`, `verifyEvent`, `eventCount(category)`, `totalEvents`, `owner`.
**Event:** `EventRecorded(bytes32 indexed eventHash, string indexed category, address indexed anchoredBy, uint256 blockNumber, uint256 timestamp)`.
**Data structure:** `struct AuditEvent` + two mappings.

**Security considerations:**
- **Owner-only writes** (mirrors `BudgetLedger`); private key stays server-side in `BLOCKCHAIN_PRIVATE_KEY` env, never in the client.
- `eventHash` = SHA-256 of a canonical payload that includes a UUID and `createdAt`, so identical actions can never collide (no `HashAlreadyRecorded` false positives).
- No external calls in the contract → no reentrancy surface.
- Read methods are `view` and public — verification never costs a write.

### Supporting changes
- `apps/contracts/scripts/deploy.js`: deploy both contracts; write both addresses to `deployments/contracts.json` (keep `address` for backward compat, add `auditLedgerAddress`).
- `apps/contracts/test/AuditLedger.test.js` + `npm run smoke`.
- Backend: `config/blockchainAbi.js` gains `AUDIT_LEDGER_ABI`; `config/env.js` gains optional `BLOCKCHAIN_AUDIT_LEDGER_ADDRESS` (validated like `BLOCKCHAIN_CONTRACT_ADDRESS`, fallback to `deployments/contracts.json.auditLedgerAddress`); `config/blockchain.js` `BlockchainProvider` gains `auditRecord(eventHash, category)`, `auditVerify(eventHash)`, `getAuditLedgerStatus()` (reads against the audit contract address, reusing the same provider/signer).

---

## 5. Backend Implementation

### New API endpoints (all behind `authenticate → authorize → validateRequest`)

| Method | Route | Roles | Purpose |
|---|---|---|---|
| GET | `/api/audit-logs` | All 4 | Paginated audit log query (search, action, result, resourceType, resourceId, actorId, dateFrom, dateTo, sortBy) |
| GET | `/api/audit-logs/:id` | All 4 | Single audit entry (includes anchor status + explorer link) |
| GET | `/api/audit-logs/summary` | All 4 | Counts by action/result for the audit dashboard |
| GET | `/api/blockchain/history` | All 4 | **Unified** ledger history: `recordType: 'Allocation' | 'Document' | 'Audit'` + pagination/filter |
| GET | `/api/blockchain/transactions/:id` | All 4 | Full transaction detail (reuses allocation record detail; resolves type) |
| GET | `/api/dashboard/timeline` | All 4 | Financial activity timeline (merged chronological feed) |
| POST | `/api/verification/documents` | All 4 | Multipart external-file verification against stored hashes + ledger |

`GET /api/blockchain/transactions`, `/status`, allocation verify/retry, and all document routes stay untouched.

### Layers

- **Repositories:** `repositories/auditLogRepository.js` (create — used by the sink; `findMany`, `count`, `findById`, `countByAction/Result`, `findUnconfirmed` for the scheduler). Follow `blockchainRepository.js` patterns (`buildWhere`/`buildOrderBy`, `MAX_LIMIT = 100`).
- **Services:**
  - `services/auditLogService.js` — query orchestration + `serialize` (BigInt→Number, `txExplorerUrl`).
  - `utils/auditPersistence.js` — **the sink**: given an `auditEntry` from `auditLogger`, builds the canonical payload, computes `eventHash`, inserts via `auditLogRepository.create`, then calls `auditEventBlockchainService.anchorEvent` fire-and-forget. All wrapped in try/catch; **never throws**.
  - `services/auditEventBlockchainService.js` — fail-soft anchoring of audit events + `retryEvent(id)`, mirroring `documentBlockchainService.retryVersion` exactly (reuse `blockchainService.anchorUnlessExists`-style logic against `auditRecord`).
  - `services/blockchainHistoryService.js` — union query: `blockchainRepository.findMany` (allocations) + document version anchors (documents) + `auditLogRepository` (audit events, only when anchored), each normalized to a common shape `{ id, recordType, code, hash, txHash, blockNumber, network, status, createdAt, explorerUrl, ref }`, merged and paginated.
  - `services/timelineService.js` — merges: recent `allocation_approvals` + `document_activities` + `audit_logs` + `blockchain_records`, sorted by `createdAt`, discriminated by `kind`. Paginated, filterable by date range and type.
  - Extend `documentBlockchainService` with `verifyExternalFile(file)` (stream → SHA-256 → `findVersionByHash` → integrity + on-chain check, mirroring `verifyDocument`).
- **Controllers:** `controllers/auditLogController.js`, `controllers/timelineController.js` (or fold into `dashboardController`), extend `controllers/blockchainController.js` (history, detail), extend `controllers/documentController.js` (verify-file).
- **Validators:** `validators/auditLogValidator.js` (query schema), extend `blockchainValidator.js` (history query schema), `verificationValidator.js` (multipart wrapper — reuse `uploadMiddleware` + `validateUploadedFile`; no new file rules beyond Phase 4.5's).
- **Wire-up:** mount `/audit-logs` and `/verification` in `routes/apiRouter.js`; extend the existing `/blockchain` and `/dashboard` routers. **Do not change the route order convention** (authenticate → authorize → validateRequest).
- **Scheduler:** extend `blockchainScheduler.reconcilePendingRecords` to also retry unconfirmed `AuditLog.anchorStatus` rows via `auditLogRepository.findUnconfirmed()`.

### Hash generation process (unchanged + reused)
- Documents: SHA-256 computed **server-side while streaming** (`documentStorageService.storeStream`); never trust a client-supplied hash. Reuse the exact same routine for external-file verification.
- Allocations: canonical JSON of record fields → SHA-256 (`utils/hashUtils.js`).
- Audit events: canonical JSON of the audit payload (includes UUID id + timestamp) → SHA-256.

### Error handling
- All new endpoints use the existing `AppError` / `apiError` / centralized `errorHandler` pipeline.
- Anchoring stays **fail-soft** (identical to Phase 4.5): DB write never fails because the ledger is down; `Pending/Failed` rows are retryable via the scheduler and a manual retry endpoint (`POST /api/audit-logs/:id/retry`, roles: Admin/Treasurer/BudgetOfficer).
- External-file verification with an unreachable node returns `inconclusive` + explanatory `message` (never a false "verified").

---

## 6. Frontend Implementation

### New pages / routes / sidebar

| Page | Route | Components | Notes |
|---|---|---|---|
| **Audit Logs** | `/audit-logs` | `AuditLogTable`, `AuditLogFilters`, `AuditLogDetailDrawer`, `AuditResultBadge`, `AuditAnchorStatusBadge` | Table + filters (action, result, resource type, date range, search) + detail drawer with anchor status, tx hash + explorer link, JSON details. Add sidebar group **SYSTEM → Audit Logs** (`ScrollText` icon), route under `ProtectedRoute` (all 4 roles). |
| **Blockchain Ledger (enhanced)** | `/budget-allocation/blockchain` | `BlockchainRecordTable` (add `recordType` column + type filter), **new `BlockchainTransactionDetail` drawer** | Existing page extended to consume `/blockchain/history`; verification dialog stays. |
| **Document Verification** | `/verification` | `FileVerificationCard`, `VerificationResult` | Drag-and-drop file → POST multipart → result panel (verified/inconclusive/tampered, matched document, version, on-chain details). New sidebar entry under Documents group. |
| **Financial Activity Timeline** | embedded on `/dashboard` | `FinancialActivityTimeline` (component) | Chronological feed of allocation approvals, document actions, blockchain anchors, audit events with kind badges + actor + relative time. |
| **History Viewer** | reuse existing | Existing `VersionTable` (document versions), `ApprovalHistory` (allocation approvals) — **no new work** | Phase 4.6 adds the system-wide view via Audit Logs + Timeline instead. |

### Data layer (follow the `services → hooks → pages` convention)

- `src/services/auditLogService.ts` — `getLogs`, `getLogById`, `getSummary`, `retryAnchor`.
- `src/services/verificationService.ts` — `verifyFile(File)` (multipart via `FormData`; the axios client already handles JWT/refresh).
- Extend `src/services/blockchainService.ts` — `getHistory`, `getTransactionDetail`.
- Extend `src/services/dashboardService.ts` — `getTimeline`.
- Hooks: `useAuditLogs.ts`, `useAuditLogSummary.ts`, `useAuditLogDetail.ts`, `useRetryAuditAnchor.ts`, `useBlockchainHistory.ts`, `useFinancialTimeline.ts`, `useFileVerification.ts`. All use TanStack Query with the toast/invalidate patterns from `useBlockchain.ts`.
- Types: `src/types/audit.ts`, `src/types/timeline.ts`, `src/types/verification.ts`; extend `src/types/blockchain.ts` with `LedgerHistoryEntry { recordType: 'Allocation' | 'Document' | 'Audit'; … }` and `BlockchainTransactionDetail`.
- Constants: `src/constants/auditActions.ts` (label/color map for every `AUDIT_ACTIONS` value), `src/constants/auditResult.ts`, `src/constants/auditAnchorStatus.ts`.
- `src/components/layout/sidebar/sidebarConfig.ts` + `src/routes/AppRoutes.tsx` updated to register new routes.

---

## 7. Security

| Threat | Mitigation |
|---|---|
| **Hash tampering (local/DB)** | Hashes computed server-side during streaming (`storeStream`); unique constraints on `sha256Hash`/`contentHash`; verification recomputes the hash from actual stored bytes and compares — any DB/disk tampering changes the digest. |
| **Silent DB rewrite of anchors** | Dual verification: `verified` requires **both** `integrityOk` (recomputed vs. stored) **and** `onChain.exists` (ledger holds the original hash). An attacker who rewrites both the blob and the DB hash still fails the on-chain check. |
| **Unauthorized modifications** | Every endpoint: `authenticate → authorize(roles) → validateRequest`. Ownership checks preserved (`assertCanModify`). Audit logs are **append-only** — there is no update/delete service method or route; `AuditLog` rows are only ever `create`. |
| **Blockchain interaction security** | Owner-only write functions; signer key held only in backend env (`BLOCKCHAIN_PRIVATE_KEY`), never serialized to responses or logs (sanitizer redacts `secret`/`token`/`password` keys). Reads are public `view` calls. Contract writes wrapped in fail-soft with explicit `Pending/Failed` states — no silent success. |
| **Audit log protection** | Append-only table + no mutate API + `details` sanitized by `sanitizeData` (existing redaction of passwords/tokens) before both console and DB write. Actor snapshots (email/name/role) guarantee attribution even if a user is later deactivated. |
| **False positives from dead nodes** | When the node is unreachable, results are `inconclusive` with an explicit message — never displayed as "verified." Anchor statuses are surfaced to the user (`Pending`/`Failed` badges + retry). |
| **Replay/duplicate anchoring** | Unique `eventHash`/`contentHash`/`sha256Hash`/`txHash`; on-chain `EventAlreadyRecorded`/`HashAlreadyRecorded` guards; anchorUnlessExists recovery covers crash-window duplicates. |
| **Log noise / PII** | Download/preview are read-only and **not** logged by default (decision point below); only state-changing and security-relevant actions are persisted. |

**Decision point:** optionally add `DOCUMENT_DOWNLOAD` / `DOCUMENT_PREVIEW` audit actions for full accountability. Recommended: keep them out unless the rubric requires tracking reads — otherwise log volume grows quickly.

---

## 8. Implementation Order (easiest → hardest)

### M1 — Persisted audit foundation *(no UI, no contract)*
- **Objective:** every existing action starts writing to `audit_logs`.
- **Tasks:** Prisma `AuditLog` model + enums → migration; `constants/auditAnchorStatus.js`; `auditLogRepository`; `utils/auditPersistence.js` sink wired into `auditLogger.log()` (fire-and-forget); add `AUDIT_LOG_DB_ENABLED` env (default `true`, tests can disable).
- **Dependencies:** none.
- **Output:** `npm run test:backend` passes; every action persisted; `npx prisma studio` shows rows.
- **Status:** ✅ Complete (2026-08-06).
  - Migration `20260806000000_add_audit_logs` created via `prisma migrate diff` + `prisma migrate deploy` (`migrate dev` is non-interactive in this shell); DB in sync.
  - New: `constants/auditAnchorStatus.js`, `repositories/auditLogRepository.js` (append-only: create + reads), `utils/auditPersistence.js` (SHA-256 `eventHash`, result mapping, Pending anchor, fire-and-forget, never throws), `AUDIT_LOG_DB_ENABLED` in `config/env.js` + `.env.example`.
  - `auditLogger.log()` now persists every entry; tests added to the `test` chain: `auditLogRepository.test.js`, `auditPersistence.test.js`.
  - Test isolation: `tests/auditTestConfig.js` (`disableAuditPersistence()`) wired into every test file that exercises audit-emitting services/controllers so the suite never touches the DB.

### M2 — Audit Log API + frontend
- **Objective:** queryable, filterable audit trail in the UI.
- **Tasks:** `auditLogService`/`controller`/`routes`/`validator`; mount in `apiRouter`; frontend types/constants/service/hooks; `AuditLogs` page + table + filters + detail drawer; sidebar + route.
- **Dependencies:** M1.
- **Output:** `GET /api/audit-logs` works; Audit Logs page renders live data; backend `auditLogService.test.js`/`auditLogRoutes.test.js` + frontend tests.

### M3 — Audit event on-chain anchoring
- **Objective:** audit/status-change events are cryptographically anchored.
- **Tasks:** `AuditLedger.sol` + contract tests + `deploy.js` update + redeploy + smoke; `AUDIT_LEDGER_ABI`, env var, provider audit methods; `auditEventBlockchainService` + scheduler integration; `anchorStatus`/`txHash`/`eventHash` populated; retry endpoint.
- **Dependencies:** M1.
- **Output:** audit events show `Confirmed` anchors + explorer links; contract + service + scheduler tests pass.

### M4 — Unified blockchain history + transaction details
- **Objective:** one ledger view across allocations, documents, audits.
- **Tasks:** `blockchainHistoryService` union query; `GET /blockchain/history` + `GET /blockchain/transactions/:id`; frontend `BlockchainTransactionDetail` drawer + type filter on `BlockchainRecordTable`; hooks/types.
- **Dependencies:** M3 (for audit entries).
- **Output:** Blockchain Ledger shows a unified type-aware history; detail drawer opens with anchor + explorer data.

### M5 — Financial activity timeline
- **Objective:** merged chronological feed on the dashboard.
- **Tasks:** `timelineService` + `GET /dashboard/timeline`; `FinancialActivityTimeline` component; `useFinancialTimeline`; dashboard integration.
- **Dependencies:** M2.
- **Output:** dashboard shows a scrollable, filterable activity timeline.

### M6 — External-file verification
- **Objective:** verify any file against the ledger without storing it.
- **Tasks:** `verifyExternalFile` in `documentBlockchainService`; `POST /api/verification/documents` (reuse `uploadMiddleware`/`validateUploadedFile`); `FileVerificationCard` + Verify Document page + service/hook; route + sidebar.
- **Dependencies:** none new (uses existing hashing/anchor code).
- **Output:** uploading a tampered/unmodified copy of a stored document reports correct verified/inconclusive/tampered results.

### M7 — Hardening, coverage audit, docs
- **Objective:** ship-ready phase.
- **Tasks:** audit **all** service call sites vs. `AUDIT_ACTIONS` (fill any gaps); append-only verification (no update/delete paths); sanitizer regression tests; add new backend test files to `package.json` `test` list; run `npm run test` + `npm run typecheck --workspace=apps/frontend` + `npm run build:frontend`; update docs/README for Phase 4.6.
- **Dependencies:** M1–M6.

---

## 9. Folder Structure

```
apps/contracts/
  contracts/AuditLedger.sol                        NEW
  test/AuditLedger.test.js                         NEW
  scripts/deploy.js                                EXTEND (deploy both, write auditLedgerAddress)

apps/backend/
  prisma/schema.prisma                             EXTEND (AuditLog, AuditResult, AuditAnchorStatus)
  constants/auditAnchorStatus.js                   NEW
  constants/auditActions.js                        EXTEND (new actions if any)
  config/blockchainAbi.js                          EXTEND (AUDIT_LEDGER_ABI)
  config/blockchain.js                             EXTEND (audit methods)
  config/env.js                                    EXTEND (BLOCKCHAIN_AUDIT_LEDGER_ADDRESS)
  repositories/auditLogRepository.js               NEW
  services/auditLogService.js                      NEW
  services/auditEventBlockchainService.js          NEW
  services/blockchainHistoryService.js             NEW
  services/timelineService.js                      NEW
  services/documentBlockchainService.js            EXTEND (verifyExternalFile)
  services/blockchainScheduler.js                  EXTEND (retry audit anchors)
  controllers/auditLogController.js                NEW
  controllers/timelineController.js                NEW
  controllers/blockchainController.js              EXTEND (history, detail)
  controllers/documentController.js                EXTEND (verify-file)
  routes/auditLogRoutes.js                         NEW
  routes/verificationRoutes.js                     NEW
  routes/apiRouter.js                              EXTEND
  routes/blockchainRoutes.js                       EXTEND
  routes/dashboardRoutes.js                        EXTEND
  validators/auditLogValidator.js                  NEW
  validators/verificationValidator.js              NEW
  validators/blockchainValidator.js                EXTEND
  utils/auditPersistence.js                        NEW  (sink; called by auditLogger)
  tests/auditLogRepository.test.js                 NEW
  tests/auditLogService.test.js                    NEW
  tests/auditLogRoutes.test.js                     NEW
  tests/auditEventBlockchainService.test.js        NEW
  tests/blockchainHistoryService.test.js           NEW
  tests/timelineService.test.js                    NEW
  tests/auditPersistence.test.js                   NEW
  package.json                                     EXTEND (test list)

apps/frontend/src/
  types/audit.ts, types/timeline.ts, types/verification.ts       NEW
  types/blockchain.ts                                            EXTEND
  constants/auditActions.ts, auditResult.ts, auditAnchorStatus.ts NEW
  services/auditLogService.ts, verificationService.ts            NEW
  services/blockchainService.ts, dashboardService.ts             EXTEND
  hooks/useAuditLogs.ts, useAuditLogSummary.ts, useAuditLogDetail.ts,
        useRetryAuditAnchor.ts, useBlockchainHistory.ts,
        useFinancialTimeline.ts, useFileVerification.ts          NEW
  pages/audit/AuditLogs.tsx                                      NEW
  pages/verification/VerifyDocument.tsx                          NEW
  pages/blockchain/BlockchainLedger.tsx                          EXTEND
  pages/Dashboard.tsx                                            EXTEND
  components/audit/AuditLogTable.tsx, AuditLogFilters.tsx,
              AuditLogDetailDrawer.tsx, AuditResultBadge.tsx,
              AuditAnchorStatusBadge.tsx                          NEW
  components/blockchain/BlockchainTransactionDetail.tsx           NEW
  components/dashboard/FinancialActivityTimeline.tsx             NEW
  components/verification/FileVerificationCard.tsx               NEW
  components/blockchain/BlockchainRecordTable.tsx                EXTEND (recordType)
  routes/AppRoutes.tsx, components/layout/sidebar/sidebarConfig.ts  EXTEND
```

---

## 10. Deliverables Checklist

**Database & backend**
- [ ] `audit_logs` migration applied (`npx prisma migrate dev`), enums created
- [ ] Audit persistence sink wired into `auditLogger`; every existing action persists (verify via studio / API)
- [ ] `AuditLog` repository/service/controller/routes/validators complete
- [ ] `AuditLedger.sol` compiled, tested, deployed; `contracts.json` has `auditLedgerAddress`
- [ ] Provider + env support audit ledger; anchor + verify + status methods working
- [ ] Audit events anchored on-chain (Confirmed) with scheduler auto-retry + manual retry endpoint
- [ ] `GET /api/blockchain/history` returns unified Allocation/Document/Audit history with correct pagination/filtering
- [ ] `GET /api/blockchain/transactions/:id` returns full detail incl. explorer links
- [ ] `GET /api/dashboard/timeline` returns merged financial activity feed
- [ ] `POST /api/verification/documents` verifies external files (tamper + inconclusive + verified cases)
- [ ] All new endpoints follow `authenticate → authorize → validateRequest`
- [ ] New backend test files added to `package.json` test list; `npm run test:backend` green

**Frontend**
- [ ] Audit Logs page: table, filters, pagination, detail drawer with anchor status + explorer links
- [ ] Blockchain Ledger shows unified type-aware history + transaction detail drawer
- [ ] Verify Document page works for tampered / valid / unreachable-node scenarios
- [ ] Dashboard shows the financial activity timeline
- [ ] Sidebar + routes registered; `npm run typecheck --workspace=apps/frontend` green
- [ ] Frontend component/hook tests added; `npm run test:frontend` green

**Security & integrity**
- [ ] No update/delete endpoint for audit logs (append-only verified by tests)
- [ ] Sanitizer regression tests confirm no passwords/tokens in `audit_logs.details`
- [ ] Verification never reports "verified" when the node is unreachable (`inconclusive` path tested)
- [ ] Ownership/RBAC reviewed for every new endpoint

**Finish line**
- [ ] `npm run test` (backend + frontend) passes
- [ ] `npm run build:frontend` passes
- [ ] Manual end-to-end: upload document → anchored → download → re-verify → timeline/audit log show the events → explorer links open
- [ ] `docs/` + README updated for Phase 4.6
