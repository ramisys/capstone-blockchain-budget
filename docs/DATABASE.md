# Database — BudgetChain Monorepo

> **Scope:** database engine, ORM layer, schema design, every table and enum, relationships, constraints, indexes, data flow patterns, migration history, and seed data.
> **Source of truth:** `apps/backend/prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.js`, `models/prismaClient.js`, and the repository layer (`repositories/*.js`). Anything not determinable from code is marked *unknown*.

---

## 1. Database Overview

| Concern | Detail | Source |
|---|---|---|
| **Engine** | MySQL | `prisma/schema.prisma:6` (`provider = "mysql"`) |
| **Connection** | `DATABASE_URL` env var (e.g. `mysql://root:password@localhost:3306/university_budget_db`) | `.env.example:5` |
| **ORM** | Prisma 5 (`@prisma/client ^5.19.1`, CLI `prisma ^5.19.1`) | `apps/backend/package.json:32,46` |
| **Generator** | `prisma-client-js` | `schema.prisma:2` |
| **Client instantiation** | Singleton in `models/prismaClient.js:6` — logs queries in development, errors only in production | `models/prismaClient.js` |
| **Schema file** | `apps/backend/prisma/schema.prisma` (416 lines) | — |
| **Models** | 14 | See §4 |
| **Enums** | 10 | See §3 |
| **Migrations** | 8 (append-only, never edit applied migrations) | See §9 |
| **Seed script** | `prisma/seed.js` — 4 users, 2 fiscal years, master data, 5 allocations, 4 documents | See §10 |

### 1.1 Key design decisions

- **UUID primary keys** — every model uses `@id @default(uuid())`.
- **Timestamps** — `createdAt @default(now())` and `updatedAt @updatedAt` on all entities (some append-only tables omit `updatedAt`).
- **Snake-case table names** — Prisma model names are PascalCase; physical tables are snake_case via `@@map`.
- **PascalCase enums** — Prisma enums use PascalCase values (e.g. `PendingApproval`); mirrored as `UPPER_SNAKE` constants in `apps/backend/constants/`.
- **Money as `Decimal(14,2)`** — monetary fields use `@db.Decimal(14, 2)`, max representable value `999,999,999,999.99`. Services convert to plain JS numbers at the API boundary via `utils/amountUtils.js:toNumber()`.
- **Soft deletes** — `BudgetAllocation` and `ManagedDocument` use `deletedAt DateTime?` rather than physical deletion.
- **Indexed on queried fields** — `@@index` directives on FK columns, codes, statuses, and timestamps.

---

## 2. ORM Layer

### 2.1 Prisma client

The single `PrismaClient` instance lives in `models/prismaClient.js` and is imported by every repository. No other code instantiates Prisma.

```js
// models/prismaClient.js:6
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});
```

### 2.2 Repository pattern

All database access goes through the **repository layer** (`repositories/*.js`). One repository per entity. Services never call `prisma` directly — they import a repository instance.

| Repository | Entity | Key behaviors |
|---|---|---|
| `userRepository.js` | User | CRUD, email lookup, status queries |
| `refreshTokenRepository.js` | RefreshToken | Store, rotate, revoke, prune expired |
| `fiscalYearRepository.js` | FiscalYear | CRUD, `findByCode`, active FY query |
| `fundSourceRepository.js` | FundSource | CRUD, `findByCode`, `codeExists` |
| `departmentRepository.js` | Department | CRUD, `findByCode` |
| `budgetCategoryRepository.js` | BudgetCategory | CRUD, `findByCode` |
| `budgetProgramRepository.js` | BudgetProgram | CRUD with department+category joins |
| `allocationRepository.js` | BudgetAllocation | CRUD, sequential code generation (`BA-<year>-NNN`), budget sums, soft-delete |
| `allocationApprovalRepository.js` | AllocationApproval | Approval history rows |
| `blockchainRepository.js` | BlockchainRecord | Create, update status, supersede prior current records |
| `documentRepository.js` | ManagedDocument + DocumentVersion | Document+version create in one transaction, sequential codes (`DOC-<year>-NNNN`), versioning |
| `auditLogRepository.js` | AuditLog | Append-only insert, query with filters, summary aggregations |

### 2.3 Transaction patterns

Two repositories use **serializable transactions** for sequential code generation to prevent code collisions under concurrency:

- `allocationRepository.js:254` — `createWithSequentialCode` generates `BA-<year>-NNN` (padStart 3).
- `documentRepository.js:127` — `createDocumentWithVersion` generates `DOC-<year>-NNNN` (padStart 4).

Both scan existing codes within the transaction, find the max sequence, and increment.

### 2.4 Decimal handling

MySQL stores money as `DECIMAL(14,2)`. Prisma returns `Prisma.Decimal` objects (which JSON-serialize as strings). The `toNumber()` helper in `utils/amountUtils.js` normalizes them to plain JS numbers for API responses:

```js
export const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (value instanceof Prisma.Decimal) return value.toNumber();
  return Number(value);
};
```

### 2.5 Commands

Run from `apps/backend`:

| Command | Purpose |
|---|---|
| `npx prisma migrate dev` | Create/apply a new migration |
| `npx prisma migrate deploy` | Apply pending migrations (production) |
| `npx prisma generate` | Regenerate the Prisma client |
| `npx prisma studio` | GUI database browser |
| `npm run seed` | Run the seed script |

> **Rule:** never edit an applied migration. Create a new one with `npx prisma migrate dev`.

---

## 3. Enums

10 enums defined in `schema.prisma`, mirrored in `apps/backend/constants/` as `UPPER_SNAKE` exports.

### 3.1 User & account

| Enum | Values | Used by | Constants file |
|---|---|---|---|
| `Role` | `Administrator`, `Treasurer`, `BudgetOfficer`, `Auditor` | `User.role` | `constants/roles.js` |
| `Status` | `Active`, `Inactive` | `User.status`, `FundSource.status`, `Department.status`, `BudgetCategory.status`, `BudgetProgram.status` | `constants/status.js` |

### 3.2 Fiscal year

| Enum | Values | Used by | Constants file |
|---|---|---|---|
| `FiscalYearStatus` | `Active`, `Inactive`, `Archived` | `FiscalYear.status` | `constants/fiscalYearStatus.js` |

### 3.3 Allocation workflow

| Enum | Values | Used by | Constants file |
|---|---|---|---|
| `AllocationStatus` | `Draft`, `PendingApproval`, `Approved`, `Rejected`, `Archived` | `BudgetAllocation.status` | `constants/allocationStatus.js` |
| `AllocationApprovalAction` | `Submitted`, `Approved`, `Rejected`, `Returned` | `AllocationApproval.action` | `constants/allocationStatus.js` |

### 3.4 Blockchain anchoring

| Enum | Values | Used by | Constants file |
|---|---|---|---|
| `BlockchainRecordStatus` | `Pending`, `Confirmed`, `Failed` | `BlockchainRecord.status`, `DocumentVersion.blockchainStatus` | `constants/blockchainStatus.js` |
| `AuditAnchorStatus` | `Pending`, `Confirmed`, `Failed` | `AuditLog.anchorStatus` | `constants/auditAnchorStatus.js` |

### 3.5 Document management

| Enum | Values | Used by | Constants file |
|---|---|---|---|
| `DocumentType` | `PurchaseRequest`, `PurchaseOrder`, `Quotation`, `Receipt`, `Invoice`, `DisbursementVoucher`, `LiquidationReport`, `BudgetProposal`, `Contract`, `Other` | `ManagedDocument.documentType` | `constants/documentType.js` |
| `DocumentStatus` | `Active`, `Archived` | `ManagedDocument.status` | `constants/documentStatus.js` |

### 3.6 Audit

| Enum | Values | Used by | Constants file |
|---|---|---|---|
| `AuditResult` | `Success`, `Failure` | `AuditLog.result` | `constants/auditActions.js` |

---

## 4. Tables (Models)

14 models mapped to snake_case tables. Grouped by domain.

### 4.1 Identity & auth

#### `users` — `User`

System users with role-based access.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK, auto-generated | Unique user identifier |
| `fullName` | `String` | required | Display name |
| `email` | `String` | **unique** | Login credential |
| `password` | `String` | required | bcrypt hash |
| `role` | `Role` enum | required | `Administrator` / `Treasurer` / `BudgetOfficer` / `Auditor` |
| `status` | `Status` enum | default `Active` | Account status |
| `createdAt` | `DateTime` | default `now()` | — |
| `updatedAt` | `DateTime` | auto-updated | — |

**Relations:** creates allocations (`AllocationCreator`), reviews allocations (`AllocationReviewer`), approval history records, refresh tokens, uploaded documents (`DocumentUploader`), archived documents (`DocumentArchiver`), document versions (`DocumentVersionUploader`), document activities (`DocumentActivityActor`).

---

#### `refresh_tokens` — `RefreshToken`

Opaque refresh tokens for JWT rotation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `token` | `String` | **unique** | Opaque token value |
| `userId` | `String` | FK → `users.id`, **onDelete Cascade** | Owning user |
| `expiresAt` | `DateTime` | required | Token expiry |
| `revokedAt` | `DateTime?` | nullable | Set on revocation |
| `createdAt` | `DateTime` | default `now()` | — |
| `updatedAt` | `DateTime` | auto-updated | — |

**Indexes:** `token`, `userId`, `expiresAt`.

---

### 4.2 Master data

#### `fiscal_years` — `FiscalYear`

Budget planning periods with spending ceilings.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `code` | `String` | **unique** | e.g. `FY-2026` |
| `description` | `String` | required | — |
| `startDate` | `DateTime` | required | Period start |
| `endDate` | `DateTime` | required | Period end |
| `budgetAmount` | `Decimal(14,2)` | default `0` | Total spending ceiling |
| `status` | `FiscalYearStatus` | default `Inactive` | `Active` / `Inactive` / `Archived` |
| `isActive` | `Boolean` | default `false` | Exactly one FY should be active |
| `createdAt` | `DateTime` | default `now()` | — |
| `updatedAt` | `DateTime` | auto-updated | — |

**Indexes:** `code`, `[startDate, endDate]`.
**Relations:** allocations, documents.

---

#### `fund_sources` — `FundSource`

Sources of budget funding.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `code` | `String` | **unique** | e.g. `FS-GF` |
| `name` | `String` | required | — |
| `description` | `String?` | nullable | — |
| `status` | `Status` | default `Active` | — |
| `createdAt` | `DateTime` | default `now()` | — |
| `updatedAt` | `DateTime` | auto-updated | — |

**Indexes:** `code`.

---

#### `departments` — `Department`

Organizational units.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `code` | `String` | **unique** | e.g. `DEPT-ENG` |
| `name` | `String` | **unique** | e.g. `College of Engineering` |
| `officeHead` | `String?` | nullable | Head of department |
| `contactNumber` | `String?` | nullable | — |
| `email` | `String?` | nullable | — |
| `officeAddress` | `String?` | nullable | — |
| `status` | `Status` | default `Active` | — |
| `createdAt` | `DateTime` | default `now()` | — |
| `updatedAt` | `DateTime` | auto-updated | — |

**Indexes:** `code`, `name`.
**Relations:** budget programs, allocations, documents.

---

#### `budget_categories` — `BudgetCategory`

Expenditure classification.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `code` | `String` | **unique** | e.g. `CAT-PS` |
| `name` | `String` | **unique** | e.g. `Personnel Services` |
| `description` | `String?` | nullable | — |
| `status` | `Status` | default `Active` | — |
| `createdAt` | `DateTime` | default `now()` | — |
| `updatedAt` | `DateTime` | auto-updated | — |

**Indexes:** `code`, `name`.
**Relations:** budget programs, allocations.

---

#### `budget_programs` — `BudgetProgram`

Spending programs scoped to a department and a category.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `code` | `String` | **unique** | e.g. `PROG-ENG-INFRA` |
| `name` | `String` | required | — |
| `description` | `String?` | nullable | — |
| `departmentId` | `String` | FK → `departments.id` | Parent department |
| `budgetCategoryId` | `String` | FK → `budget_categories.id` | Parent category |
| `status` | `Status` | default `Active` | — |
| `createdAt` | `DateTime` | default `now()` | — |
| `updatedAt` | `DateTime` | auto-updated | — |

**Indexes:** `code`, `departmentId`, `budgetCategoryId`.

---

### 4.3 Budget allocation

#### `budget_allocations` — `BudgetAllocation`

The central financial record: a line item allocating money from a fund source to a program within a fiscal year.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `allocationCode` | `String` | **unique** | Sequential: `BA-<year>-NNN` |
| `fiscalYearId` | `String` | FK → `fiscal_years.id` | — |
| `departmentId` | `String` | FK → `departments.id` | — |
| `fundSourceId` | `String` | FK → `fund_sources.id` | — |
| `categoryId` | `String` | FK → `budget_categories.id` | — |
| `programId` | `String` | FK → `budget_programs.id` | — |
| `allocatedAmount` | `Decimal(14,2)` | required | Money allocated |
| `description` | `VarChar(500)?` | nullable | — |
| `status` | `AllocationStatus` | default `Draft` | Lifecycle state |
| `submittedAt` | `DateTime?` | nullable | When submitted for approval |
| `reviewedAt` | `DateTime?` | nullable | When reviewed (approved/rejected) |
| `reviewedBy` | `String?` | FK → `users.id`, nullable | Reviewer |
| `rejectionReason` | `VarChar(500)?` | nullable | — |
| `createdBy` | `String` | FK → `users.id` | Creator |
| `createdAt` | `DateTime` | default `now()` | — |
| `updatedAt` | `DateTime` | auto-updated | — |
| `deletedAt` | `DateTime?` | nullable | **Soft delete** timestamp |

**Indexes:** `allocationCode`, `fiscalYearId`, `departmentId`, `fundSourceId`, `categoryId`, `programId`, `createdBy`, `reviewedBy`, `status`, `createdAt`, `deletedAt`.
**Relations:** fiscal year, department, fund source, category, program, creator, reviewer, approval history, blockchain records, documents.

---

#### `allocation_approvals` — `AllocationApproval`

Immutable audit trail of approval workflow actions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `allocationId` | `String` | FK → `budget_allocations.id`, **onDelete Cascade** | Parent allocation |
| `action` | `AllocationApprovalAction` | required | `Submitted` / `Approved` / `Rejected` / `Returned` |
| `comment` | `VarChar(500)?` | nullable | Reviewer comment |
| `actorId` | `String` | FK → `users.id` | Who performed the action |
| `createdAt` | `DateTime` | default `now()` | When the action occurred |

**Indexes:** `allocationId`, `actorId`, `createdAt`.
**Note:** no `updatedAt` — rows are immutable once created.

---

### 4.4 Blockchain anchoring

#### `blockchain_records` — `BlockchainRecord`

DB mirror of allocation content hashes anchored on the BudgetLedger smart contract.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `allocationId` | `String` | FK → `budget_allocations.id` | Parent allocation |
| `allocationCode` | `String` | required | Denormalized for display |
| `contentHash` | `String` | **unique** | SHA-256 of canonical allocation fields |
| `txHash` | `String?` | **unique**, nullable | Blockchain transaction hash |
| `blockNumber` | `BigInt?` | nullable | Block number when confirmed |
| `network` | `String` | required | Network name (e.g. `hardhat-local`) |
| `status` | `BlockchainRecordStatus` | default `Pending` | `Pending` / `Confirmed` / `Failed` |
| `confirmedAt` | `DateTime?` | nullable | When the anchor was confirmed on-chain |
| `supersededAt` | `DateTime?` | nullable | Set when a newer anchor replaces this one |
| `createdBy` | `String` | required | Actor who triggered the anchor |
| `createdAt` | `DateTime` | default `now()` | — |
| `updatedAt` | `DateTime` | auto-updated | — |

**Indexes:** `allocationId`, `[allocationId, supersededAt]` (composite, for finding the current non-superseded record), `status`, `createdAt`.
**Unique constraints:** `contentHash`, `txHash` — prevents duplicate anchors.

---

### 4.5 Document management

#### `managed_documents` — `ManagedDocument`

A logical document with metadata and a pointer to the current version.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `documentCode` | `String` | **unique** | Sequential: `DOC-<year>-NNNN` |
| `title` | `VarChar(200)` | required | — |
| `description` | `VarChar(1000)?` | nullable | — |
| `documentType` | `DocumentType` | required | 10 possible types (see §3.5) |
| `fiscalYearId` | `String?` | FK → `fiscal_years.id`, nullable | Optional fiscal year reference |
| `departmentId` | `String?` | FK → `departments.id`, nullable | Optional department reference |
| `allocationId` | `String?` | FK → `budget_allocations.id`, nullable | Optional allocation reference |
| `status` | `DocumentStatus` | default `Active` | `Active` / `Archived` |
| `currentVersionId` | `String?` | **unique**, FK → `document_versions.id` | One-to-one: the current/latest version |
| `uploadedBy` | `String` | FK → `users.id` | Document creator |
| `archivedBy` | `String?` | FK → `users.id`, nullable | Who archived it |
| `archivedAt` | `DateTime?` | nullable | When archived |
| `deletedAt` | `DateTime?` | nullable | **Soft delete** timestamp |
| `createdAt` | `DateTime` | default `now()` | — |
| `updatedAt` | `DateTime` | auto-updated | — |

**Indexes:** `documentCode`, `allocationId`, `fiscalYearId`, `departmentId`, `documentType`, `status`, `uploadedBy`, `createdAt`, `deletedAt`.

---

#### `document_versions` — `DocumentVersion`

Immutable snapshots of file content. Each replacement creates a new version; old versions are preserved.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `documentId` | `String` | FK → `managed_documents.id`, **onDelete Cascade** | Parent document |
| `versionNumber` | `Int` | required | Sequential within the document |
| `originalFileName` | `VarChar(255)` | required | Client-supplied filename |
| `storageKey` | `String` | **unique** | Path/key in the storage driver |
| `mimeType` | `VarChar(100)` | required | Detected MIME type |
| `fileSizeBytes` | `BigInt` | required | File size |
| `fileExtension` | `VarChar(10)` | required | File extension |
| `sha256Hash` | `String` | **unique** | Content hash for dedup + verification |
| `blockchainStatus` | `BlockchainRecordStatus` | default `Pending` | Anchor status on BudgetLedger |
| `txHash` | `String?` | **unique**, nullable | Blockchain tx hash |
| `blockNumber` | `BigInt?` | nullable | Block number |
| `network` | `String?` | nullable | Network name |
| `confirmedAt` | `DateTime?` | nullable | Anchor confirmation time |
| `replaceReason` | `VarChar(500)?` | nullable | Why this version was uploaded (for replacements) |
| `uploadedBy` | `String` | FK → `users.id` | Who uploaded this version |
| `uploadedAt` | `DateTime` | default `now()` | — |
| `createdAt` | `DateTime` | default `now()` | — |

**Unique constraints:** `storageKey`, `sha256Hash`, `txHash`, `[documentId, versionNumber]` (composite — enforces one version number per document).
**Indexes:** `documentId`, `sha256Hash`, `blockchainStatus`, `uploadedAt`.
**Note:** no `updatedAt` — versions are immutable once created.

---

#### `document_activities` — `DocumentActivity`

Timeline of actions performed on a document (UPLOAD, REPLACE, ARCHIVE, etc.).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `documentId` | `String` | FK → `managed_documents.id`, **onDelete Cascade** | Parent document |
| `versionId` | `String?` | FK → `document_versions.id`, nullable | Related version (if applicable) |
| `actorId` | `String` | FK → `users.id` | Who performed the action |
| `action` | `VarChar(50)` | required | Action name (e.g. `UPLOAD`, `REPLACE`, `ARCHIVE`) |
| `details` | `Json?` | nullable | Structured payload (file size, hash, version, etc.) |
| `createdAt` | `DateTime` | default `now()` | — |

**Indexes:** `[documentId, createdAt]` (composite), `actorId`.
**Note:** no `updatedAt` — activity rows are immutable.

---

### 4.6 Audit trail

#### `audit_logs` — `AuditLog`

Append-only system-wide audit trail with optional blockchain anchoring.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | PK | — |
| `action` | `VarChar(100)` | required | Audit action name (e.g. `AUTH_LOGIN`, `ALLOCATION_APPROVE`) |
| `result` | `AuditResult` | default `Success` | `Success` / `Failure` |
| `actorId` | `String?` | nullable | User ID (null for system events) |
| `actorEmail` | `VarChar(255)?` | nullable | Denormalized for offline querying |
| `actorName` | `VarChar(255)?` | nullable | Denormalized |
| `actorRole` | `VarChar(50)?` | nullable | Denormalized |
| `ip` | `VarChar(45)?` | nullable | Client IP address |
| `resourceType` | `VarChar(100)?` | nullable | Entity type (e.g. `Allocation`, `Document`) |
| `resourceId` | `String?` | nullable | Entity ID |
| `resourceCode` | `VarChar(255)?` | nullable | Entity code (e.g. `BA-2026-001`) |
| `details` | `Json?` | nullable | Structured details payload |
| `eventHash` | `String?` | **unique**, nullable | SHA-256 hash for AuditLedger anchoring |
| `anchorStatus` | `AuditAnchorStatus` | default `Pending` | `Pending` / `Confirmed` / `Failed` |
| `txHash` | `String?` | **unique**, nullable | Blockchain tx hash |
| `blockNumber` | `BigInt?` | nullable | Block number |
| `network` | `String?` | nullable | Network name |
| `confirmedAt` | `DateTime?` | nullable | Anchor confirmation time |
| `createdAt` | `DateTime` | default `now()` | — |

**Indexes:** `action`, `result`, `actorId`, `[resourceType, resourceId]` (composite), `anchorStatus`, `createdAt`.
**Note:** no `updatedAt` — rows are append-only; only blockchain anchor fields are updated after creation.

---

## 5. Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ RefreshToken : "has"
    User ||--o{ BudgetAllocation : "creates"
    User ||--o{ BudgetAllocation : "reviews"
    User ||--o{ AllocationApproval : "performs"
    User ||--o{ ManagedDocument : "uploads"
    User ||--o{ ManagedDocument : "archives"
    User ||--o{ DocumentVersion : "uploads"
    User ||--o{ DocumentActivity : "acts"

    FiscalYear ||--o{ BudgetAllocation : "contains"
    FiscalYear ||--o{ ManagedDocument : "references"

    FundSource ||--o{ BudgetAllocation : "funds"

    Department ||--o{ BudgetProgram : "owns"
    Department ||--o{ BudgetAllocation : "receives"
    Department ||--o{ ManagedDocument : "references"

    BudgetCategory ||--o{ BudgetProgram : "classifies"
    BudgetCategory ||--o{ BudgetAllocation : "categorizes"

    BudgetProgram ||--o{ BudgetAllocation : "targets"

    BudgetAllocation ||--o{ AllocationApproval : "has history"
    BudgetAllocation ||--o{ BlockchainRecord : "anchored as"
    BudgetAllocation ||--o{ ManagedDocument : "supported by"

    ManagedDocument ||--o{ DocumentVersion : "has versions"
    ManagedDocument ||--o| DocumentVersion : "current version"
    ManagedDocument ||--o{ DocumentActivity : "has activities"

    DocumentVersion ||--o{ DocumentActivity : "referenced in"

    User {
        string id PK
        string fullName
        string email UK
        string password
        Role role
        Status status
        datetime createdAt
        datetime updatedAt
    }

    RefreshToken {
        string id PK
        string token UK
        string userId FK
        datetime expiresAt
        datetime revokedAt
        datetime createdAt
        datetime updatedAt
    }

    FiscalYear {
        string id PK
        string code UK
        string description
        datetime startDate
        datetime endDate
        decimal budgetAmount
        FiscalYearStatus status
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    FundSource {
        string id PK
        string code UK
        string name
        string description
        Status status
        datetime createdAt
        datetime updatedAt
    }

    Department {
        string id PK
        string code UK
        string name UK
        string officeHead
        string contactNumber
        string email
        string officeAddress
        Status status
        datetime createdAt
        datetime updatedAt
    }

    BudgetCategory {
        string id PK
        string code UK
        string name UK
        string description
        Status status
        datetime createdAt
        datetime updatedAt
    }

    BudgetProgram {
        string id PK
        string code UK
        string name
        string description
        string departmentId FK
        string budgetCategoryId FK
        Status status
        datetime createdAt
        datetime updatedAt
    }

    BudgetAllocation {
        string id PK
        string allocationCode UK
        string fiscalYearId FK
        string departmentId FK
        string fundSourceId FK
        string categoryId FK
        string programId FK
        decimal allocatedAmount
        string description
        AllocationStatus status
        datetime submittedAt
        datetime reviewedAt
        string reviewedBy FK
        string rejectionReason
        string createdBy FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    AllocationApproval {
        string id PK
        string allocationId FK
        AllocationApprovalAction action
        string comment
        string actorId FK
        datetime createdAt
    }

    BlockchainRecord {
        string id PK
        string allocationId FK
        string allocationCode
        string contentHash UK
        string txHash UK
        bigint blockNumber
        string network
        BlockchainRecordStatus status
        datetime confirmedAt
        datetime supersededAt
        string createdBy
        datetime createdAt
        datetime updatedAt
    }

    ManagedDocument {
        string id PK
        string documentCode UK
        string title
        string description
        DocumentType documentType
        string fiscalYearId FK
        string departmentId FK
        string allocationId FK
        DocumentStatus status
        string currentVersionId FK_UK
        string uploadedBy FK
        string archivedBy FK
        datetime archivedAt
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }

    DocumentVersion {
        string id PK
        string documentId FK
        int versionNumber
        string originalFileName
        string storageKey UK
        string mimeType
        bigint fileSizeBytes
        string fileExtension
        string sha256Hash UK
        BlockchainRecordStatus blockchainStatus
        string txHash UK
        bigint blockNumber
        string network
        datetime confirmedAt
        string replaceReason
        string uploadedBy FK
        datetime uploadedAt
        datetime createdAt
    }

    DocumentActivity {
        string id PK
        string documentId FK
        string versionId FK
        string actorId FK
        string action
        json details
        datetime createdAt
    }

    AuditLog {
        string id PK
        string action
        AuditResult result
        string actorId
        string actorEmail
        string actorName
        string actorRole
        string ip
        string resourceType
        string resourceId
        string resourceCode
        json details
        string eventHash UK
        AuditAnchorStatus anchorStatus
        string txHash UK
        bigint blockNumber
        string network
        datetime confirmedAt
        datetime createdAt
    }
```

---

## 6. Relationships

### 6.1 Foreign key summary

| From (child) | Column | To (parent) | On Delete |
|---|---|---|---|
| `RefreshToken` | `userId` | `User.id` | **Cascade** |
| `BudgetProgram` | `departmentId` | `Department.id` | Restrict (default) |
| `BudgetProgram` | `budgetCategoryId` | `BudgetCategory.id` | Restrict (default) |
| `BudgetAllocation` | `fiscalYearId` | `FiscalYear.id` | Restrict |
| `BudgetAllocation` | `departmentId` | `Department.id` | Restrict |
| `BudgetAllocation` | `fundSourceId` | `FundSource.id` | Restrict |
| `BudgetAllocation` | `categoryId` | `BudgetCategory.id` | Restrict |
| `BudgetAllocation` | `programId` | `BudgetProgram.id` | Restrict |
| `BudgetAllocation` | `createdBy` | `User.id` | Restrict |
| `BudgetAllocation` | `reviewedBy` | `User.id` | Restrict |
| `AllocationApproval` | `allocationId` | `BudgetAllocation.id` | **Cascade** |
| `AllocationApproval` | `actorId` | `User.id` | Restrict |
| `BlockchainRecord` | `allocationId` | `BudgetAllocation.id` | Restrict |
| `ManagedDocument` | `fiscalYearId` | `FiscalYear.id` | Restrict |
| `ManagedDocument` | `departmentId` | `Department.id` | Restrict |
| `ManagedDocument` | `allocationId` | `BudgetAllocation.id` | Restrict |
| `ManagedDocument` | `currentVersionId` | `DocumentVersion.id` | Restrict |
| `ManagedDocument` | `uploadedBy` | `User.id` | Restrict |
| `ManagedDocument` | `archivedBy` | `User.id` | Restrict |
| `DocumentVersion` | `documentId` | `ManagedDocument.id` | **Cascade** |
| `DocumentVersion` | `uploadedBy` | `User.id` | Restrict |
| `DocumentActivity` | `documentId` | `ManagedDocument.id` | **Cascade** |
| `DocumentActivity` | `versionId` | `DocumentVersion.id` | Restrict |
| `DocumentActivity` | `actorId` | `User.id` | Restrict |

### 6.2 Cascade deletes

Only three relations cascade:
- `User → RefreshToken` — deleting a user removes all their refresh tokens.
- `BudgetAllocation → AllocationApproval` — deleting an allocation removes its approval history.
- `ManagedDocument → DocumentVersion` and `ManagedDocument → DocumentActivity` — deleting a document removes all its versions and activities.

> In practice, allocations and documents use soft-delete (`deletedAt`) rather than physical deletion, so cascades rarely fire.

### 6.3 Notable relationship patterns

- **`ManagedDocument ↔ DocumentVersion`** — a one-to-many relation (`document.versions`) plus a **one-to-one** reverse pointer (`document.currentVersionId → version.id`). The `currentVersionId` column is `@unique`, enforcing at most one current version per document.
- **`User` as a hub** — `User` has 8 outbound relation arms (creator, reviewer, approver, uploader, archiver, version uploader, activity actor, refresh tokens). Named relations (`@relation("AllocationCreator")`, etc.) disambiguate the multiple `User → BudgetAllocation` FKs.
- **`AuditLog` is standalone** — it has no foreign keys to other tables. Actor identity is denormalized (`actorId`, `actorEmail`, `actorName`, `actorRole`) for offline querying. This means audit logs survive user deletion.

---

## 7. Constraints

### 7.1 Unique constraints

| Table | Column(s) | Type |
|---|---|---|
| `users` | `email` | Single-column unique |
| `refresh_tokens` | `token` | Single-column unique |
| `fiscal_years` | `code` | Single-column unique |
| `fund_sources` | `code` | Single-column unique |
| `departments` | `code` | Single-column unique |
| `departments` | `name` | Single-column unique |
| `budget_categories` | `code` | Single-column unique |
| `budget_categories` | `name` | Single-column unique |
| `budget_programs` | `code` | Single-column unique |
| `budget_allocations` | `allocationCode` | Single-column unique |
| `blockchain_records` | `contentHash` | Single-column unique |
| `blockchain_records` | `txHash` | Single-column unique |
| `managed_documents` | `documentCode` | Single-column unique |
| `managed_documents` | `currentVersionId` | Single-column unique (one-to-one) |
| `document_versions` | `storageKey` | Single-column unique |
| `document_versions` | `sha256Hash` | Single-column unique |
| `document_versions` | `txHash` | Single-column unique |
| `document_versions` | `[documentId, versionNumber]` | **Composite unique** |
| `audit_logs` | `eventHash` | Single-column unique |
| `audit_logs` | `txHash` | Single-column unique |

### 7.2 Business constraints (enforced in code)

These are not DB-level constraints but are enforced by the service/repository layer:

| Constraint | Enforcement | Source |
|---|---|---|
| Budget ceiling | `allocationService.validateBudgetCeiling` rejects if approved total would exceed `FiscalYear.budgetAmount` | `services/allocationService.js:769` |
| Separation of duties | `allocationService.assertApprover` blocks self-review | `services/allocationService.js:431` |
| Status transitions | `ALLOWED_STATUS_TRANSITIONS` map in `constants/allocationStatus.js:33` | `services/allocationService.js` |
| Soft-delete filtering | Repositories exclude `deletedAt IS NOT NULL` from queries | `repositories/allocationRepository.js`, `documentRepository.js` |
| Max document versions | Configurable cap (default 50) per document | `constants/documentStatus.js:20` |
| Byte-identical file rejection | SHA-256 dedup rejects identical content | `services/documentService.js` |
| Inactive entity references | Allocations cannot reference inactive fiscal years, departments, fund sources, categories, or programs | `services/allocationService.js` |

---

## 8. Indexes

### 8.1 Complete index inventory

| Table | Index columns | Type |
|---|---|---|
| `fiscal_years` | `code` | Single |
| `fiscal_years` | `[startDate, endDate]` | Composite |
| `fund_sources` | `code` | Single |
| `departments` | `code` | Single |
| `departments` | `name` | Single |
| `budget_categories` | `code` | Single |
| `budget_categories` | `name` | Single |
| `budget_programs` | `code` | Single |
| `budget_programs` | `departmentId` | Single (FK) |
| `budget_programs` | `budgetCategoryId` | Single (FK) |
| `budget_allocations` | `allocationCode` | Single |
| `budget_allocations` | `fiscalYearId` | Single (FK) |
| `budget_allocations` | `departmentId` | Single (FK) |
| `budget_allocations` | `fundSourceId` | Single (FK) |
| `budget_allocations` | `categoryId` | Single (FK) |
| `budget_allocations` | `programId` | Single (FK) |
| `budget_allocations` | `createdBy` | Single (FK) |
| `budget_allocations` | `reviewedBy` | Single (FK) |
| `budget_allocations` | `status` | Single |
| `budget_allocations` | `createdAt` | Single |
| `budget_allocations` | `deletedAt` | Single |
| `allocation_approvals` | `allocationId` | Single (FK) |
| `allocation_approvals` | `actorId` | Single (FK) |
| `allocation_approvals` | `createdAt` | Single |
| `blockchain_records` | `allocationId` | Single (FK) |
| `blockchain_records` | `[allocationId, supersededAt]` | Composite |
| `blockchain_records` | `status` | Single |
| `blockchain_records` | `createdAt` | Single |
| `refresh_tokens` | `token` | Single |
| `refresh_tokens` | `userId` | Single (FK) |
| `refresh_tokens` | `expiresAt` | Single |
| `managed_documents` | `documentCode` | Single |
| `managed_documents` | `allocationId` | Single (FK) |
| `managed_documents` | `fiscalYearId` | Single (FK) |
| `managed_documents` | `departmentId` | Single (FK) |
| `managed_documents` | `documentType` | Single |
| `managed_documents` | `status` | Single |
| `managed_documents` | `uploadedBy` | Single (FK) |
| `managed_documents` | `createdAt` | Single |
| `managed_documents` | `deletedAt` | Single |
| `document_versions` | `documentId` | Single (FK) |
| `document_versions` | `sha256Hash` | Single |
| `document_versions` | `blockchainStatus` | Single |
| `document_versions` | `uploadedAt` | Single |
| `document_activities` | `[documentId, createdAt]` | Composite |
| `document_activities` | `actorId` | Single (FK) |
| `audit_logs` | `action` | Single |
| `audit_logs` | `result` | Single |
| `audit_logs` | `actorId` | Single |
| `audit_logs` | `[resourceType, resourceId]` | Composite |
| `audit_logs` | `anchorStatus` | Single |
| `audit_logs` | `createdAt` | Single |

**Total:** 51 indexes (including unique indexes created implicitly by unique constraints).

---

## 9. Migration History

8 append-only migrations in `apps/backend/prisma/migrations/`:

| # | Migration | Tables created/modified |
|---|---|---|
| 1 | `20260728010255_init` | `users`, `refresh_tokens` |
| 2 | `20260731234833_master_data_tables` | `fiscal_years`, `fund_sources`, `departments`, `budget_categories`, `budget_programs` |
| 3 | `20260801000000_budget_allocations` | `budget_allocations` |
| 4 | `20260804000000_allocation_approval_workflow` | `allocation_approvals` |
| 5 | `20260804120000_blockchain_records` | `blockchain_records` |
| 6 | `20260804140000_add_superseded_at` | Modified `blockchain_records` (added `supersededAt`) |
| 7 | `20260805000000_document_management` | `managed_documents`, `document_versions`, `document_activities` |
| 8 | `20260806000000_add_audit_logs` | `audit_logs` |

Lock file: `migration_lock.toml` (provider = `mysql`).

> **Rule:** Never edit an applied migration. Create a new one with `npx prisma migrate dev`.

---

## 10. Seed Data

The seed script (`prisma/seed.js`) populates the database with demo data for development. Run with `npm run seed` from `apps/backend`.

### 10.1 Seeded users

| Full name | Email | Password | Role |
|---|---|---|---|
| System Administrator | `admin@university.edu` | `AdminPassword123!` | Administrator |
| Budget Officer | `budgetofficer@university.edu` | `BudgetOfficer123!` | BudgetOfficer |
| University Treasurer | `treasurer@university.edu` | `Treasurer123!` | Treasurer |
| Internal Auditor | `auditor@university.edu` | `Auditor123!` | Auditor |

### 10.2 Seeded master data

| Entity | Count | Examples |
|---|---|---|
| Fiscal Years | 2 | `FY-<current>` (Active, ₱10M), `FY-<previous>` (₱8M) |
| Departments | 3 | `DEPT-ENG`, `DEPT-CAS`, `DEPT-IT` |
| Fund Sources | 3 | `FS-GF` (General Fund), `FS-SEF`, `FS-TF` |
| Budget Categories | 3 | `CAT-PS` (Personnel), `CAT-MOOE`, `CAT-CO` |
| Budget Programs | 4 | `PROG-ENG-INFRA`, `PROG-ENG-OPS`, `PROG-CAS-TEACH`, `PROG-IT-SYSTEMS` |

### 10.3 Seeded allocations

5 allocations in the current fiscal year with a mix of statuses:

| Code | Department | Amount | Status |
|---|---|---|---|
| `BA-<year>-001` | Engineering | ₱1,500,000 | Draft |
| `BA-<year>-002` | IT | ₱800,000 | PendingApproval |
| `BA-<year>-003` | Arts & Sciences | ₱2,000,000 | Approved |
| `BA-<year>-004` | Engineering | ₱250,000 | Draft |
| `BA-<year>-005` | Arts & Sciences | ₱100,000 | Rejected |

### 10.4 Seeded documents

4 documents linked to the first 4 allocations, each with one text version:

| Code | Type | Title |
|---|---|---|
| `DOC-<year>-0001` | PurchaseRequest | Purchase Request - Engineering Infrastructure |
| `DOC-<year>-0002` | Quotation | Quotation - IT Systems Modernization |
| `DOC-<year>-0003` | BudgetProposal | Faculty Development Budget Proposal |
| `DOC-<year>-0004` | Receipt | Receipt - Laboratory Equipment Maintenance |

Each document gets a version 1 with a generated `.txt` blob, SHA-256 hash, and an `UPLOAD` activity record. Storage is fail-soft: if the storage root is not writable, the document is skipped.

---

## 11. Data Flow

### 11.1 Write path (allocation lifecycle example)

```mermaid
sequenceDiagram
    participant S as Service Layer
    participant R as Repository Layer
    participant P as Prisma Client
    participant DB as MySQL

    Note over S,DB: Create allocation
    S->>R: allocationRepository.createWithSequentialCode(data)
    R->>P: prisma.$transaction (Serializable)
    P->>DB: SELECT existing codes → compute next
    P->>DB: INSERT budget_allocations
    DB-->>P: new row
    P-->>R: allocation with relations
    R-->>S: allocation object

    Note over S,DB: Approve allocation
    S->>S: validateBudgetCeiling()
    S->>S: assertApprover()
    S->>R: allocationRepository.update(status=Approved)
    R->>P: prisma.budgetAllocation.update
    P->>DB: UPDATE status, reviewedBy, reviewedAt
    S->>R: allocationApprovalRepository.create(Approved)
    R->>P: prisma.allocationApproval.create
    P->>DB: INSERT allocation_approvals

    Note over S,DB: Anchor on blockchain (fail-soft)
    S->>R: blockchainRepository.create(contentHash, Pending)
    R->>P: prisma.blockchainRecord.create
    P->>DB: INSERT blockchain_records
    S->>S: blockchainProvider.record(hash)
    S->>R: blockchainRepository.update(Confirmed, txHash)
    R->>P: prisma.blockchainRecord.update
    P->>DB: UPDATE blockchain_records
```

### 11.2 Read path (API response example)

```mermaid
flowchart LR
    A["Controller"] --> B["Service"]
    B --> C["Repository"]
    C --> D["Prisma (include: relations)"]
    D --> E["MySQL"]
    E --> D
    D --> C
    C --> B
    B -->|"toNumber(Decimal)"| A
    A -->|"formatSuccessResponse"| F["JSON { success, data }"]
```

- Repositories use Prisma `include` to eagerly load related entities.
- Services convert `Decimal` fields to plain numbers via `toNumber()`.
- Controllers wrap results in `{ success: true, message, data }` envelopes.

### 11.3 Blockchain anchor status lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending : Record created
    Pending --> Confirmed : On-chain tx confirmed
    Pending --> Failed : Node unreachable / tx error
    Failed --> Confirmed : Scheduler retry succeeds
    Failed --> Failed : Retry fails again
    Confirmed --> [*]
    
    note right of Pending : DB mirror created,<br/>blockchain write attempted
    note right of Confirmed : txHash + blockNumber<br/>+ confirmedAt populated
    note right of Failed : reason logged,<br/>scheduler retries every 60s
```

---

## 12. Related Documentation

- [docs/INDEX.md](./INDEX.md) — navigation, source-of-truth hierarchy, reading order.
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md) — end-to-end architecture, request flow, runtime flows.
- [docs/TECH_STACK.md](./TECH_STACK.md) — Prisma/MySQL versions and full dependency inventory.
- [docs/FILE_STRUCTURE.md](./FILE_STRUCTURE.md) — repository layer files, `prisma/` directory structure.
