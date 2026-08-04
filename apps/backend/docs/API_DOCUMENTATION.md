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

## Phase 4.4 - Blockchain Ledger Endpoints

The blockchain ledger anchors every approved allocation with an immutable SHA-256 content
hash recorded on the `BudgetLedger` EVM smart contract. Draft records are never written
on-chain. Each write is mirrored
in the `BlockchainRecord` table so the API remains fully functional even when
the ledger node is unreachable (records stay `Pending` and can be re-anchored
later via the retry endpoint).

### Blockchain Record Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (uuid) | Record ID |
| `allocationId` | String (uuid) | Related allocation |
| `allocationCode` | String | Allocation code, e.g. `BA-2026-0001` |
| `contentHash` | String | Hex-encoded SHA-256 digest of the allocation content |
| `txHash` | String \| null | Ethereum transaction hash, null until confirmed |
| `blockNumber` | Number \| null | Block number the record was anchored in |
| `network` | String | Ledger network name, e.g. `hardhat` |
| `status` | String | `Pending` \| `Confirmed` \| `Failed` |
| `confirmedAt` | ISO date \| null | When the on-chain write was confirmed |
| `createdBy` | String (uuid) | User who triggered the anchoring |

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
| `sortBy` | String | No | `newest` \| `oldest` \| `status` \| `allocationCode` (default `newest`) |
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
    "onChain": { "exists": true, "anchoredBy": "0x...", "anchoredAt": 1700000000, "blockNumber": 96 },
    "record": {
      "id": "c1f7b8e0-0000-0000-0000-000000000012",
      "allocationCode": "BA-2026-0001",
      "contentHash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
      "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "blockNumber": 96,
      "network": "hardhat",
      "status": "Confirmed",
      "confirmedAt": "2026-08-04T09:31:00.000Z"
    },
    "message": "Allocation verified on the blockchain ledger."
  }
}
```

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

Response shape matches the Allocation Verification Detail endpoint (Section 15).

#### Error Responses

- **404 Not Found**: allocation does not exist or has been soft-deleted

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
      "allocationCode": "BA-2026-0001",
      "contentHash": "02a4cc19fdf22ddbbe1fc46da8cd2e3bfbffc687283df49f0707b61fa9cb48d2",
      "txHash": "0x9b7f0f1d0a3e2c5b9a1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8",
      "blockNumber": 101,
      "network": "hardhat",
      "status": "Confirmed",
      "confirmedAt": "2026-08-04T10:05:00.000Z"
    }
  }
}
```

#### Error Responses

- **404 Not Found**: allocation does not exist or has been soft-deleted
- **503 Service Unavailable**: ledger not configured or the on-chain write failed

