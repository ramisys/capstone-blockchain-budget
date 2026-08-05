# Project Changelog — BudgetChain

> **Scope:** complete chronological record of major development milestones, database schema migrations, API additions, smart contract deployments, architecture evolution, breaking changes, and documentation milestones across BudgetChain.  
> **Source of truth:** the implementation (`apps/backend/prisma/migrations/*`, `apps/backend/routes/*`, `apps/contracts/contracts/*`, `docs/*`).

---

## [v1.0.0] - 2026-08-06 — Comprehensive Technical Documentation Suite

### Added
- **Complete Documentation Suite:** Authored code-derived, single-source-of-truth documentation set in `docs/`:
  - Central navigation and source-of-truth hierarchy ([`docs/INDEX.md`](./INDEX.md)).
  - End-to-end architecture & request pipeline ([`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)).
  - Comprehensive 86-endpoint REST API reference ([`docs/API.md`](./API.md)).
  - Database ER model & Prisma schema guide ([`docs/DATABASE.md`](./DATABASE.md)).
  - EVM Smart Contracts & On-chain Anchoring guides ([`docs/SMART_CONTRACTS.md`](./SMART_CONTRACTS.md), [`docs/BLOCKCHAIN.md`](./BLOCKCHAIN.md)).
  - System testing strategy & 3-workspace test inventory ([`docs/TESTING.md`](./TESTING.md)).
  - Implementation phases & project roadmap ([`docs/PHASES.md`](./PHASES.md), [`docs/FUTURE_WORK.md`](./FUTURE_WORK.md)).
  - Verifiable system limitations & technical debt ([`docs/KNOWN_ISSUES.md`](./KNOWN_ISSUES.md)).
- **Audit Logging Subsystem Documentation:** Full specification for dual-destination audit logging, parameter redaction, and `AuditLedger` anchoring ([`docs/AUDIT_LOGS.md`](./AUDIT_LOGS.md)).
- **Notifications & Alerts Documentation:** Technical reference for dynamic read-time system alerts and toast portal ([`docs/NOTIFICATIONS.md`](./NOTIFICATIONS.md)).

### Changed
- **Allocation Code Prefix Standard:** Clarified canonical allocation code format in documentation as `BA-YYYY-XXX` (reflecting `repositories/allocationRepository.js`), superseding legacy `ALC-YYYY-XXXX` references.

---

## [v0.6.0] - 2026-08-06 — Audit Logging, Timeline Synthesis & AuditLedger Contract

### Added
- **Database Migration:** `20260806000000_add_audit_logs` — created append-only `audit_logs` table with `action`, `result`, `actor` snapshot, `details`, `eventHash`, `anchorStatus`, `txHash`, and `blockNumber`.
- **Smart Contract Deployment:** Deployed `AuditLedger.sol` contract supporting `recordEvent(bytes32,string)` and `EventRecorded` event emission for on-chain audit trail integrity.
- **Dual-Destination Audit Logger:** Added [`utils/auditLogger.js`](file:///d:/Ramisys%20files/Projects/capstone/apps/backend/utils/auditLogger.js) emitting structured console logs and triggering non-blocking fire-and-forget DB persistence (`persistAuditEntry`).
- **Sensitive Parameter Redaction:** Added recursive parameter sanitizer (`sanitizeData`) replacing passwords, tokens, secrets, and authorization headers with `[REDACTED]`.
- **Canonical SHA-256 Event Hashing:** Added deterministic payload serializer (`buildCanonicalPayload`) computing a unique 64-character SHA-256 `eventHash` per audit entry.
- **Activity Timeline & System Notifications:**
  - `GET /api/dashboard/timeline` — merged read-time union over allocation approvals, document activities, audit logs, and blockchain anchors.
  - `GET /api/dashboard/notifications` — dynamic read-time synthesis of inactive account warnings, pending approval queue alerts, and system health status.
- **Audit REST APIs:** `GET /api/audit-logs`, `GET /api/audit-logs/summary`, `GET /api/audit-logs/:id`, and `POST /api/audit-logs/:id/retry`.

---

## [v0.5.0] - 2026-08-05 — Secure Document Management & Tamper Verification

### Added
- **Database Migration:** `20260805000000_document_management` — created `documents`, `document_versions`, and `document_activities` tables.
- **Multipart Upload & Magic-Byte Inspection:** Added `uploadMiddleware.js` combining `multer` memory storage with `sniffMimeType` magic-byte signature checks (validating true PDF, PNG, JPEG, WEBP headers) and size limit enforcement (HTTP 413/415).
- **Single-Pass Stream Hashing:** Added `documentStorageService.js` performing single-pass SHA-256 hashing during local disk write with path traversal defense (`resolveKey`).
- **Version Control System:** `Document` and `DocumentVersion` models supporting up to 50 versions (`MAX_DOCUMENT_VERSIONS`), version bumping, version deletion, and duplicate replacement hash rejection.
- **Zero-Storage External File Verification:** `POST /api/documents/verify-file` streaming user-uploaded files in memory to compute SHA-256 digests and matching against database version records without writing bytes to disk.
- **Document REST APIs:** `GET /api/documents`, `POST /api/documents/upload`, `GET /api/documents/:id/download`, `POST /api/documents/:id/replace`, `DELETE /api/documents/:id`.

---

## [v0.4.0] - 2026-08-04 — Approval Workflow Engine & BudgetLedger Anchoring

### Added
- **Database Migrations:**
  - `20260804000000_allocation_approval_workflow` — created `allocation_approvals` table.
  - `20260804120000_blockchain_records` — created `blockchain_records` table.
  - `20260804140000_add_superseded_at` — added `supersededAt` timestamp to `blockchain_records`.
- **Smart Contract Deployment:** Deployed Solidity 0.8.24 `BudgetLedger.sol` contract supporting owner-only hash anchoring (`record`), duplicate detection (`HashAlreadyRecorded`), and `Recorded` event emission.
- **Multi-Tier Approval Engine:** `allocationService.js` supporting allocation state transitions (`Draft` → `PendingApproval` → `Approved` / `Rejected`). Self-review prevention guard (`assertApprover`) blocking creators from reviewing their own proposals.
- **Fail-Soft Ethers v6 Integration:** `blockchainProvider.js` handling wallet signing and fail-soft anchoring (`anchorUnlessExists`).
- **Background Scheduler:** In-process 60-second scheduler (`blockchainScheduler.js`) automatically retrying `Pending` or `Failed` record anchors.
- **Blockchain REST APIs:** `/api/blockchain/history`, `/api/blockchain/verify`, `/api/blockchain/status`, `/api/blockchain/retry-pending`, `POST /api/allocations/:id/retry`.

---

## [v0.3.0] - 2026-08-01 — Budget Allocation Core Engine

### Added
- **Database Migration:** `20260801000000_budget_allocations` — created `budget_allocations` table with `Decimal(14,2)` amounts and 5-tuple uniqueness constraint (`fiscalYearId`, `departmentId`, `fundSourceId`, `categoryId`, `programId`).
- **Sequential Code Generator:** Implemented `createWithSequentialCode` generating sequential codes per fiscal year (`BA-YYYY-XXX`) inside serializable transactions (`Prisma.TransactionIsolationLevel.Serializable`).
- **Fiscal Year Ceiling Validation:** Service-layer check validating that proposed allocations do not exceed total fiscal year budget limits.
- **Allocation REST APIs:** `GET /api/allocations`, `POST /api/allocations`, `GET /api/allocations/:id`, `PUT /api/allocations/:id`, `DELETE /api/allocations/:id`, `GET /api/allocations/code/:code`.

---

## [v0.2.0] - 2026-07-31 — Master Data Management Subsystem

### Added
- **Database Migration:** `20260731234833_master_data_tables` — created `fiscal_years`, `fund_sources`, `departments`, `budget_categories`, and `budget_programs` tables.
- **Master Data Validation & Services:** Code uppercase auto-formatting, description handling, status toggles (`Active`, `Inactive`, `Closed`), and full CRUD APIs under `/api/fiscal-years`, `/api/fund-sources`, `/api/departments`, `/api/budget-categories`, and `/api/budget-programs`.

---

## [v0.1.0] - 2026-07-28 — Foundation, Authentication & User Identity Core

### Added
- **Database Migration:** `20260728010255_init` — created `users` and `refresh_tokens` tables.
- **Backend Core Framework:** Express ESM server (`apps/backend`), Prisma ORM client with MySQL, centralized error handler (`errorHandler.js`), Zod validator (`validateRequest`).
- **Dual-Token Authentication:** JWT signing (15m access token, 7d refresh token with rotation), bcrypt password hashing (`saltRounds = 10`), rate limiting (`express-rate-limit`), security headers (`helmet`).
- **User Identity Management:** `User` model with 4 institutional roles (`Administrator`, `Treasurer`, `BudgetOfficer`, `Auditor`). Admin-only identity administration REST APIs (`GET`, `POST`, `PUT`, `DELETE /api/users`), last-admin protection, and self-deletion block.
- **Frontend Core Framework:** React 19 + Vite + TypeScript, Axios instance with JWT refresh interceptors, TanStack Query hooks, `AuthContext`, and route guards (`ProtectedRoute`, `PublicRoute`).
