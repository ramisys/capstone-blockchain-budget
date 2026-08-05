# Phase 4.5 — Document Management: Implementation Plan & Architecture

**Target system:** Blockchain-Based Budget Allocation and Expense Monitoring System
**Baseline:** Phases 4.1–4.4 complete (auth/RBAC, master data, allocation workflow + approval, blockchain anchoring of allocations)
**Governing conventions:** backend layered (routes → middleware → controllers → services → repositories), ESM + `.js` imports, `authenticate` → `authorize` → `validateRequest` on every endpoint, `Decimal(14,2)` money, soft deletes via `deletedAt`, audit via structured console logger, `BudgetLedger.sol` contract for hash anchoring, frontend services → TanStack Query hooks → pages, no `@/` alias.

---

## 1. Objectives

### 1.1 Purpose of the module
Provide a centralized, versioned, tamper-evident repository for the supporting documents of the budget cycle: purchase requests, purchase orders, quotations, receipts, invoices, disbursement vouchers, liquidation reports, budget proposals, contracts, and other evidence. Each document is uploaded once and tracked through a versioned lifecycle; every version is hashed (SHA-256) and the hash is anchored on the `BudgetLedger` contract.

### 1.2 Integration with the existing workflow
- **Link target:** documents attach to a `BudgetAllocation` (the existing anchor entity). The relation is a nullable FK so a document can also exist standalone (fiscal-year-level or department-level evidence).
- **Allocation lifecycle hook-in:**
  - *Draft* — BudgetOfficer uploads supporting docs (PR, quotation) as evidence for the request.
  - *PendingApproval → Approved* — approvers see attached documents in the approval dialog; approval can require attached documents.
  - *Approved (blockchain anchored)* — when an allocation is anchored, its attached documents are listed alongside its blockchain record; each document version carries its own anchored hash.
  - *Audit* — Auditor reviews documents and re-runs on-chain verification without needing app trust.
- This is **read-only integration**: the document module must not alter allocation status transitions; it adds an evidence layer that the approval workflow consumes.

### 1.3 Transparency, accountability, and blockchain verification
- **Transparency:** every uploaded file has a stable public-facing record (document code, type, uploader, version, hash) that any authenticated stakeholder can inspect.
- **Accountability:** persisted `DocumentActivity` timeline + structured audit logs record who uploaded, edited, replaced, archived, verified — and when.
- **Blockchain verification:** SHA-256 of each file version is written to `BudgetLedger`. Any byte-level alteration changes the digest; re-verification then reports tampering. The on-chain anchor survives DB loss.

---

## 2. Functional Requirements

| # | Feature | Requirement |
|---|---------|-------------|
| FR-1 | **Document upload** | Single multipart upload per version. Supports progress feedback, cancellation, and resume-free retry (idempotent by client-generated upload token). |
| FR-2 | **Document storage** | Bytes stored outside the DB (content-addressed object store / filesystem), metadata + hashes in MySQL. Never store blobs in the database. |
| FR-3 | **Metadata management** | Title, description, document type, fiscal year, linked allocation/department, tags; editable while the document is `Active`, recorded in activity log. |
| FR-4 | **File validation** | Extension + **magic-byte MIME sniffing** (not the client-supplied header), size limit, reject executable/script/archive types, require extension to match detected MIME. |
| FR-5 | **Preview & download** | Authenticated download (with `Content-Disposition: attachment`); preview endpoint for images/PDFs via `inline` content type + auth. No anonymous access. |
| FR-6 | **Search & filtering** | Full-text-ish search over code, title, file name, description, linked allocation code; filters: type, status, fiscal year, department, uploader, date range, blockchain status. Paginated + sortable. |
| FR-7 | **Versioning** | Replace = create new `DocumentVersion`; previous version kept immutable and auditable; a single version is always `current`; optional replace reason. |
| FR-8 | **Access control** | RBAC enforcement at both route and service layer; owner-scoped restrictions (e.g., BudgetOfficer edits own documents only). |
| FR-9 | **Blockchain hash verification** | On-demand verify per document/version: recompute hash, compare to DB, confirm anchor on-chain via `verify(bytes32)`. |
| FR-10 | **Activity history** | Persisted timeline of every action on a document (upload, metadata change, replace, archive, verify, retry) with actor + timestamp + summary. |
| FR-11 | **Status management** | Document lifecycle: `Active` → `Archived` (soft state), with `deletedAt` soft-delete mirroring the allocation pattern. No hard deletes. |
| FR-12 | **Blockchain retry** | `Pending`/`Failed` anchors re-attempted on demand and by the existing scheduler. |
| FR-13 | **Recommended extras** | Duplicate detection (hash match against existing documents); document codes `DOC-YYYY-NNNN` (sequential per fiscal year, reuse the allocation code-generation pattern); bulk download (zip) later; verified badge per version. |

---

## 3. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Security** | Zero-trust file ingress: size caps, type allow-list + magic-byte check, safe server-generated storage keys, no user-controlled paths, authenticated downloads, rate-limited uploads, secrets never in client code. |
| **Performance** | Streaming I/O (no whole-file buffering in memory) for upload, hashing, download. List queries < 300ms at 10k docs. Hash computation overlapped with storage write. |
| **Scalability** | Stateless API tier; storage decoupled from app process; DB indexes cover all filter paths; pagination (max 100/page); no per-request synchronous on-chain writes on hot paths (anchoring is best-effort + background reconciliation). |
| **Reliability** | Idempotent uploads; transactional DB writes; fail-soft anchoring (file accepted even if chain is down, record marked `Pending`, later retried — mirrors `blockchainService` behavior). |
| **Availability** | Single-node local storage is acceptable for the capstone; production path documented for replicated object storage. App must remain functional when the chain node is unreachable. |
| **Auditability** | Every mutation and every verify is logged (structured console audit + persisted `DocumentActivity`). Blockchain verification result recorded in activity history. |
| **Maintainability** | Follow the existing layered architecture exactly; storage provider behind a `storageService` interface so local ↔ S3 ↔ IPFS swap requires one module change. |
| **Storage efficiency** | Store each version once; reuse content-address dedupe (identical bytes share storage) as a recommended enhancement; archive policy configurable (compress/offload old versions). |

---

## 4. User Roles and Permissions

Roles come from `constants/roles.js` (Administrator, Treasurer, BudgetOfficer, Auditor).

| Capability | Administrator | Treasurer | Budget Officer | Auditor |
|-----------|:---:|:---:|:---:|:---:|
| Upload documents | ✅ | ✅ | ✅ (own only) | ❌ |
| View documents (metadata + content) | ✅ | ✅ | ✅ | ✅ |
| Edit metadata | ✅ | ✅ (own or allocation-linked) | ✅ (own only) | ❌ |
| Replace file (new version) | ✅ | ✅ (own or linked) | ✅ (own only) | ❌ |
| Link/unlink allocation | ✅ | ✅ | ✅ (own drafts) | ❌ |
| Verify blockchain hash | ✅ | ✅ | ✅ | ✅ |
| Delete / archive documents | ✅ (any) | ✅ (own/linked) | ✅ (own `Active` only) | ❌ |
| Download documents | ✅ | ✅ | ✅ | ✅ |
| View activity history | ✅ | ✅ | ✅ | ✅ |
| Retry failed anchor | ✅ | ✅ | ✅ | ✅ (view only) |

**Service-layer rules (in addition to route RBAC):**
- BudgetOfficer scoping: create/edit/replace/archive restricted to documents where `uploadedBy === actor.id` (or allocation creator) and status `Active`.
- Auditor: strictly read + verify.
- No user can delete another actor's document except an Administrator.
- `ForbiddenError` (existing `errors/apiError.js`) for authorization failures inside services.

---

## 5. Supported Document Types

### 5.1 Categories (enum `DocumentType`)
| Code | Label |
|------|-------|
| `PurchaseRequest` | Purchase Request |
| `PurchaseOrder` | Purchase Order |
| `Quotation` | Quotation |
| `Receipt` | Receipt |
| `Invoice` | Invoice |
| `DisbursementVoucher` | Disbursement Voucher |
| `LiquidationReport` | Liquidation Report |
| `BudgetProposal` | Budget Proposal |
| `Contract` | Contract |
| `Other` | Other Supporting Document |

### 5.2 Accepted file formats and limits
| Category | Extensions | MIME (magic-byte verified) |
|----------|-----------|-----------------------------|
| PDF | `.pdf` | `application/pdf` |
| Word | `.doc`, `.docx` | `application/msword`, `...wordprocessingml.document` |
| Excel/CSV | `.xlsx`, `.xls`, `.csv` | `application/vnd.ms-excel`, `...spreadsheetml.sheet`, `text/csv` |
| Images | `.jpg`, `.jpeg`, `.png`, `.tiff`, `.webp` | `image/*` |
| Text | `.txt` | `text/plain` |

- **Max file size:** 25 MB default (`MAX_FILE_SIZE` env), rejected with `413`. Streaming hash + stream-to-disk so size is enforced during the stream, not after buffering.
- **Hard rejects:** executables (`.exe`, `.dll`, `.sh`, `.bat`), scripts, archives (`.zip`, `.rar`, `.7z`), HTML/SVG (XSS risk), and any file whose extension contradicts magic bytes.
- **Max versions per document:** 50 (configurable) — prevents unbounded storage growth.

---

## 6. System Workflow

### 6.1 Upload a document
```
User (BudgetOfficer)            API                           Service                    Storage            Chain            DB
    |  multipart POST /api/documents  |                            |                       |                |                 |
    |-------------------------------->|  authenticate/authorize    |                       |                |                 |
    |                                 |  upload limits + scan     |                       |                |                 |
    |                                 |----------------------> documentService.upload()  |                |                 |
    |                                 |                           | validateFile()        |                |                 |
    |                                 |                           |   (size/mime/magic)   |                |                 |
    |                                 |                           | generate storageKey   |                |                 |
    |                                 |                           | stream->disk  ------->| storeBlob()     |                 |
    |                                 |                           | stream->sha256 ----> hash                  |                 |
    |                                 |                           | (fire-and-forget) anchor(hash) ---------->| contract.record()|
    |                                 |                           | save metadata row --------------------------------->|
    |                                 |<--------------------------| serialize + verify status                     |                 |
    |<--------------------------------|
```

### 6.2 Validate a file
```
1. Check size against MAX_FILE_SIZE (413 if exceeded)
2. Check extension against allow-list (415 if not)
3. Read first bytes; sniff real MIME (415 if unrecognized or in deny-list)
4. Compare detected MIME family vs extension; mismatch -> 415
5. Reject active/executable/archive/HTML-SVG types
6. Derive safe storage key = "<uuid>.<safeExt>" (NEVER use original filename)
7. Stream bytes -> disk AND SHA-256 in a single pass
```

### 6.3 Compute SHA-256 hash
- Hash the **raw file bytes**, streamed via `crypto.createHash('sha256').update(chunk)` while writing to storage — one pass, constant memory.
- Result: 64-char hex digest. Stored in `DocumentVersion.sha256Hash` (unique) and anchored as `0x<digest>` on-chain.
- **Rationale:** file-hash anchoring makes the ledger a tamper-evident store for the evidence itself; metadata drift is captured by the DB + activity log instead.

### 6.4 Record hash on blockchain
```
1. After bytes are safely persisted (fail-soft):
   if provider configured and has signer -> try contract.record("0x"+hash)
      success: txHash, blockNumber, status=Confirmed, confirmedAt=now
      revert HashAlreadyRecorded -> recover via verify() (mirrors anchorUnlessExists)
      node unreachable        -> status=Pending/Failed, keep hash
   else (unconfigured) -> status=Pending
2. Persist blockchain fields on the DocumentVersion row
3. Scheduler (existing 60s loop) picks up Pending/Failed doc anchors and retries
```

### 6.5 Save metadata
- Zod schema (in `validators/documentValidator.js`) validates title, type, allocation link, fiscal year, description.
- References (allocation/fiscal year) existence-checked in the service (mirrors `validateReferences` in `allocationService`).
- Metadata + initial version persisted in one DB transaction; `DocumentActivity` row appended.

### 6.6 View / Download a document
```
View:
GET /api/documents/:id  -> metadata + current version + verification status (no blob)
GET /api/documents/:id/versions -> version history
Download:
GET /api/documents/:id/download?version=<n>
  -> auth + role check (all roles)
  -> resolve storage key from DB (version id), stream from storage
  -> headers: Content-Disposition: attachment; filename*=UTF-8''<encoded>; Content-Type: detected mime
  -> optional on-the-fly hash verify before serving (config flag)
```

### 6.7 Verify document integrity
```
GET /api/documents/:id/verify
 1. Load current version (or ?version=n)
 2. integrityOk = recompute SHA-256 of stored bytes == stored sha256Hash   (tamper check)
 3. onChain     = provider.verify("0x"+hash) -> {exists, anchoredBy, anchoredAt, blockNumber}
 4. verified    = integrityOk && onChain.exists
 5. Write DocumentActivity (verify) + audit log
 6. Return { verified, integrityOk, onChain, inconclusive, version, message }
```

### 6.8 Replace a document (version control)
```
POST /api/documents/:id/replace (multipart)
 1. Load doc; must be Active; BudgetOfficer must be owner
 2. Validate new file (6.2), compute hash, write bytes (6.3)
 3. Create DocumentVersion (versionNumber = max+1), blockchainStatus=Pending
 4. Anchor hash (6.4) fail-soft
 5. Update document.currentVersionId -> new version, record replaceReason
 6. Old version remains fully stored, immutable, downloadable, verifiable
 7. Activity log: "Document replaced v2 <- v3"
```

---

## 7. Database Design

### 7.1 Recommended tables

**`managed_documents`** — one row per logical document (a version lineage).
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | VARCHAR(36) | PK, uuid |
| `documentCode` | VARCHAR(20) | UNIQUE, `DOC-YYYY-NNNN` |
| `title` | VARCHAR(200) | NOT NULL |
| `description` | VARCHAR(1000) | NULL |
| `documentType` | ENUM | NOT NULL (DocumentType) |
| `fiscalYearId` | VARCHAR(36) | FK → fiscal_years, NULL |
| `departmentId` | VARCHAR(36) | FK → departments, NULL |
| `allocationId` | VARCHAR(36) | FK → budget_allocations, NULL |
| `status` | ENUM | `Active` / `Archived`, default `Active` |
| `currentVersionId` | VARCHAR(36) | FK → document_versions, NULL (set after v1) |
| `uploadedBy` | VARCHAR(36) | FK → users |
| `archivedBy` | VARCHAR(36) | FK → users, NULL |
| `archivedAt` | DATETIME | NULL |
| `deletedAt` | DATETIME | NULL (soft delete) |
| `createdAt` / `updatedAt` | DATETIME | defaults |

**`document_versions`** — one row per physical file.
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | VARCHAR(36) | PK, uuid |
| `documentId` | VARCHAR(36) | FK → managed_documents, onDelete Cascade |
| `versionNumber` | INT | NOT NULL |
| `originalFileName` | VARCHAR(255) | NOT NULL (display only) |
| `storageKey` | VARCHAR(255) | NOT NULL, UNIQUE |
| `mimeType` | VARCHAR(100) | NOT NULL |
| `fileSizeBytes` | BIGINT | NOT NULL |
| `fileExtension` | VARCHAR(10) | NOT NULL |
| `sha256Hash` | CHAR(64) | NOT NULL, UNIQUE |
| `blockchainStatus` | ENUM | `Pending`/`Confirmed`/`Failed` (reuse BlockchainRecordStatus) |
| `txHash` | VARCHAR(66) | UNIQUE, NULL |
| `blockNumber` | BIGINT | NULL |
| `network` | VARCHAR(50) | NULL |
| `confirmedAt` | DATETIME | NULL |
| `replaceReason` | VARCHAR(500) | NULL (for v2+) |
| `uploadedBy` | VARCHAR(36) | FK → users |
| `uploadedAt` | DATETIME | default now |
| `createdAt` | DATETIME | default now |
| `UNIQUE(documentId, versionNumber)` | | composite |

**`document_activities`** — persisted activity/audit timeline (new; allocation history analog `allocation_approvals`).
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | VARCHAR(36) | PK, uuid |
| `documentId` | VARCHAR(36) | FK → managed_documents, onDelete Cascade |
| `versionId` | VARCHAR(36) | FK → document_versions, NULL |
| `actorId` | VARCHAR(36) | FK → users |
| `action` | VARCHAR(50) | NOT NULL (e.g. `UPLOAD`, `METADATA_UPDATE`, `REPLACE`, `ARCHIVE`, `VERIFY`, `ANCHOR_RETRY`) |
| `details` | JSON | NULL (structured diff/result summary) |
| `createdAt` | DATETIME | default now |

### 7.2 Relationships
```
users 1 ─── * managed_documents (uploadedBy / archivedBy)
users 1 ─── * document_versions (uploadedBy)
users 1 ─── * document_activities (actorId)

managed_documents 1 ─── * document_versions
managed_documents 1 ───── 1 currentVersion (nullable, circular FK)
managed_documents 1 ─── * document_activities

budget_allocations 1 ─── * managed_documents (nullable)
fiscal_years      1 ─── * managed_documents (nullable)
departments       1 ─── * managed_documents (nullable)
```
`currentVersionId` circular FK is optional and **recommended** (simple read path). Set with a two-step insert if Prisma requires it, or store current version as a column on the version row (`isCurrent BOOLEAN`) as the simpler alternative.

### 7.3 Constraints & indexes
- **Constraints:** FK integrity everywhere; unique `sha256Hash` (natural dedupe + duplicate detection); unique `storageKey`; composite unique `(documentId, versionNumber)`; check `versionNumber >= 1`.
- **Indexes (Prisma `@@index`):** `documentCode`, `(allocationId)`, `(fiscalYearId)`, `(departmentId)`, `(documentType)`, `(status)`, `(uploadedBy)`, `(createdAt)`, `(deletedAt)`; on `document_versions`: `(documentId)`, `(sha256Hash)`, `(blockchainStatus)`, `(uploadedAt)`; on `document_activities`: `(documentId, createdAt)`.
- **Migration rule:** new migration via `npx prisma migrate dev` from `apps/backend`; never edit applied migrations.

---

## 8. Storage Architecture

### 8.1 Options compared
| Approach | Advantages | Disadvantages |
|----------|-----------|---------------|
| **Local filesystem** | Zero infra, trivial for capstone, fast | Not horizontally scalable, node-local backups required |
| **Cloud object storage (S3/Azure Blob)** | Scalable, replicated, cheap, SSE at rest, presigned URLs | Vendor dependency, needs keys/creds, cost management |
| **IPFS** | Content-addressed, public verifiability, aligns with "blockchain" narrative | Unreliable for guarantees, needs a gateway/pinning service, latency, no auth, mutable-name complexity |
| **Hybrid** | Flexibility: local for dev, object store for prod, optional IPFS publication of the hash+pointer | Most moving parts, needs an abstraction layer |

### 8.2 Recommendation: **Hybrid via a storage abstraction (local default, S3-compatible adapter, optional IPFS publish)**
- `storageService` interface with two methods: `storeStream(stream, key) → {sizeBytes, sha256}` and `openReadStream(key)`. Implementations: `LocalFileStorage` (default, `apps/backend/storage/documents/`) and `S3Storage` (selected by `STORAGE_DRIVER=local|s3`).
- **Why not IPFS as primary:** no access control, no availability SLA, and the capstone's on-chain integrity is already achieved by anchoring the SHA-256. IPFS is optional: publish `{sha256Hash, storageKey}` CID to give the public a redundant pointer. Keep it behind the same interface so it can be added later.
- **Security:** server-side generated `uuid` storage keys (never the original filename) under a dedicated root; path containment check (`resolve(path).startsWith(root)`) defeats traversal; AES-256-GCM encryption at rest optional for local (key from env); S3 uses SSE-KMS.
- **Backup strategy:** nightly backup of the storage root + MySQL dump together (metadata references storage keys — a backup of one without the other is useless); verify restore quarterly; keep `sha256Hash` so post-restore integrity of every blob is verifiable.

---

## 9. Blockchain Integration

### 9.1 On-chain vs off-chain
| Stored on-chain | Remains off-chain |
|-----------------|-------------------|
| SHA-256 digest of each file version | File bytes (storage) |
| Anchoring address + timestamp + block number | Full metadata, version chain, activity log |
| (via `Recorded` event) tamper-evident receipt | Document code, uploader, status |

**Why:** files are large and mutable-in-context; the ledger is for *proof*, not content. The hash binds the bytes; the DB binds the hash to the document.

### 9.2 Hash generation
- Streaming SHA-256 over the file bytes (section 6.3), single pass while persisting.
- Canonical lowercase hex; anchored as `0x<hex>` (matches `blockchainService.anchorUnlessExists`).

### 9.3 Verification workflow
```
recompute sha256(stored bytes)  ──> integrityOk
provider.verify("0x"+sha256Hash) ─> onChain {exists, anchoredBy, anchoredAt, blockNumber}
verified = integrityOk && onChain.exists
inconclusive = !verified && integrityOk && node unreachable
```
Reuses the existing `blockchainProvider.verify` and mirrors `blockchainService.verifyAllocation`'s response shape so the frontend verification card is reusable.

### 9.4 Smart contract responsibilities
The existing `BudgetLedger` contract **already provides everything needed** — no new contract is required:
- `record(bytes32)` — owner-only anchor; reverts `HashAlreadyRecorded` (handled by recover-on-verify logic).
- `verify(bytes32)` — read-only check; `getRecord`, `recordCount` for status dashboard.
- One possible extension (deferred, optional): `records(bytes32)` event-based listing. **Not required.**

### 9.5 Gas optimization
- Anchor **one hash per file version** (never per chunk); hashing happens off-chain for free.
- Fail-soft anchoring keeps upload latency independent of chain confirmation.
- Pending/failed anchors are batched and retried by the existing `blockchainScheduler` (60s interval), amortizing node load; `anchorUnlessExists` avoids paying gas for a revert when the hash is already recorded.
- Reads (`verify`) are free view calls — the audit path incurs no gas.

---

## 10. API Design

All under `/api/documents`. Every route: `authenticate` (router-level) → `authorize(...)` → `validateRequest(zod, source)`. Response envelope via `formatSuccessResponse`. Errors via centralized `errorHandler` (400/401/403/404/409/413/415/503).

| Method | Route | Authz | Request | Response |
|--------|-------|-------|---------|----------|
| `POST` | `/api/documents` | Admin, Treasurer, BudgetOfficer (own) | `multipart/form-data`: `file`, `title`, `documentType`, `description?`, `allocationId?`, `fiscalYearId?`, `departmentId?` | `201` `{ document }` (with version + blockchain status) |
| `GET` | `/api/documents` | all | query: `page`, `limit`, `search`, `documentType`, `status`, `fiscalYearId`, `departmentId`, `allocationId`, `uploadedBy`, `dateFrom`, `dateTo`, `blockchainStatus`, `sortBy`, `sortOrder` | `200` `{ documents[], pagination }` |
| `GET` | `/api/documents/:id` | all | — | `200` `{ document }` (incl. current version + verification status) |
| `GET` | `/api/documents/:id/download` | all | query: `version?` (default current) | `200` binary stream + attachment headers |
| `GET` | `/api/documents/:id/preview` | all | — | `200` inline content (images/PDF only) |
| `PUT` | `/api/documents/:id` | Admin, Treasurer, BudgetOfficer (own) | body: `{ title?, description?, documentType?, allocationId?, departmentId?, fiscalYearId? }` | `200` `{ document }` |
| `POST` | `/api/documents/:id/replace` | Admin, Treasurer, BudgetOfficer (own) | `multipart/form-data`: `file`, `replaceReason?` | `200` `{ document, version }` |
| `GET` | `/api/documents/:id/versions` | all | — | `200` `{ versions[] }` |
| `GET` | `/api/documents/:id/verify` | all | query: `version?` | `200` `{ verified, integrityOk, onChain, inconclusive, message }` |
| `POST` | `/api/documents/:id/retry` | Admin, Treasurer, BudgetOfficer, Auditor | — | `200` `{ version }` (re-anchor Pending/Failed) |
| `GET` | `/api/documents/:id/activity` | all | — | `200` `{ activities[] }` |
| `DELETE` | `/api/documents/:id` | Admin (any), Treasurer/BudgetOfficer (own `Active`) | — | `200` `{ message }` (archives + soft-deletes, keeps versions) |

**Key decisions**
- `GET /:id/download` declared before `GET /:id` is unnecessary — Express matches sub-paths independently; but keep `/statistics`-style static routes above `/:id` per existing convention if a stats endpoint is added.
- Upload/replace use `multer` with `limits.fileSize`; validation happens in a dedicated `uploadMiddleware` (limits, allow-list, magic bytes) before the controller.
- Archive ≠ delete: `DELETE` sets `status=Archived` + `deletedAt`, preserving chain-of-evidence (matching `allocationRepository.softDelete`).

---

## 11. Frontend Planning

### 11.1 Pages
| Route | Page | Purpose |
|-------|------|---------|
| `/documents` | `DocumentList` | Search/filter/table of documents |
| `/documents/upload` | `DocumentUpload` | Upload form (drag-and-drop + metadata) |
| `/documents/:id` | `DocumentDetail` | Metadata, current version, verification status, actions |
| `/documents/:id/versions` | `VersionHistory` | Version timeline + per-version download/verify |
| `/documents/:id/activity` | `ActivityTimeline` | Audit trail |

Sidebar: add a **"Document Management"** group (icon e.g. `FileText`/`FolderOpen`) under MANAGEMENT between Budget Allocation and Expense Tracking, marking "Expense Tracking" `Planned` status stays untouched.

### 11.2 Components
- `DocumentUploadDropzone` — drag/drop, size/type pre-checks, progress bar, upload state (reuse existing `Spinner`, `Toast`).
- `DocumentTable` + `DocumentFilters` + `DocumentSearch` — mirror `AllocationTable`/`AllocationFilters`/`AllocationSearch` patterns; reuse `Pagination`, `SortableHeader`.
- `DocumentTypeBadge`, `DocumentStatusBadge`, `BlockchainStatusBadge` (reuse existing `BlockchainStatusBadge`).
- `VerificationCard` — reuse `BlockchainVerificationCard` (adapted): verified / integrity-failed / inconclusive states with tx explorer link (backend already returns `txExplorerUrl`).
- `VersionTable` — version number, uploader, date, size, hash (copyable), blockchain status, actions (download/verify).
- `ActivityTimeline` — chronologically grouped activity feed with actor avatars.
- Dialogs: `DocumentUploadDialog`, `DocumentReplaceDialog`, `DocumentArchiveDialog`, `DocumentDetailsDialog`, `DocumentVerifyDialog` — following the existing `components/dialogs/*` conventions.

### 11.3 Data layer
- `src/types/document.ts` — `ManagedDocument`, `DocumentVersion`, `DocumentActivity`, `DocumentListParams`, `VerificationResult`, `DocumentType`.
- `src/services/documentService.ts` — `documentApi` mirroring `allocationService.ts` (FormData for multipart with `apiClient`; download via `blob` response).
- Hooks: `useDocuments`, `useDocument`, `useDocumentVersions`, `useDocumentActivities`, `useVerifyDocument`, `useUploadDocument`, `useReplaceDocument` (TanStack Query mutations + invalidation, matching `useAllocations.ts`).
- Constants: `src/constants/documentType.ts`, `documentStatus.ts` (mirror backend UPPER_SNAKE → PascalCase).

### 11.4 Verification status indicators
- Badge on table rows: Confirmed (green ✓), Pending (amber clock), Failed (red), plus integrity-failed alert on detail page (red "Hash mismatch — possible tampering").
- Link from allocation detail → attached documents; from blockchain ledger row → document verify.

---

## 12. Security Planning

| Concern | Recommendation |
|---------|----------------|
| **Authentication** | JWT via existing `authenticate` middleware; tokens never in URLs; short-lived access + refresh rotation already in place. |
| **Authorization** | RBAC at route level + ownership/service-level checks (`ForbiddenError`); verify every `documentId` param belongs to authorized scope. |
| **File validation** | Whitelist extensions; magic-byte sniffing with `file-type`; reject mismatches; enforce size cap *during* stream. |
| **Virus/malware scanning** | Optional ClamAV `clamscan` subprocess hook (async, non-blocking, result stored); for capstone without ClamAV, rely on type allow-list + magic bytes and document the gap. |
| **MIME verification** | Detected MIME stored and served, not the client header; preview whitelist (PDF/images) only. |
| **Path traversal prevention** | Storage key is server-generated UUID; resolved path must stay inside storage root (`path.resolve` containment check); original filename only used for display and encoded in `Content-Disposition`. |
| **Secure file naming** | `"<uuid>.<ext>"`; never reflect user input into filesystem paths. |
| **Encryption at rest** | AES-256-GCM (key from env) for local storage; SSE-KMS for S3; DB already behind MySQL encryption (recommend enabling). |
| **Secure downloads** | Auth required for every download (no public URLs); `attachment` disposition; `X-Content-Type-Options: nosniff`; optional streaming hash check before serving. |
| **Rate limiting** | Reuse `express-rate-limit`; separate stricter limit for upload endpoints (e.g., 20/min) plus concurrent-upload guard; existing login/sensitive limits unchanged. |
| **Logging** | `requestLogger` (morgan) + structured `auditLogger` for every document action; never log file contents or hashes with PII. |
| **Audit trails** | Persisted `DocumentActivity` (authoritative timeline) in addition to console audit; immutable (no update/delete endpoints). |

---

## 13. Testing Strategy

Follow the repo's conventions: backend = plain `node` scripts with `node:assert/strict` + monkey-patched repositories (no mocking lib, no DB); frontend = Vitest + Testing Library via `renderWithProviders`. New backend tests must be appended to the hardcoded `test` script in `apps/backend/package.json`.

| Level | Scope | Key cases |
|-------|-------|-----------|
| **Unit** | `documentService`, `fileUtils`, `storageService`, `documentValidator`, `hashUtils` (extended) | hash stability, code generation, ownership checks, status transitions, size/type validation |
| **Integration** | service ↔ repository (monkey-patched prisma) | create + version insert in transaction, archive keeps versions, duplicate hash detection, replace flow |
| **API** | `documentRoutes.test.js` (supertest-style against route handler) | auth required, RBAC matrix per endpoint, 400/403/404/409/413/415 responses |
| **File upload** | `uploadMiddleware` tests | correct file passes, wrong magic bytes rejected, oversized rejected mid-stream, empty file, path traversal filename ignored |
| **Blockchain verification** | `blockchainDocument.test.js` | anchor success → Confirmed; node down → Pending then retry; `HashAlreadyRecorded` recovery; verify integrity+on-chain states; scheduler picks up doc records |
| **Security** | targeted tests | MIME mismatch, executable/script/HTML rejection, ownership escalation attempts, traversal attempts, oversized bodies |
| **Performance** | benchmark script (optional) | 25 MB upload under 5 s local, list query p95 < 300 ms at 10k rows, memory constant during 25 MB hash |
| **Edge cases** | service tests | duplicate file (same hash), replace beyond max versions, archive of already-archived, verify with no version, deleted/archived access, concurrent upload idempotency |
| **Failure scenarios** | fault injection | DB write fails after blob write (orphan cleanup), storage write fails (no metadata row), chain tx times out (Pending + retry), download of missing blob → 404 |

Frontend: `DocumentList.test.tsx`, `DocumentDetail.test.tsx`, `DocumentUpload.test.tsx`, `VersionHistory.test.tsx`, `VerificationCard.test.tsx`, plus `documentService` mock tests.

---

## 14. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Large file uploads** | Memory/CPU exhaustion, timeouts | 25 MB cap enforced mid-stream; streaming (never buffer whole file); dedicated rate limiter; chunked proxy already in Vite. |
| **Corrupted files** | Tampered or broken evidence | SHA-256 stored at upload; on-demand and periodic re-hash; download-time integrity check flag. |
| **Duplicate uploads** | Storage bloat, confusing records | Unique `sha256Hash` + duplicate detection UX ("this file already exists — DOC-xxxx"). |
| **Blockchain transaction failures** | Anchor lost, doc appears unverified | Fail-soft: mark `Pending`/`Failed`, keep bytes; background scheduler retry; manual `retry` endpoint; `HashAlreadyRecorded` recovery via on-chain verify. |
| **Storage failures** | Data loss | Storage abstraction; backups of blobs + DB taken together; restore-verify with hashes; orphan-blob cleanup on failed metadata write. |
| **Unauthorized access** | Data leak | Route + service RBAC, ownership checks, no public URLs, signed/authenticated downloads, rate limits, audit logging. |
| **Hash mismatches** | False tamper alerts | Distinguish `integrityOk=false` (tampering) from `inconclusive` (node unreachable) in both response and UI; document the semantics. |
| **Unbounded version growth** | Storage cost | Max 50 versions/document; archive policy; optional compression/offload of old versions. |

---

## 15. Development Roadmap

Sub-phases, in implementation order (each is independently testable, integrates cleanly with Phases 4.1–4.4):

| Sub-phase | Objectives | Deliverables | Dependencies |
|-----------|-----------|--------------|--------------|
| **4.5.1 Data & storage foundation** | Prisma models, env config, constants, storage abstraction | Migration (`managed_documents`, `document_versions`, `document_activities`), `config/storage.js`, `services/documentStorageService.js`, `utils/fileUtils.js` (hash, sniff, safe names), `constants/documentType.js`, `constants/documentStatus.js`, `.env.example` additions | Phase 4.1 (env), 4.2 (master data), 4.3 (allocation FK) |
| **4.5.2 Core CRUD API** | Upload/list/get/download/preview/metadata/archive | `documentRepository.js`, `documentService.js`, `documentController.js`, `documentRoutes.js`, `documentValidator.js`, `uploadMiddleware.js`; mount in `apiRouter.js`; register new audit actions | 4.5.1 |
| **4.5.3 Versioning & replace** | Version chain, replace flow, versions endpoint | Version logic in service/repository, `replace` endpoint, version limit + dedupe rules | 4.5.2 |
| **4.5.4 Blockchain anchoring & verification** | Anchor each version, verify, retry, scheduler | Reuse `blockchainProvider`; extend `blockchainService` or add `documentBlockchainService`; scheduler picks up Pending doc anchors; verify/retry endpoints | 4.5.3, Phase 4.4 |
| **4.5.5 Frontend** | Full document UI | Types, service, hooks, pages, components, sidebar entry, routes (`AppRoutes.tsx`), verification badges, activity timeline | 4.5.2–4.5.4 (API contract) |
| **4.5.6 Hardening, tests, docs** | Production readiness | Complete backend/frontend test suites, API documentation update (`apps/backend/docs/API_DOCUMENTATION.md`), security pass, performance check, seed updates | 4.5.1–4.5.5 |

---

## 16. Definition of Done

Phase 4.5 is complete when **all** of the following hold:

**Data & storage**
- [ ] Prisma migration applied with `managed_documents`, `document_versions`, `document_activities`; constraints + indexes per §7; no edits to applied migrations.
- [ ] Storage abstraction present with local driver working; storage keys are server-generated UUIDs; no user-controlled paths.

**API**
- [ ] All §10 endpoints implemented with `authenticate → authorize → validateRequest` ordering; mounted in `apiRouter.js`.
- [ ] RBAC + ownership rules enforced in both route and service layers; tests cover the full permission matrix.

**File handling**
- [ ] Size cap, extension allow-list, magic-byte MIME verification, and mismatch rejection working; rejected inputs return 413/415 and are covered by tests.
- [ ] SHA-256 computed by streaming in a single pass; stored per version; duplicate detection by hash.

**Blockchain**
- [ ] Every version anchored via `BudgetLedger` (fail-soft); `Pending`/`Failed` records retried by scheduler and via the `retry` endpoint; verification returns the full `{verified, integrityOk, onChain, inconclusive}` shape.
- [ ] `HashAlreadyRecorded` recovery path verified by test.

**Frontend**
- [ ] Document pages, upload UI, table/search/filters, detail with verification status, version history, and activity timeline implemented and wired through services → hooks → pages.
- [ ] Sidebar and `AppRoutes` updated; all new components follow existing UI conventions.

**Security & audit**
- [ ] Every document action logged (structured audit + persisted `DocumentActivity`); downloads require auth; uploads rate-limited; preview restricted to safe types.

**Testing & quality**
- [ ] New backend test files added to the hardcoded `npm run test:backend` list and passing; frontend Vitest suites passing; `npm run test` green from root.
- [ ] Frontend typecheck passes (`npm run typecheck --workspace=apps/frontend`).
- [ ] Edge/failure cases from §13 (corrupt, oversized, duplicate, node-down, storage-fail) covered.

**Docs**
- [ ] `apps/backend/docs/API_DOCUMENTATION.md` updated with the document endpoints; this plan's decisions recorded (stale `docs/*.md` not touched).
