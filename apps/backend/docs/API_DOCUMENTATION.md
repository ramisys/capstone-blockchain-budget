# API Documentation - Phase 1: Authentication & Authorization

This document contains detailed specifications for the Authentication & Authorization endpoints of the **Blockchain-Based Budget Allocation and Expense Monitoring System**.

---

## Base URL

```
http://localhost:5000/api
```

---

## Authentication Endpoints

### 1. User Login

Authenticates a user with email and password, returning a JWT access token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | String | Yes | User's registered email address |
| `password` | String | Yes | Plaintext password |

```json
{
  "email": "admin@university.edu",
  "password": "AdminPassword123!"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "c1f7b8e0-1234-4567-89ab-cdef01234567",
      "fullName": "System Administrator",
      "email": "admin@university.edu",
      "role": "Administrator",
      "status": "Active",
      "createdAt": "2026-07-28T08:00:00.000Z",
      "updatedAt": "2026-07-28T08:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Responses

- **400 Bad Request (Validation Failure)**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format"
    }
  ]
}
```

- **401 Unauthorized (Invalid Credentials)**:
```json
{
  "success": false,
  "message": "Invalid credentials",
  "errors": []
}
```

- **403 Forbidden (Inactive Account)**:
```json
{
  "success": false,
  "message": "Account is inactive. Please contact the administrator.",
  "errors": []
}
```

---

### 2. Current User Profile

Retrieves profile information for the currently authenticated user.

- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)

#### Request Headers

```http
Authorization: Bearer <access_token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "c1f7b8e0-1234-4567-89ab-cdef01234567",
      "fullName": "System Administrator",
      "email": "admin@university.edu",
      "role": "Administrator",
      "status": "Active",
      "createdAt": "2026-07-28T08:00:00.000Z",
      "updatedAt": "2026-07-28T08:00:00.000Z"
    }
  }
}
```

#### Error Responses

- **401 Unauthorized**:
```json
{
  "success": false,
  "message": "Authentication token is required",
  "errors": []
}
```

---

### 3. User Logout

Stateless logout endpoint allowing future token revocation/blacklisting.

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)

#### Request Headers

```http
Authorization: Bearer <access_token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Logout successful",
  "data": {}
}
```

---

## Role-Based Access Control (RBAC)

The backend features standard RBAC authorization middleware:

### Roles
- `Administrator`
- `Treasurer`
- `BudgetOfficer`
- `Auditor`

### Middleware Usage Example
```javascript
import { authorize } from '../middleware/rbacMiddleware.js';

// Route accessible only by Administrators
router.get('/admin/settings', authenticate, authorize('Administrator'), handler);

// Route accessible by Administrators and Treasurers
router.get('/treasury/reports', authenticate, authorize('Administrator', 'Treasurer'), handler);
```

#### Unauthorized Role Response (403 Forbidden)
```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "errors": [
    "Required role(s): Administrator, Treasurer. Your role: Auditor"
  ]
}
```

---

# API Documentation - Phase 4.2: Budget Allocation Management

This section documents the Budget Allocation Management endpoints. All endpoints are
mounted under the `/api` base URL and require authentication.

## Allocation Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Allocation ID |
| `allocationCode` | String | Auto-generated code, `BA-YYYY-NNN` (sequence restarts each fiscal year, codes are never reused) |
| `fiscalYearId` | String (UUID) | Fiscal year the allocation belongs to |
| `departmentId` | String (UUID) | Department receiving the allocation |
| `fundSourceId` | String (UUID) | Funding source |
| `categoryId` | String (UUID) | Budget category |
| `programId` | String (UUID) | Budget program |
| `allocatedAmount` | Number | Allocated amount |
| `description` | String (nullable) | Description (max 500 chars) |
| `status` | String | `Draft` \| `PendingApproval` \| `Approved` \| `Rejected` \| `Archived` |
| `createdBy` | String (UUID) | ID of the user who created the allocation |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
| `deletedAt` | DateTime (nullable) | Soft-delete timestamp (null for live allocations) |
| `submittedAt` | DateTime (nullable) | Timestamp the allocation was last submitted for approval |
| `reviewedBy` | String (UUID, nullable) | ID of the user who last reviewed (approved/rejected) the allocation |
| `reviewedAt` | DateTime (nullable) | Timestamp of the last review decision |
| `rejectionReason` | String (nullable) | Reason recorded when the allocation was rejected (max 500 chars) |

## Approval Record Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Approval record ID |
| `allocationId` | String (UUID) | Allocation the decision belongs to |
| `action` | String | `Submitted` \| `Approved` \| `Rejected` \| `Returned` |
| `comment` | String (nullable) | Decision comment (e.g., rejection reason) |
| `actorId` | String (UUID) | ID of the user who performed the action |
| `createdAt` | DateTime | Decision timestamp |
| `actor` | Object | `{ id, fullName, email, role }` of the acting user |

## Role-Based Access Control

| Endpoint | Administrator | BudgetOfficer | Treasurer | Auditor |
|----------|:---:|:---:|:---:|:---:|
| GET `/allocations` | ✓ | ✓ | ✓ | ✓ |
| GET `/allocations/:id` | ✓ | ✓ | ✓ | ✓ |
| GET `/allocations/statistics` | ✓ | ✓ | ✓ | ✓ |
| GET `/allocations/remaining-budget` | ✓ | ✓ | ✓ | ✓ |
| POST `/allocations` | ✓ | ✓ | ✗ | ✗ |
| PUT `/allocations/:id` | ✓ | ✓ | ✗ | ✗ |
| DELETE `/allocations/:id` | ✓ | ✓* | ✗ | ✗ |
| POST `/allocations/:id/submit` | ✓ | ✓ | ✗ | ✗ |
| POST `/allocations/:id/approve` | ✓ | ✗ | ✓ | ✗ |
| POST `/allocations/:id/reject` | ✓ | ✗ | ✓ | ✗ |
| POST `/allocations/:id/return` | ✓ | ✓† | ✓ | ✗ |
| GET `/allocations/:id/approvals` | ✓ | ✓ | ✓ | ✓ |

\* Budget Officers can only delete `Draft` allocations; Administrators may delete any
non-`Archived` allocation.
† Budget Officers can only return allocations they created. Administrators and Treasurers
may return any `PendingApproval` allocation, or any `Rejected` allocation.

## Status Rules

- Allocations are always created as `Draft`; the `status` field is not accepted on create.
- Only `Draft` allocations can be edited (409 otherwise).
- `Approved` allocations are immutable.
- `Archived` allocations cannot be deleted.
- Deleted allocations are soft-deleted (`deletedAt` set) and excluded from all reads,
  statistics, and remaining-budget computations.
- Rejected, Archived, and soft-deleted allocations do not block a new allocation with
  the same fiscal year, department, program, fund source, and category combination.

## Approval Workflow Rules

- Status flow: `Draft` → `PendingApproval` → `Approved` | `Rejected`. A `PendingApproval`
  or `Rejected` allocation can be returned to `Draft` for revision and resubmitted.
- Only `Administrator` and `Treasurer` can approve or reject; users cannot review
  (approve/reject/return) allocations they created (403 otherwise).
- Rejections require a non-empty `reason` (trimmed, max 500 chars).
- Approving re-validates the fiscal year's remaining budget; approving an allocation that
  exceeds the ceiling fails with 400.
- Every submit/approve/reject/return decision is recorded in the `allocation_approvals`
  history table and returned by `GET /allocations/:id/approvals`, newest first.

---

### 1. Create Allocation

Creates a new allocation (always `Draft`) with an auto-generated code.

- **URL**: `/allocations`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalYearId` | String | Yes | Fiscal year ID (must exist and not be archived) |
| `departmentId` | String | Yes | Department ID (must be active) |
| `fundSourceId` | String | Yes | Fund source ID (must be active) |
| `categoryId` | String | Yes | Budget category ID (must be active) |
| `programId` | String | Yes | Budget program ID (must be active and belong to the department) |
| `allocatedAmount` | Number | Yes | Amount greater than zero, max 999999999999.99 |
| `description` | String | No | Max 500 characters |

```json
{
  "fiscalYearId": "c1f7b8e0-0000-0000-0000-000000000001",
  "departmentId": "c1f7b8e0-0000-0000-0000-000000000002",
  "fundSourceId": "c1f7b8e0-0000-0000-0000-000000000003",
  "categoryId": "c1f7b8e0-0000-0000-0000-000000000004",
  "programId": "c1f7b8e0-0000-0000-0000-000000000005",
  "allocatedAmount": 150000,
  "description": "Campus infrastructure allocation"
}
```

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Allocation created successfully",
  "data": {
    "allocation": {
      "id": "c1f7b8e0-0000-0000-0000-000000000006",
      "allocationCode": "BA-2026-001",
      "fiscalYearId": "c1f7b8e0-0000-0000-0000-000000000001",
      "departmentId": "c1f7b8e0-0000-0000-0000-000000000002",
      "fundSourceId": "c1f7b8e0-0000-0000-0000-000000000003",
      "categoryId": "c1f7b8e0-0000-0000-0000-000000000004",
      "programId": "c1f7b8e0-0000-0000-0000-000000000005",
      "allocatedAmount": 150000,
      "description": "Campus infrastructure allocation",
      "status": "Draft",
      "createdBy": "c1f7b8e0-1234-4567-89ab-cdef01234567",
      "createdAt": "2026-08-01T08:00:00.000Z",
      "updatedAt": "2026-08-01T08:00:00.000Z",
      "deletedAt": null,
      "fiscalYear": {},
      "department": {},
      "fundSource": {},
      "category": {},
      "program": {},
      "creator": { "id": "c1f7b8e0-1234-4567-89ab-cdef01234567", "fullName": "System Administrator", "email": "admin@university.edu", "role": "Administrator" }
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: invalid payload, non-positive amount, program not belonging to the department
- **404 Not Found**: fiscal year, department, fund source, category, or program does not exist
- **409 Conflict**: archived fiscal year, inactive reference, or a duplicate allocation already exists

---

### 2. Get Allocation by ID

- **URL**: `/allocations/:id`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocation retrieved successfully",
  "data": { "allocation": { "id": "c1f7b8e0-...", "allocationCode": "BA-2026-001", "...": "..." } }
}
```

#### Error Responses

- **404 Not Found**: allocation does not exist or has been soft-deleted

---

### 3. List Allocations

Returns paginated allocations with search, filtering, and sorting.

- **URL**: `/allocations`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | Integer | Page number (default `1`) |
| `limit` | Integer | Items per page (default `10`) |
| `search` | String | Fuzzy search across allocation code, description, department, fund source, category, and program names |
| `fiscalYearId` | String | Filter by fiscal year |
| `departmentId` | String | Filter by department |
| `fundSourceId` | String | Filter by fund source |
| `categoryId` | String | Filter by budget category |
| `programId` | String | Filter by budget program |
| `status` | String | Filter by status (`Draft`, `PendingApproval`, `Approved`, `Rejected`, `Archived`) |
| `dateFrom` | String | Only allocations created on or after this date |
| `dateTo` | String | Only allocations created on or before this date (inclusive to end of day) |
| `sortBy` | String | `newest` (default), `oldest`, `highest`, `lowest`, `code`, `department`, `createdAt`, `allocatedAmount`, `allocationCode` |
| `sortOrder` | String | `asc` (default) or `desc` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocations retrieved successfully",
  "data": {
    "allocations": [ { "id": "c1f7b8e0-...", "allocationCode": "BA-2026-001", "...": "..." } ],
    "pagination": {
      "total": 25,
      "page": 2,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

---

### 4. Update Allocation

Updates an allocation. Only `Draft` allocations are editable.

- **URL**: `/allocations/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`

#### Request Body

Any subset of the following (fiscal year, status, allocation code, and creator are immutable):

| Field | Type | Description |
|-------|------|-------------|
| `departmentId` | String | New department |
| `fundSourceId` | String | New fund source |
| `categoryId` | String | New budget category |
| `programId` | String | New budget program |
| `allocatedAmount` | Number | New amount |
| `description` | String | New description |

```json
{
  "allocatedAmount": 175000,
  "description": "Updated allocation"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocation updated successfully",
  "data": { "allocation": { "id": "c1f7b8e0-...", "allocatedAmount": 175000, "...": "..." } }
}
```

#### Error Responses

- **404 Not Found**: allocation does not exist or has been soft-deleted
- **409 Conflict**: allocation is not a `Draft`, a duplicate combination would be created, or a referenced entity is inactive/archived
- **400 Bad Request**: invalid amount or program not belonging to the selected department

---

### 5. Delete Allocation (Soft Delete)

Marks an allocation as deleted without removing the row.

- **URL**: `/allocations/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer` (Budget Officers limited to `Draft` allocations)

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocation deleted successfully",
  "data": {}
}
```

#### Error Responses

- **404 Not Found**: allocation does not exist or has been soft-deleted
- **403 Forbidden**: a Budget Officer attempting to delete a non-`Draft` allocation
- **409 Conflict**: allocation is `Archived`

---

### 6. Allocation Statistics

Returns dashboard statistics. Excludes soft-deleted allocations.

- **URL**: `/allocations/statistics`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `fiscalYearId` | String | Optional scope. When omitted, statistics span all fiscal years with allocations |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocation statistics retrieved successfully",
  "data": {
    "statistics": {
      "totalAllocations": 5,
      "totalAllocatedAmount": 250000,
      "remainingBudget": 250000,
      "draftCount": 2,
      "pendingApprovalCount": 1,
      "approvedCount": 1,
      "rejectedCount": 1
    }
  }
}
```

Notes:
- `totalAllocatedAmount` sums only `Approved` (budget-committing) allocations.
- `remainingBudget` = sum of the referenced fiscal years' `budgetAmount` ceilings minus
  `totalAllocatedAmount`. When no `fiscalYearId` is supplied, it is scoped to the fiscal
  years referenced by existing allocations.
- `Archived`, `Rejected`, `Draft`, and `PendingApproval` allocations are excluded from all
  amounts.

---

### 7. Remaining Budget

Computes remaining budget for the available funding.

- **URL**: `/allocations/remaining-budget`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `fiscalYearId` | String | Optional. Fiscal year whose `budgetAmount` ceiling is used |
| `fundSourceId` | String | Optional. Limits the allocated sum to this fund source |
| `departmentId` | String | Optional. Limits the allocated sum to this department |

When `fiscalYearId` is omitted, the total budget is scoped to the fiscal years referenced
by allocations matching the optional `fundSourceId`/`departmentId` filters. Rejected,
Archived, and soft-deleted allocations are excluded from the allocated sum.

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Remaining budget retrieved successfully",
  "data": {
    "budget": {
      "totalBudget": 500000,
      "totalAllocated": 180000,
      "remainingBudget": 320000
    }
  }
}
```

#### Error Responses

- **404 Not Found**: the specified fiscal year does not exist

---

### 8. Submit Allocation for Approval

Moves a `Draft` allocation to `PendingApproval` and records a `Submitted` history entry.

- **URL**: `/allocations/:id/submit`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocation submitted for approval",
  "data": { "allocation": { "id": "c1f7b8e0-...", "status": "PendingApproval", "submittedAt": "2026-08-02T09:00:00.000Z", "...": "..." } }
}
```

#### Error Responses

- **404 Not Found**: allocation does not exist or has been soft-deleted
- **400 Bad Request**: allocation is not in `Draft` status

---

### 9. Approve Allocation

Approves a `PendingApproval` allocation. The fiscal year's remaining budget is re-validated
before the allocation commits budget.

- **URL**: `/allocations/:id/approve`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `Treasurer`
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocation approved successfully",
  "data": { "allocation": { "id": "c1f7b8e0-...", "status": "Approved", "reviewedBy": "c1f7b8e0-1234-4567-89ab-cdef01234567", "reviewedAt": "2026-08-03T10:00:00.000Z", "...": "..." } }
}
```

#### Error Responses

- **404 Not Found**: allocation does not exist or has been soft-deleted
- **403 Forbidden**: the user is not an approver, or is the creator of the allocation
- **400 Bad Request**: allocation is not in `PendingApproval` status, or approving would
  exceed the fiscal year's remaining budget

---

### 10. Reject Allocation

Rejects a `PendingApproval` allocation. A reason is mandatory so the submitter can revise
and resubmit.

- **URL**: `/allocations/:id/reject`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `Treasurer`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | String | Yes | Reason for rejection (trimmed, max 500 chars) |

```json
{
  "reason": "Amount exceeds the departmental ceiling"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocation rejected successfully",
  "data": { "allocation": { "id": "c1f7b8e0-...", "status": "Rejected", "rejectionReason": "Amount exceeds the departmental ceiling", "reviewedBy": "c1f7b8e0-1234-4567-89ab-cdef01234567", "reviewedAt": "2026-08-03T10:30:00.000Z", "...": "..." } }
}
```

#### Error Responses

- **400 Bad Request**: missing/blank `reason`, or allocation is not in `PendingApproval` status
- **403 Forbidden**: the user is not an approver, or is the creator of the allocation
- **404 Not Found**: allocation does not exist or has been soft-deleted

---

### 11. Return Allocation to Draft

Returns an allocation to `Draft` for revision. A `PendingApproval` allocation can be returned
by an approver; a `Rejected` allocation can be returned by its creator or an approver.

- **URL**: `/allocations/:id/return`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `Treasurer`, `BudgetOfficer`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `comment` | String | No | Optional note explaining the return (max 500 chars) |

```json
{
  "comment": "Please revise the allocation amount"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocation returned to draft",
  "data": { "allocation": { "id": "c1f7b8e0-...", "status": "Draft", "...": "..." } }
}
```

#### Error Responses

- **400 Bad Request**: allocation is not in `PendingApproval` or `Rejected` status
- **403 Forbidden**: a Budget Officer attempting to return an allocation they did not create,
  or an approver returning their own `PendingApproval` allocation
- **404 Not Found**: allocation does not exist or has been soft-deleted

---

### 12. Get Approval History

Returns the chronological approval trail for an allocation, newest first, with actor details.

- **URL**: `/allocations/:id/approvals`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Approval history retrieved successfully",
  "data": {
    "approvals": [
      {
        "id": "c1f7b8e0-0000-0000-0000-000000000010",
        "allocationId": "c1f7b8e0-0000-0000-0000-000000000006",
        "action": "Rejected",
        "comment": "Amount exceeds the departmental ceiling",
        "actorId": "c1f7b8e0-1234-4567-89ab-cdef01234567",
        "createdAt": "2026-08-03T10:30:00.000Z",
        "actor": { "id": "c1f7b8e0-1234-4567-89ab-cdef01234567", "fullName": "System Administrator", "email": "admin@university.edu", "role": "Administrator" }
      },
      {
        "id": "c1f7b8e0-0000-0000-0000-000000000011",
        "allocationId": "c1f7b8e0-0000-0000-0000-000000000006",
        "action": "Submitted",
        "comment": null,
        "actorId": "c1f7b8e0-1234-4567-89ab-000000000001",
        "createdAt": "2026-08-02T09:00:00.000Z",
        "actor": { "id": "c1f7b8e0-1234-4567-89ab-000000000001", "fullName": "Budget Officer", "email": "budgetofficer@university.edu", "role": "BudgetOfficer" }
      }
    ]
  }
}
```

#### Error Responses

- **404 Not Found**: allocation does not exist or has been soft-deleted
- **409 Conflict**: the specified fiscal year is archived

---

# API Documentation - Phase 4.4: Blockchain Ledger Integration

This section documents the Blockchain Ledger endpoints. All endpoints are mounted under the `/api` base URL (`/api/blockchain/...`) and require authentication.

The blockchain ledger anchors every approved allocation with an immutable SHA-256 content
hash recorded on the `BudgetLedger` EVM smart contract. Draft records are never written
on-chain. Each write is mirrored in the `BlockchainRecord` table so the API remains fully
functional even when the ledger node is unreachable (records stay `Pending` and can be
re-anchored later via the retry endpoint).

## Blockchain Record Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (uuid) | Record ID |
| `allocationId` | String (uuid) | Related allocation ID |
| `allocationCode` | String | Allocation code, e.g. `BA-2026-0001` |
| `contentHash` | String | Hex-encoded SHA-256 digest of the allocation content |
| `txHash` | String \| null | Ethereum transaction hash, null until confirmed |
| `txExplorerUrl` | String \| null | Direct block explorer URL for transaction verification, null if unconfigured/unconfirmed |
| `blockNumber` | Number \| null | Block number the record was anchored in |
| `network` | String | Ledger network name, e.g. `hardhat` |
| `status` | String | `Pending` \| `Confirmed` \| `Failed` |
| `confirmedAt` | ISO date \| null | When the on-chain write was confirmed |
| `createdBy` | String (uuid) | User ID who triggered the anchoring |
| `createdAt` | ISO date | Record creation timestamp |
| `updatedAt` | ISO date | Record update timestamp |
| `allocation` | Object (optional) | Nested allocation summary object when populated |

## Role-Based Access Control

| Endpoint | Administrator | BudgetOfficer | Treasurer | Auditor |
|----------|:---:|:---:|:---:|:---:|
| GET `/blockchain/status` | ✓ | ✓ | ✓ | ✓ |
| GET `/blockchain/transactions` | ✓ | ✓ | ✓ | ✓ |
| GET `/blockchain/allocations/:id` | ✓ | ✓ | ✓ | ✓ |
| POST `/blockchain/allocations/:id/verify` | ✓ | ✓ | ✓ | ✓ |
| POST `/blockchain/allocations/:id/retry` | ✓ | ✓ | ✓ | ✗ |

---

### 13. Blockchain Ledger Status

Returns provider connectivity plus record statistics for the status dashboard.

- **URL**: `/blockchain/status`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Blockchain status retrieved successfully",
  "data": {
    "blockchainStatus": {
      "connected": true,
      "network": "hardhat",
      "chainId": 31337,
      "latestBlock": 120,
      "lastSync": "2026-08-04T09:31:00.000Z",
      "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "contractExplorerUrl": "http://localhost:8545/address/0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "onChainCount": 4,
      "message": "Blockchain ledger is connected.",
      "recordCount": 4,
      "confirmedCount": 3,
      "pendingCount": 1,
      "failedCount": 0
    }
  }
}
```

#### Error Responses

- **401 Unauthorized**: Missing or invalid authentication token

---

### 14. Transaction History

Paginated list of blockchain records with filtering and sorting.

- **URL**: `/blockchain/transactions`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | Number | No | Page number, defaults to `1` |
| `limit` | Number | No | Page size, defaults to `10`, max `100` |
| `search` | String | No | Partial allocation-code match |
| `status` | String | No | `Pending` \| `Confirmed` \| `Failed` |
| `allocationId` | String | No | Filter to a single allocation |
| `dateFrom` | String (date) | No | Include records created on/after this date |
| `dateTo` | String (date) | No | Include records created on/before this date |
| `sortBy` | String | No | `newest` \| `oldest` \| `status` \| `allocationCode` \| `createdAt` (default `newest`) |
| `sortOrder` | String | No | `asc` \| `desc` (default `asc`) |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Blockchain transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "c1f7b8e0-0000-0000-0000-000000000012",
        "allocationId": "c1f7b8e0-0000-0000-0000-000000000006",
        "allocationCode": "BA-2026-0001",
        "contentHash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
        "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
        "txExplorerUrl": "http://localhost:8545/tx/0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
        "blockNumber": 96,
        "network": "hardhat",
        "status": "Confirmed",
        "confirmedAt": "2026-08-04T09:31:00.000Z",
        "createdBy": "c1f7b8e0-1234-4567-89ab-cdef01234567",
        "createdAt": "2026-08-04T09:31:00.000Z",
        "allocation": {
          "id": "c1f7b8e0-0000-0000-0000-000000000006",
          "allocationCode": "BA-2026-0001",
          "status": "Approved",
          "allocatedAmount": 150000,
          "department": { "id": "dept-1", "name": "Engineering", "code": "DEPT-1" },
          "fiscalYear": { "id": "fy-2026", "code": "FY-2026" }
        }
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid query parameters (e.g. `limit > 100`, invalid status enum, malformed date string)
- **401 Unauthorized**: Missing or invalid authentication token

---

### 15. Allocation Verification Detail

Recomputes the allocation content hash and checks it both against the stored
record and (when reachable) the on-chain ledger. Behavior is identical to the
Verify Allocation endpoint (Section 16) — the verification computation is always
re-run.

- **URL**: `/blockchain/allocations/:id`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocation verification retrieved successfully",
  "data": {
    "verified": true,
    "integrityOk": true,
    "onChain": { "exists": true, "anchoredBy": "0x5FbDB2315678afecb367f032d93F642f64180aa3", "anchoredAt": 1700000000, "blockNumber": 96 },
    "inconclusive": false,
    "record": {
      "id": "c1f7b8e0-0000-0000-0000-000000000012",
      "allocationId": "c1f7b8e0-0000-0000-0000-000000000006",
      "allocationCode": "BA-2026-0001",
      "contentHash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
      "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "txExplorerUrl": "http://localhost:8545/tx/0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "blockNumber": 96,
      "network": "hardhat",
      "status": "Confirmed",
      "confirmedAt": "2026-08-04T09:31:00.000Z"
    },
    "message": "Allocation verified on the blockchain ledger."
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid allocation ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Allocation does not exist or has been soft-deleted

---

### 16. Verify Allocation

Recomputes the allocation content hash and checks it both against the stored
record and (when reachable) the on-chain ledger. Exposes a `message` field
explaining the outcome, including tampering detection.

- **URL**: `/blockchain/allocations/:id/verify`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Allocation verified against the blockchain ledger",
  "data": {
    "verified": true,
    "integrityOk": true,
    "onChain": { "exists": true, "anchoredBy": "0x5FbDB2315678afecb367f032d93F642f64180aa3", "anchoredAt": 1700000000, "blockNumber": 96 },
    "inconclusive": false,
    "record": {
      "id": "c1f7b8e0-0000-0000-0000-000000000012",
      "allocationId": "c1f7b8e0-0000-0000-0000-000000000006",
      "allocationCode": "BA-2026-0001",
      "contentHash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
      "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "txExplorerUrl": "http://localhost:8545/tx/0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "blockNumber": 96,
      "network": "hardhat",
      "status": "Confirmed",
      "confirmedAt": "2026-08-04T09:31:00.000Z"
    },
    "message": "Allocation verified on the blockchain ledger."
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid allocation ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Allocation does not exist or has been soft-deleted

---

### 17. Retry Blockchain Record

Re-anchors a `Pending` or `Failed` record for an allocation on the ledger.
Returns the existing record unchanged if it is already `Confirmed`. If no
record exists yet, one is created first.

- **URL**: `/blockchain/allocations/:id/retry`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Blockchain record anchored successfully",
  "data": {
    "record": {
      "id": "c1f7b8e0-0000-0000-0000-000000000012",
      "allocationId": "c1f7b8e0-0000-0000-0000-000000000006",
      "allocationCode": "BA-2026-0001",
      "contentHash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
      "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "txExplorerUrl": "http://localhost:8545/tx/0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "blockNumber": 101,
      "network": "hardhat",
      "status": "Confirmed",
      "confirmedAt": "2026-08-04T10:05:00.000Z"
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid allocation ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User does not have permission to retry (e.g. Auditor)
- **404 Not Found**: Allocation does not exist or has been soft-deleted
- **503 Service Unavailable**: Ledger not configured or the on-chain write failed

---

# API Documentation - Phase 4.5: Document Management

This section documents the Document Management endpoints. All endpoints are mounted
under the `/api` base URL (`/api/documents/...`) and require authentication.

The module is a centralized, versioned, tamper-evident repository for the supporting
documents of the budget cycle (purchase requests, orders, quotations, receipts,
invoices, vouchers, contracts, etc.). File bytes are stored **outside** the database
(local filesystem by default); only metadata and each version's SHA-256 digest live in
MySQL. Every version's digest is anchored on the `BudgetLedger` smart contract
(fail-soft: an unreachable/unconfigured ledger never fails the upload, the version
stays `Pending`/`Failed` and is re-anchored later by the scheduler or the retry
endpoint).

## Document Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (uuid) | Document ID |
| `documentCode` | String | Sequential code, e.g. `DOC-2026-0001` (per fiscal year) |
| `title` | String | Document title (max 200 chars) |
| `description` | String \| null | Optional description (max 1000 chars) |
| `documentType` | String | One of the `DocumentType` enum values (see below) |
| `status` | String | `Active` \| `Archived` |
| `fiscalYear` | Object \| null | Linked fiscal year `{ id, code, startDate, endDate }` |
| `department` | Object \| null | Linked department `{ id, code, name }` |
| `allocation` | Object \| null | Linked allocation `{ id, allocationCode, status }` |
| `uploadedBy` | String (uuid) | Uploader user ID |
| `uploader` | Object | `{ id, fullName, email, role }` |
| `currentVersion` | Object \| null | Current `DocumentVersion` (see below) |
| `archivedBy` | String \| null | User ID who archived the document |
| `archivedAt` | ISO date \| null | Archive timestamp |
| `deletedAt` | ISO date \| null | Soft-delete timestamp (non-null when archived) |
| `createdAt` | ISO date | Creation timestamp |
| `updatedAt` | ISO date | Last update timestamp |
| `_count` | Object | `{ versions }` number of versions |

## Document Version Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (uuid) | Version ID |
| `documentId` | String (uuid) | Owning document ID |
| `versionNumber` | Number | 1-based position in the version chain |
| `originalFileName` | String | Client file name (display only, never used in paths) |
| `storageKey` | String | Server-generated storage key (never the client file name) |
| `mimeType` | String | Detected MIME type (magic-byte verified, not client-supplied) |
| `fileSizeBytes` | Number | File size in bytes |
| `fileExtension` | String | Sanitized file extension |
| `sha256Hash` | String | Streaming SHA-256 hex digest of the file bytes |
| `blockchainStatus` | String | `Pending` \| `Confirmed` \| `Failed` |
| `txHash` | String \| null | Ethereum transaction hash, null until confirmed |
| `txExplorerUrl` | String \| null | Block explorer link for the transaction, null if unconfigured/unconfirmed |
| `blockNumber` | Number \| null | Block number the version was anchored in |
| `network` | String \| null | Ledger network name |
| `confirmedAt` | ISO date \| null | When the on-chain write was confirmed |
| `replaceReason` | String \| null | Reason supplied when this version replaced the previous one |
| `uploadedBy` | String (uuid) | Uploader user ID |
| `uploader` | Object | `{ id, fullName, email, role }` |
| `uploadedAt` | ISO date | Upload timestamp |

## Document Activity Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (uuid) | Activity ID |
| `documentId` | String (uuid) | Owning document ID |
| `versionId` | String \| null | Related version ID |
| `actorId` | String (uuid) | Acting user ID |
| `actor` | Object | `{ id, fullName, email, role }` |
| `action` | String | `UPLOAD` \| `METADATA_UPDATE` \| `REPLACE` \| `ARCHIVE` \| `VERIFY` \| `ANCHOR_RETRY` |
| `details` | Object \| null | Structured action summary (e.g. version numbers, hash, result flags) |
| `createdAt` | ISO date | Activity timestamp |

## Document Types (enum `DocumentType`)

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

**Accepted file formats** (extension + magic-byte MIME check): PDF (`.pdf`), Word
(`.doc`, `.docx`), Excel/CSV (`.xlsx`, `.xls`, `.csv`), images (`.jpg`, `.jpeg`,
`.png`, `.tiff`, `.webp`), and text (`.txt`). **Max file size:** 25 MB
(`MAX_FILE_SIZE_BYTES`). Executables, scripts, archives, and HTML/SVG are always
rejected (415), as is any file whose extension contradicts its detected MIME type.

## Role-Based Access Control

| Endpoint | Administrator | BudgetOfficer | Treasurer | Auditor |
|----------|:---:|:---:|:---:|:---:|
| GET `/documents` | ✓ | ✓ | ✓ | ✓ |
| GET `/documents/:id` | ✓ | ✓ | ✓ | ✓ |
| GET `/documents/:id/download` | ✓ | ✓ | ✓ | ✓ |
| GET `/documents/:id/preview` | ✓ | ✓ | ✓ | ✓ |
| GET `/documents/:id/versions` | ✓ | ✓ | ✓ | ✓ |
| GET `/documents/:id/verify` | ✓ | ✓ | ✓ | ✓ |
| GET `/documents/:id/activity` | ✓ | ✓ | ✓ | ✓ |
| POST `/documents` | ✓ | ✓ (own) | ✓ | ✗ |
| PUT `/documents/:id` | ✓ | ✓ (own) | ✓ (own) | ✗ |
| POST `/documents/:id/replace` | ✓ | ✓ (own) | ✓ (own) | ✗ |
| POST `/documents/:id/retry` | ✓ | ✓ | ✓ | ✗ |
| DELETE `/documents/:id` | ✓ (any) | ✓ (own) | ✓ (own) | ✗ |

**Service-layer rules:** only Administrators may modify documents they did not
upload; Budget Officers and Treasurers are limited to documents where
`uploadedBy === actor.id`. Auditor is strictly read + verify. Ownership failures
return 403.

---

### 18. Upload Document

Uploads a new document as `multipart/form-data`. The file is validated (size,
extension allow-list, magic-byte MIME sniffing, extension/MIME match), streamed to
storage while its SHA-256 is computed in a single pass, then metadata + initial
version are persisted atomically. The digest is anchored on the ledger fail-soft;
the returned `currentVersion.blockchainStatus` reflects the result (`Pending` when
the ledger is unconfigured/unreachable). A duplicate file (same SHA-256) is
rejected with 409 and the stored blob removed.

- **URL**: `/documents`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer` (own), `Treasurer`
- **Rate Limit**: uploads are limited (default 20 requests per 15 minutes per IP)
- **Content-Type**: `multipart/form-data`

#### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | File bytes (≤ 25 MB, allowed type) |
| `title` | String | Yes | Document title (≤ 200 chars) |
| `documentType` | String | Yes | One of the `DocumentType` codes above |
| `description` | String | No | Optional description (≤ 1000 chars) |
| `allocationId` | String (uuid) | No | Link to a live (non-deleted) allocation |
| `fiscalYearId` | String (uuid) | No | Link to a non-archived fiscal year |
| `departmentId` | String (uuid) | No | Link to an active department |

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "document": {
      "id": "c1f7b8e0-0000-0000-0000-000000000020",
      "documentCode": "DOC-2026-0001",
      "title": "Purchase Request - Laboratory Equipment",
      "description": "Request for microscope units",
      "documentType": "PurchaseRequest",
      "status": "Active",
      "fiscalYear": { "id": "c1f7b8e0-0000-0000-0000-000000000001", "code": "FY-2026", "startDate": "2026-01-01T00:00:00.000Z", "endDate": "2026-12-31T00:00:00.000Z" },
      "department": { "id": "dept-eng", "code": "DEPT-ENG", "name": "College of Engineering" },
      "allocation": { "id": "c1f7b8e0-0000-0000-0000-000000000006", "allocationCode": "BA-2026-0001", "status": "Draft" },
      "uploadedBy": "c1f7b8e0-1234-4567-89ab-cdef01234567",
      "uploader": { "id": "c1f7b8e0-1234-4567-89ab-cdef01234567", "fullName": "Budget Officer", "email": "budgetofficer@university.edu", "role": "BudgetOfficer" },
      "currentVersion": {
        "id": "c1f7b8e0-0000-0000-0000-000000000021",
        "documentId": "c1f7b8e0-0000-0000-0000-000000000020",
        "versionNumber": 1,
        "originalFileName": "pr-laboratory.pdf",
        "storageKey": "9f2c1a5b-7d4e-4f3a-9b2c-1d0e8f7a6b5c.pdf",
        "mimeType": "application/pdf",
        "fileSizeBytes": 123456,
        "fileExtension": "pdf",
        "sha256Hash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
        "blockchainStatus": "Pending",
        "txHash": null,
        "txExplorerUrl": null,
        "blockNumber": null,
        "network": null,
        "confirmedAt": null,
        "replaceReason": null,
        "uploadedBy": "c1f7b8e0-1234-4567-89ab-cdef01234567",
        "uploadedAt": "2026-08-05T08:00:00.000Z"
      },
      "archivedBy": null,
      "archivedAt": null,
      "deletedAt": null,
      "createdAt": "2026-08-05T08:00:00.000Z",
      "updatedAt": "2026-08-05T08:00:00.000Z",
      "_count": { "versions": 1 }
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: Missing `file`, missing/invalid `title` or `documentType`, or unexpected file field
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Role not allowed to upload
- **404 Not Found**: Linked allocation/fiscal year/department does not exist or is not usable
- **409 Conflict**: A document with identical content (same SHA-256) already exists; or the referenced fiscal year is archived / department is inactive
- **413 Payload Too Large**: File exceeds the configured size limit
- **415 Unsupported Media Type**: Extension not allowed, MIME not recognized/allowed, or extension/MIME mismatch

---

### 19. List Documents

Paginated, searchable, filterable, sortable list of documents. Soft-deleted
(archived) documents are excluded. Search matches document code, title,
description, and linked allocation code.

- **URL**: `/documents`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | Number | No | Page number, defaults to `1` |
| `limit` | Number | No | Page size, defaults to `10`, max `100` |
| `search` | String | No | Partial match on code/title/description/allocation code |
| `documentType` | String | No | Filter by `DocumentType` |
| `status` | String | No | `Active` \| `Archived` |
| `blockchainStatus` | String | No | Filter by current version's `Pending` \| `Confirmed` \| `Failed` |
| `fiscalYearId` | String | No | Filter by linked fiscal year |
| `departmentId` | String | No | Filter by linked department |
| `allocationId` | String | No | Filter by linked allocation |
| `uploadedBy` | String | No | Filter by uploader user ID |
| `dateFrom` | String (date) | No | Include documents created on/after this date |
| `dateTo` | String (date) | No | Include documents created on/before this date (inclusive to end of day) |
| `sortBy` | String | No | `newest` \| `oldest` \| `code` \| `title` \| `createdAt` \| `updatedAt` \| `documentCode` (default `newest`) |
| `sortOrder` | String | No | `asc` \| `desc` (default `asc`) |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": {
    "documents": [
      {
        "id": "c1f7b8e0-0000-0000-0000-000000000020",
        "documentCode": "DOC-2026-0001",
        "title": "Purchase Request - Laboratory Equipment",
        "description": "Request for microscope units",
        "documentType": "PurchaseRequest",
        "status": "Active",
        "allocation": { "id": "c1f7b8e0-0000-0000-0000-000000000006", "allocationCode": "BA-2026-0001", "status": "Draft" },
        "uploader": { "id": "c1f7b8e0-1234-4567-89ab-cdef01234567", "fullName": "Budget Officer", "email": "budgetofficer@university.edu", "role": "BudgetOfficer" },
        "currentVersion": {
          "id": "c1f7b8e0-0000-0000-0000-000000000021",
          "versionNumber": 1,
          "originalFileName": "pr-laboratory.pdf",
          "mimeType": "application/pdf",
          "fileSizeBytes": 123456,
          "sha256Hash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
          "blockchainStatus": "Pending",
          "txHash": null,
          "txExplorerUrl": null,
          "confirmedAt": null
        },
        "createdAt": "2026-08-05T08:00:00.000Z",
        "updatedAt": "2026-08-05T08:00:00.000Z",
        "_count": { "versions": 1 }
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid query parameters (e.g. `limit > 100`, invalid `documentType`/`status`/`blockchainStatus` enum, malformed date)
- **401 Unauthorized**: Missing or invalid authentication token

---

### 20. Get Document by ID

Returns a single document including its current version and verification-relevant
fields. Archived (soft-deleted) documents return 404.

- **URL**: `/documents/:id`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Document retrieved successfully",
  "data": {
    "document": {
      "id": "c1f7b8e0-0000-0000-0000-000000000020",
      "documentCode": "DOC-2026-0001",
      "title": "Purchase Request - Laboratory Equipment",
      "documentType": "PurchaseRequest",
      "status": "Active",
      "uploader": { "id": "c1f7b8e0-1234-4567-89ab-cdef01234567", "fullName": "Budget Officer", "email": "budgetofficer@university.edu", "role": "BudgetOfficer" },
      "currentVersion": {
        "id": "c1f7b8e0-0000-0000-0000-000000000021",
        "versionNumber": 1,
        "originalFileName": "pr-laboratory.pdf",
        "mimeType": "application/pdf",
        "fileSizeBytes": 123456,
        "sha256Hash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
        "blockchainStatus": "Pending",
        "txExplorerUrl": null
      },
      "createdAt": "2026-08-05T08:00:00.000Z",
      "_count": { "versions": 1 }
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid document ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Document does not exist or has been archived

---

### 21. Download Document

Streams a document version's stored bytes as an attachment. Defaults to the
current version; a specific version can be requested. Headers include
`Content-Disposition: attachment`, the detected MIME type, `Content-Length`, and
`X-Content-Type-Options: nosniff`. Download requires authentication — there are no
anonymous/public URLs.

- **URL**: `/documents/:id/download`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | Number | No | 1-based version number, defaults to current |

#### Success Response (200 OK)

Binary stream with the following headers:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename*=UTF-8''pr-laboratory.pdf
Content-Length: 123456
X-Content-Type-Options: nosniff
```

#### Error Responses

- **400 Bad Request**: Invalid document ID or `version` query parameter
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Document/version not found, or stored blob is missing

---

### 22. Preview Document

Streams a document's current version inline in the browser. Only PDFs and images
are previewable; every other type returns 415. Response headers use
`Content-Disposition: inline` and `X-Content-Type-Options: nosniff`.

- **URL**: `/documents/:id/preview`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Success Response (200 OK)

```
Content-Type: application/pdf
Content-Disposition: inline
X-Content-Type-Options: nosniff
```

#### Error Responses

- **400 Bad Request**: Invalid document ID
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Document/version not found
- **415 Unsupported Media Type**: Document type cannot be previewed (not PDF/image)

---

### 23. Update Document Metadata

Edits title, description, document type, and optional links (allocation, fiscal
year, department). Only `Active` documents are editable. Budget Officers and
Treasurers may only edit their own uploads; an Administrator may edit any document.
Reference links can be removed by sending an empty string (`""`). A `METADATA_UPDATE`
activity is recorded with the list of changed fields.

- **URL**: `/documents/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer` (own), `Treasurer` (own)
- **Content-Type**: `application/json`

#### Request Body (all fields optional; at least one expected)

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | New title (≤ 200 chars) |
| `description` | String \| null | New description; empty string clears it |
| `documentType` | String | New `DocumentType` |
| `allocationId` | String \| null | Replace/clear the allocation link |
| `fiscalYearId` | String \| null | Replace/clear the fiscal year link |
| `departmentId` | String \| null | Replace/clear the department link |

```json
{
  "title": "Purchase Request - Laboratory Equipment (Amended)",
  "description": ""
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "document": {
      "id": "c1f7b8e0-0000-0000-0000-000000000020",
      "documentCode": "DOC-2026-0001",
      "title": "Purchase Request - Laboratory Equipment (Amended)",
      "description": null,
      "documentType": "PurchaseRequest",
      "status": "Active",
      "createdAt": "2026-08-05T08:00:00.000Z",
      "updatedAt": "2026-08-05T09:00:00.000Z"
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid fields (e.g. empty title, invalid `documentType`)
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User is not the uploader (non-Administrator)
- **404 Not Found**: Document does not exist; linked reference does not exist or is not usable
- **409 Conflict**: Document is archived, or a referenced fiscal year is archived / department is inactive

---

### 24. Replace Document (Version Control)

Replaces the current version with a new file, creating the next version in the
chain. The previous version remains fully stored, immutable, downloadable, and
verifiable. Only `Active` documents may be replaced; Budget Officers and Treasurers
may only replace their own uploads. Byte-identical files (same SHA-256) are
rejected with 409, and replacement beyond the configured version limit (default 50)
is rejected. The new version is anchored on the ledger fail-soft. A `REPLACE`
activity records the `fromVersionNumber`/`toVersionNumber`.

- **URL**: `/documents/:id/replace`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer` (own), `Treasurer` (own)
- **Rate Limit**: uploads are limited (default 20 requests per 15 minutes per IP)
- **Content-Type**: `multipart/form-data`

#### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Replacement file (≤ 25 MB, allowed type) |
| `replaceReason` | String | No | Optional reason for the replacement (≤ 500 chars) |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Document replaced successfully",
  "data": {
    "document": {
      "id": "c1f7b8e0-0000-0000-0000-000000000020",
      "documentCode": "DOC-2026-0001",
      "title": "Purchase Request - Laboratory Equipment",
      "documentType": "PurchaseRequest",
      "status": "Active",
      "currentVersion": {
        "id": "c1f7b8e0-0000-0000-0000-000000000024",
        "versionNumber": 2,
        "originalFileName": "pr-laboratory-v2.pdf",
        "mimeType": "application/pdf",
        "fileSizeBytes": 130000,
        "sha256Hash": "3c1a9b7e0f2d4c6a8b1e3f5d7c9a2b4d6e8f0a1c3b5d7e9f2a4c6b8d0e1f3a5c",
        "blockchainStatus": "Pending",
        "txHash": null,
        "txExplorerUrl": null,
        "replaceReason": "Updated quotation totals",
        "uploadedAt": "2026-08-05T10:00:00.000Z"
      },
      "_count": { "versions": 2 }
    },
    "version": {
      "id": "c1f7b8e0-0000-0000-0000-000000000024",
      "versionNumber": 2,
      "originalFileName": "pr-laboratory-v2.pdf",
      "mimeType": "application/pdf",
      "fileSizeBytes": 130000,
      "sha256Hash": "3c1a9b7e0f2d4c6a8b1e3f5d7c9a2b4d6e8f0a1c3b5d7e9f2a4c6b8d0e1f3a5c",
      "blockchainStatus": "Pending",
      "replaceReason": "Updated quotation totals"
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: Missing file or invalid `:id`
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User is not the uploader (non-Administrator)
- **404 Not Found**: Document does not exist
- **409 Conflict**: Document is archived; a version with identical content already exists; or the version limit has been reached
- **413 Payload Too Large**: File exceeds the configured size limit
- **415 Unsupported Media Type**: File type not allowed or extension/MIME mismatch

---

### 25. Get Version History

Lists every version of a document (newest first) with uploader details and
blockchain anchor state. Previous versions remain downloadable via the download
endpoint's `version` query parameter.

- **URL**: `/documents/:id/versions`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Document versions retrieved successfully",
  "data": {
    "versions": [
      {
        "id": "c1f7b8e0-0000-0000-0000-000000000024",
        "documentId": "c1f7b8e0-0000-0000-0000-000000000020",
        "versionNumber": 2,
        "originalFileName": "pr-laboratory-v2.pdf",
        "mimeType": "application/pdf",
        "fileSizeBytes": 130000,
        "fileExtension": "pdf",
        "sha256Hash": "3c1a9b7e0f2d4c6a8b1e3f5d7c9a2b4d6e8f0a1c3b5d7e9f2a4c6b8d0e1f3a5c",
        "blockchainStatus": "Pending",
        "txHash": null,
        "txExplorerUrl": null,
        "blockNumber": null,
        "confirmedAt": null,
        "replaceReason": "Updated quotation totals",
        "uploader": { "id": "c1f7b8e0-1234-4567-89ab-cdef01234567", "fullName": "Budget Officer", "email": "budgetofficer@university.edu", "role": "BudgetOfficer" },
        "uploadedAt": "2026-08-05T10:00:00.000Z"
      },
      {
        "id": "c1f7b8e0-0000-0000-0000-000000000021",
        "versionNumber": 1,
        "originalFileName": "pr-laboratory.pdf",
        "mimeType": "application/pdf",
        "fileSizeBytes": 123456,
        "fileExtension": "pdf",
        "sha256Hash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
        "blockchainStatus": "Confirmed",
        "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
        "txExplorerUrl": "http://localhost:8545/tx/0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
        "blockNumber": 96,
        "confirmedAt": "2026-08-05T08:01:00.000Z",
        "replaceReason": null,
        "uploader": { "id": "c1f7b8e0-1234-4567-89ab-cdef01234567", "fullName": "Budget Officer", "email": "budgetofficer@university.edu", "role": "BudgetOfficer" },
        "uploadedAt": "2026-08-05T08:00:00.000Z"
      }
    ]
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid document ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Document does not exist or has been archived

---

### 26. Verify Document

Verifies a document version's tamper-evidence: recomputes the SHA-256 of the stored
bytes and compares it with the hash recorded at upload (`integrityOk`), and — when a
node is reachable — confirms the anchor on the `BudgetLedger` contract (`onChain`).
A `VERIFY` activity and audit entry are always recorded with the result. The
response mirrors the allocation verification shape so the frontend verification card
is reusable.

- **URL**: `/documents/:id/verify`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | Number | No | 1-based version number, defaults to current |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Document verification completed",
  "data": {
    "verified": true,
    "integrityOk": true,
    "onChain": { "exists": true, "anchoredBy": "0x5FbDB2315678afecb367f032d93F642f64180aa3", "anchoredAt": 1710000000, "blockNumber": 96 },
    "inconclusive": false,
    "message": "Document verified on the blockchain ledger.",
    "documentCode": "DOC-2026-0001",
    "version": {
      "id": "c1f7b8e0-0000-0000-0000-000000000021",
      "versionNumber": 1,
      "originalFileName": "pr-laboratory.pdf",
      "mimeType": "application/pdf",
      "fileSizeBytes": 123456,
      "sha256Hash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
      "blockchainStatus": "Confirmed",
      "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "txExplorerUrl": "http://localhost:8545/tx/0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8"
    }
  }
}
```

**Outcome semantics**

| `integrityOk` | `onChain` | `verified` | `inconclusive` | Meaning |
|---------------|-----------|------------|----------------|---------|
| `true` | `{ exists: true, ... }` | `true` | `false` | Bytes intact and anchored on-chain |
| `false` | anything | `false` | `false` | Hash mismatch — possible tampering |
| `true` | `null` | `false` | `true` | Node unreachable — anchor could not be confirmed |
| `true` | `{ exists: false, ... }` | `false` | `false` | Version not anchored on this node |

#### Error Responses

- **400 Bad Request**: Invalid document ID or `version` query parameter
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Document/version not found, or stored file cannot be read

---

### 27. Retry Document Anchor

Re-anchors a `Pending` or `Failed` document version on the ledger. Already-confirmed
versions are returned as-is. Auditor is not permitted to retry.

- **URL**: `/documents/:id/retry`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`
- **Request Body**: none

#### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | Number | No | 1-based version number, defaults to current |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Document anchored successfully",
  "data": {
    "version": {
      "id": "c1f7b8e0-0000-0000-0000-000000000021",
      "versionNumber": 1,
      "originalFileName": "pr-laboratory.pdf",
      "mimeType": "application/pdf",
      "fileSizeBytes": 123456,
      "sha256Hash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
      "blockchainStatus": "Confirmed",
      "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "txExplorerUrl": "http://localhost:8545/tx/0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "blockNumber": 101,
      "network": "hardhat",
      "confirmedAt": "2026-08-05T11:00:00.000Z"
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid document ID or `version` query parameter
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User does not have permission to retry (e.g. Auditor)
- **404 Not Found**: Document/version does not exist or has been archived
- **503 Service Unavailable**: Ledger not configured or the on-chain write failed

---

### 28. Get Activity History

Returns the persisted audit timeline of a document (newest first) with actor
details. Every upload, metadata update, replace, archive, verify, and anchor retry
is recorded and immutable (there are no update/delete endpoints for activities).

- **URL**: `/documents/:id/activity`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Document activities retrieved successfully",
  "data": {
    "activities": [
      {
        "id": "c1f7b8e0-0000-0000-0000-000000000025",
        "documentId": "c1f7b8e0-0000-0000-0000-000000000020",
        "versionId": "c1f7b8e0-0000-0000-0000-000000000021",
        "actorId": "c1f7b8e0-1234-4567-89ab-cdef01234567",
        "actor": { "id": "c1f7b8e0-1234-4567-89ab-cdef01234567", "fullName": "Budget Officer", "email": "budgetofficer@university.edu", "role": "BudgetOfficer" },
        "action": "UPLOAD",
        "details": {
          "documentCode": "DOC-2026-0001",
          "versionNumber": 1,
          "fileSizeBytes": 123456,
          "sha256Hash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
          "documentType": "PurchaseRequest"
        },
        "createdAt": "2026-08-05T08:00:00.000Z"
      }
    ]
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid document ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Document does not exist or has been archived

---

### 29. Archive Document (Soft Delete)

Archives + soft-deletes a document (`status` becomes `Archived`, `deletedAt` set).
Versions and stored bytes are kept for the chain of evidence; only the logical
document row is hidden from normal queries. Administrators may archive any
document; Budget Officers and Treasurers only their own. Already-archived documents
cannot be archived again.

- **URL**: `/documents/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator` (any), `BudgetOfficer` (own), `Treasurer` (own)
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Document archived successfully",
  "data": {}
}
```

#### Error Responses

- **400 Bad Request**: Invalid document ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User is not the uploader (non-Administrator)
- **404 Not Found**: Document does not exist
- **409 Conflict**: Document is already archived

---

# API Documentation - Phase 4.6: Blockchain Integrity & Audit Trail

This section documents the Phase 4.6 endpoints: the persisted audit log, the unified
blockchain history, the financial activity timeline, and external-file verification.
All endpoints are mounted under the `/api` base URL and require authentication.

## Audit Log Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (uuid) | Audit entry ID |
| `action` | String | One of the `AUDIT_ACTIONS` values (e.g. `AUTH_LOGIN`, `ALLOCATION_APPROVED`, `DOCUMENT_UPLOAD`, `AUDIT_ANCHOR_RETRY`) |
| `result` | String | `SUCCESS` \| `FAILURE` |
| `resourceType` | String \| null | Entity type the entry refers to (e.g. `Allocation`, `Document`, `User`) |
| `resourceId` | String (uuid) \| null | ID of the related entity |
| `resourceCode` | String \| null | Human-readable code (e.g. `BA-2026-0001`) |
| `actorId` | String (uuid) \| null | Acting user ID |
| `actor` | Object \| null | Snapshot `{ id, fullName, email, role }` at the time of the event |
| `ipAddress` | String \| null | Client IP |
| `userAgent` | String \| null | Client user agent |
| `details` | Object \| null | Sanitized structured payload (secrets auto-redacted, nested keys included) |
| `eventHash` | String | SHA-256 digest of the entry content (tamper-evidence) |
| `txHash` | String \| null | Anchor transaction hash, null until confirmed |
| `txExplorerUrl` | String \| null | Block explorer link, null if unconfigured/unconfirmed |
| `anchorStatus` | String | `NotAnchored` \| `Pending` \| `Confirmed` \| `Failed` |
| `createdAt` | ISO date | Event timestamp |

**Append-only guarantee:** there are no update/delete endpoints or repository mutators.
`PUT`, `PATCH`, and `DELETE` on `/api/audit-logs` and `/api/audit-logs/:id` return 404.
The only write path is `POST /api/audit-logs/:id/retry` (anchor bookkeeping only).

## Role-Based Access Control

| Endpoint | Administrator | BudgetOfficer | Treasurer | Auditor |
|----------|:---:|:---:|:---:|:---:|
| GET `/audit-logs` | ✓ | ✓ | ✓ | ✓ |
| GET `/audit-logs/summary` | ✓ | ✓ | ✓ | ✓ |
| GET `/audit-logs/:id` | ✓ | ✓ | ✓ | ✓ |
| POST `/audit-logs/:id/retry` | ✓ | ✓ | ✓ | ✗ |
| GET `/blockchain/history` | ✓ | ✓ | ✓ | ✓ |
| GET `/blockchain/transactions/:id` | ✓ | ✓ | ✓ | ✓ |
| GET `/dashboard/timeline` | ✓ | ✓ | ✓ | ✓ |
| POST `/verification/documents` | ✓ | ✓ | ✓ | ✓ |

---

### 30. List Audit Logs

Paginated, searchable, filterable list of persisted audit entries (newest first).

- **URL**: `/audit-logs`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | Number | No | Page number, defaults to `1` |
| `limit` | Number | No | Page size, defaults to `10`, max `100` |
| `search` | String | No | Partial match on action, resource code, actor name/email |
| `action` | String | No | Filter by `AUDIT_ACTIONS` value |
| `result` | String | No | `SUCCESS` \| `FAILURE` |
| `resourceType` | String | No | Filter by entity type |
| `resourceId` | String | No | Filter by entity ID |
| `actorId` | String | No | Filter by acting user ID |
| `dateFrom` | String (date) | No | Include entries created on/after this date |
| `dateTo` | String (date) | No | Include entries created on/before this date |
| `sortBy` | String | No | `newest` (default) \| `oldest` \| `action` \| `result` \| `createdAt` |
| `sortOrder` | String | No | `asc` \| `desc` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Audit logs retrieved successfully",
  "data": {
    "auditLogs": [
      {
        "id": "c1f7b8e0-0000-0000-0000-000000000030",
        "action": "AUTH_LOGIN",
        "result": "SUCCESS",
        "resourceType": null,
        "resourceId": null,
        "resourceCode": null,
        "actorId": "c1f7b8e0-1234-4567-89ab-cdef01234567",
        "actor": { "id": "c1f7b8e0-1234-4567-89ab-cdef01234567", "fullName": "System Administrator", "email": "admin@university.edu", "role": "Administrator" },
        "ipAddress": "127.0.0.1",
        "userAgent": "axios/1.7.2",
        "details": {},
        "eventHash": "6c3f4a2b9e1d8c0f5b7a2e4f1d3c6b8a0e9d7f5c3b1a9e8d6f4c2b0a1e3f5d7",
        "txHash": "0x4c1e8f2a6b3d5f7a9c0e2d4f6a8b1c3e5f7a9d0b2c4e6f8a1d3f5b7c9e0a2d4f6",
        "txExplorerUrl": "http://localhost:8545/tx/0x4c1e8f2a6b3d5f7a9c0e2d4f6a8b1c3e5f7a9d0b2c4e6f8a1d3f5b7c9e0a2d4f6",
        "anchorStatus": "Confirmed",
        "createdAt": "2026-08-06T08:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid query parameters (e.g. `limit > 100`, invalid enum, malformed date)
- **401 Unauthorized**: Missing or invalid authentication token

---

### 31. Audit Log Summary

Counts by action and result for the audit dashboard.

- **URL**: `/audit-logs/summary`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Audit log summary retrieved successfully",
  "data": {
    "summary": {
      "total": 128,
      "byAction": { "AUTH_LOGIN": 42, "ALLOCATION_APPROVED": 8, "DOCUMENT_UPLOAD": 12 },
      "byResult": { "SUCCESS": 120, "FAILURE": 8 },
      "byAnchorStatus": { "Confirmed": 110, "Pending": 15, "Failed": 2, "NotAnchored": 1 }
    }
  }
}
```

#### Error Responses

- **401 Unauthorized**: Missing or invalid authentication token

---

### 32. Get Audit Log Entry

Returns a single audit entry including anchor status and explorer link.

- **URL**: `/audit-logs/:id`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Audit log retrieved successfully",
  "data": { "auditLog": { "id": "c1f7b8e0-...", "action": "AUTH_LOGIN", "result": "SUCCESS", "anchorStatus": "Confirmed", "...": "..." } }
}
```

#### Error Responses

- **400 Bad Request**: Invalid audit log ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Audit log entry does not exist

---

### 33. Retry Audit Anchor

Re-anchors a `Pending` or `Failed` audit entry on the `AuditLedger` contract.
Already-confirmed entries are returned as-is. Auditor is not permitted to retry.

- **URL**: `/audit-logs/:id/retry`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`
- **Request Body**: none

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Audit entry anchored successfully",
  "data": {
    "auditLog": {
      "id": "c1f7b8e0-0000-0000-0000-000000000030",
      "action": "AUTH_LOGIN",
      "result": "SUCCESS",
      "anchorStatus": "Confirmed",
      "txHash": "0x4c1e8f2a6b3d5f7a9c0e2d4f6a8b1c3e5f7a9d0b2c4e6f8a1d3f5b7c9e0a2d4f6",
      "txExplorerUrl": "http://localhost:8545/tx/0x4c1e8f2a6b3d5f7a9c0e2d4f6a8b1c3e5f7a9d0b2c4e6f8a1d3f5b7c9e0a2d4f6"
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid audit log ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User does not have permission to retry (e.g. Auditor)
- **404 Not Found**: Audit log entry does not exist
- **503 Service Unavailable**: Ledger not configured or the on-chain write failed

---

### 34. Unified Blockchain History

Returns a single type-aware ledger view across allocations, document versions, and
audit events, merged by anchor time and paginated.

- **URL**: `/blockchain/history`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | Number | No | Page number, defaults to `1` |
| `limit` | Number | No | Page size, defaults to `10`, max `100` |
| `recordType` | String | No | `Allocation` \| `Document` \| `Audit` |
| `status` | String | No | `Pending` \| `Confirmed` \| `Failed` |
| `search` | String | No | Partial match on code/hash/tx hash |
| `dateFrom` | String (date) | No | Include anchors created on/after this date |
| `dateTo` | String (date) | No | Include anchors created on/before this date |
| `sortBy` | String | No | `newest` (default) \| `oldest` \| `code` \| `status` \| `createdAt` |
| `sortOrder` | String | No | `asc` \| `desc` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Blockchain history retrieved successfully",
  "data": {
    "entries": [
      {
        "id": "c1f7b8e0-0000-0000-0000-000000000012",
        "recordType": "Allocation",
        "code": "BA-2026-0001",
        "hash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
        "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
        "blockNumber": 96,
        "network": "hardhat",
        "status": "Confirmed",
        "createdAt": "2026-08-04T09:31:00.000Z",
        "explorerUrl": "http://localhost:8545/tx/0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
        "ref": { "allocationId": "c1f7b8e0-0000-0000-0000-000000000006" }
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid query parameters (e.g. `limit > 100`, invalid `recordType`/`status` enum, malformed date)
- **401 Unauthorized**: Missing or invalid authentication token

---

### 35. Blockchain Transaction Detail

Returns the anchor details for a single unified ledger entry plus, when
available, the on-chain record confirmation.

- **URL**: `/blockchain/transactions/:id`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Blockchain transaction retrieved successfully",
  "data": {
    "entry": {
      "id": "c1f7b8e0-0000-0000-0000-000000000012",
      "recordType": "Allocation",
      "code": "BA-2026-0001",
      "hash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
      "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "blockNumber": 96,
      "network": "hardhat",
      "status": "Confirmed",
      "createdAt": "2026-08-04T09:31:00.000Z",
      "explorerUrl": "http://localhost:8545/tx/0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "ref": { "allocationId": "c1f7b8e0-0000-0000-0000-000000000006" }
    }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid transaction ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Transaction entry does not exist

---

### 36. Financial Activity Timeline

Merged chronological feed of allocation approvals, document activities, audit log
entries, and blockchain anchors for the dashboard.

- **URL**: `/dashboard/timeline`
- **Method**: `GET`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`

#### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | Number | No | Page number, defaults to `1` |
| `limit` | Number | No | Page size, defaults to `10`, max `100` |
| `kind` | String | No | `AllocationApproval` \| `DocumentActivity` \| `AuditLog` \| `BlockchainRecord` |
| `dateFrom` | String (date) | No | Include events on/after this date |
| `dateTo` | String (date) | No | Include events on/before this date |
| `sortBy` | String | No | `newest` (default) \| `oldest` \| `createdAt` |
| `sortOrder` | String | No | `asc` \| `desc` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Timeline retrieved successfully",
  "data": {
    "timeline": [
      {
        "id": "c1f7b8e0-0000-0000-0000-000000000040",
        "kind": "AllocationApproval",
        "action": "Approved",
        "label": "Allocation approved",
        "description": "BA-2026-0001 approved by System Administrator",
        "actor": { "id": "c1f7b8e0-1234-4567-89ab-cdef01234567", "fullName": "System Administrator", "email": "admin@university.edu", "role": "Administrator" },
        "resourceType": "Allocation",
        "resourceCode": "BA-2026-0001",
        "details": { "allocationId": "c1f7b8e0-0000-0000-0000-000000000006" },
        "createdAt": "2026-08-03T10:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid query parameters (e.g. `limit > 100`, invalid `kind` enum, malformed date)
- **401 Unauthorized**: Missing or invalid authentication token

---

### 37. Verify External Document

Verifies a user-supplied file (not stored in the system) against recorded document
hashes and the ledger. The uploaded file is streamed to a temp location, hashed
(SHA-256), and matched against stored `DocumentVersion` rows **without ever being
persisted**. When a match is found and a ledger node is reachable, the on-chain
anchor is confirmed; otherwise the result is `inconclusive` (never a false
"verified"). A `VERIFY` document activity + audit entry are recorded only on a match.

- **URL**: `/verification/documents`
- **Method**: `POST`
- **Auth Required**: Yes (`Bearer <token>`)
- **Roles**: `Administrator`, `BudgetOfficer`, `Treasurer`, `Auditor`
- **Rate Limit**: uploads are limited (default 20 requests per 15 minutes per IP)
- **Content-Type**: `multipart/form-data`

#### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | File bytes to verify (≤ 25 MB, allowed type) |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "External document verification completed",
  "data": {
    "verified": true,
    "integrityOk": true,
    "onChain": { "exists": true, "anchoredBy": "0x5FbDB2315678afecb367f032d93F642f64180aa3", "anchoredAt": 1710000000, "blockNumber": 96 },
    "inconclusive": false,
    "message": "Document verified on the blockchain ledger.",
    "matchedVersion": {
      "id": "c1f7b8e0-0000-0000-0000-000000000021",
      "documentId": "c1f7b8e0-0000-0000-0000-000000000020",
      "versionNumber": 1,
      "originalFileName": "pr-laboratory.pdf",
      "sha256Hash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
      "blockchainStatus": "Confirmed",
      "document": { "id": "c1f7b8e0-0000-0000-0000-000000000020", "documentCode": "DOC-2026-0001", "title": "Purchase Request - Laboratory Equipment" }
    },
    "verifiedAgainst": "blockchain"
  }
}
```

**Outcome semantics**

| `verified` | `verifiedAgainst` | Meaning |
|------------|-------------------|---------|
| `true` | `blockchain` | Hash matches a stored version **and** the on-chain anchor was confirmed |
| `true` | `database` | Hash matches a stored version but the ledger could not be consulted |
| `false` | `none` | No stored version matches the computed hash (no on-chain evidence) |

`inconclusive` is `true` only when a hash match exists but the ledger node is
unreachable, so the anchor cannot be confirmed or refuted.

#### Error Responses

- **400 Bad Request**: Missing `file`, or unexpected file field
- **401 Unauthorized**: Missing or invalid authentication token
- **413 Payload Too Large**: File exceeds the configured size limit
- **415 Unsupported Media Type**: File type not allowed or extension/MIME mismatch


