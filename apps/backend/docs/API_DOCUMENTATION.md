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

\* Budget Officers can only delete `Draft` allocations; Administrators may delete any
non-`Archived` allocation.

## Status Rules

- Allocations are always created as `Draft`; the `status` field is not accepted on create.
- Only `Draft` allocations can be edited (409 otherwise).
- `Approved` allocations are immutable.
- `Archived` allocations cannot be deleted.
- Deleted allocations are soft-deleted (`deletedAt` set) and excluded from all reads,
  statistics, and remaining-budget computations.
- Rejected, Archived, and soft-deleted allocations do not block a new allocation with
  the same fiscal year, department, program, fund source, and category combination.

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
- `totalAllocatedAmount` sums `Draft`, `PendingApproval`, and `Approved` allocations.
- `remainingBudget` = sum of the referenced fiscal years' `budgetAmount` ceilings minus
  `totalAllocatedAmount`. When no `fiscalYearId` is supplied, it is scoped to the fiscal
  years referenced by existing allocations.
- `Archived` and `Rejected` allocations are excluded from all amounts.

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
- **409 Conflict**: the specified fiscal year is archived
