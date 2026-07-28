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
