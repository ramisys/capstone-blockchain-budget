````markdown
# Project Knowledge

> **Project:** Blockchain-Based Budget Allocation and Expense Monitoring System
>
> **Version:** 1.0.0
>
> **Last Updated:** August 2026

---

# Table of Contents

- 1. Project Overview
- 2. Vision
- 3. Problem Statement
- 4. Proposed Solution
- 5. Objectives
- 6. Stakeholders
- 7. Business Domain
- 8. Core Principles
- 9. System Scope
- 10. High-Level Architecture
- 11. Technology Stack
- 12. Development Philosophy

---

# 1. Project Overview

## Project Name

**Blockchain-Based Budget Allocation and Expense Monitoring System**

---

## Project Description

The Blockchain-Based Budget Allocation and Expense Monitoring System is a web-based enterprise financial management application designed to improve transparency, accountability, and traceability in budget allocation and expense monitoring.

The system enables organizations to:

- Create and manage budget allocations.
- Monitor departmental expenditures.
- Route budget-related actions through an approval workflow.
- Maintain an immutable audit trail.
- Verify financial records using blockchain technology.
- Generate financial reports for decision-makers.

The system is intended to modernize financial management processes while reducing manual errors, improving accountability, and strengthening public trust.

---

# 2. Vision

To provide a secure, transparent, and efficient financial management platform that leverages blockchain technology to ensure integrity, accountability, and trust in organizational budget allocation and expense monitoring.

---

# 3. Problem Statement

Traditional financial management processes commonly suffer from:

- Manual approval workflows
- Paper-based documentation
- Limited auditability
- Data inconsistencies
- Delayed approvals
- Poor visibility of budget utilization
- Difficulty detecting unauthorized changes
- Weak historical tracking

These issues reduce operational efficiency and increase the risk of errors and fraud.

---

# 4. Proposed Solution

The proposed system addresses these challenges by providing:

- Centralized budget management
- Digital approval workflows
- Real-time budget tracking
- Expense monitoring
- Immutable blockchain verification
- Comprehensive audit logs
- Role-based access control
- Reporting and analytics

Blockchain is used as a verification layer rather than replacing the relational database. Critical financial events are hashed and recorded on-chain to provide tamper-evident verification while operational data remains in the primary database.

---

# 5. Objectives

## Primary Objectives

- Improve financial transparency.
- Improve budget accountability.
- Streamline approval workflows.
- Reduce manual processes.
- Strengthen audit capabilities.
- Enhance data integrity.

---

## Technical Objectives

- Build a scalable web application.
- Implement layered architecture.
- Separate business logic from presentation.
- Maintain clean, reusable code.
- Follow secure development practices.
- Support future scalability.

---

# 6. Stakeholders

## System Administrator

Responsibilities

- User management
- System configuration
- Security
- Maintenance

---

## Budget Officer

Responsibilities

- Create budget allocations
- Update allocations
- Monitor allocations
- Submit requests

---

## Department Head

Responsibilities

- Review requests
- Approve or reject allocations
- Monitor departmental budgets

---

## Treasurer

Responsibilities

- Final financial approval
- Budget validation
- Financial oversight

---

## Auditor

Responsibilities

- Review audit logs
- Verify blockchain records
- Inspect financial history
- Generate compliance reports

---

# 7. Business Domain

The project belongs to the Financial Management Information System (FMIS) domain.

Primary business areas include:

- Budget Planning
- Budget Allocation
- Expense Monitoring
- Financial Approval
- Financial Reporting
- Audit Management
- Blockchain Verification

---

## Core Business Entities

The system revolves around the following entities:

- User
- Role
- Department
- Budget Allocation
- Budget Request
- Expense
- Approval
- Audit Log
- Blockchain Transaction
- Financial Report

These entities form the foundation of the application's data model and business workflows.

---

# 8. Core Principles

Every feature developed within this project should support one or more of the following principles.

## Transparency

Financial information should be visible to authorized users.

---

## Accountability

Every significant action should be traceable to an authenticated user.

---

## Integrity

Financial records must remain accurate and tamper-evident.

---

## Security

Access to sensitive functionality should be restricted using role-based permissions.

---

## Maintainability

The codebase should prioritize readability, modularity, and long-term maintainability.

---

## Scalability

New modules should integrate with minimal changes to existing functionality.

---

# 9. System Scope

The application currently includes or plans to include the following modules.

## Authentication

- Login
- Logout
- Session Management
- Role-Based Access Control

---

## Dashboard

- Financial Summary
- Statistics
- Charts
- Notifications
- Recent Activities

---

## Budget Allocation

- Create Allocation
- Edit Allocation
- Archive Allocation
- View Allocation
- Budget Tracking

---

## Budget Approval

- Submit Requests
- Review Requests
- Approval Workflow
- Approval History
- Notifications

---

## Expense Monitoring

- Expense Recording
- Expense Tracking
- Attachment Management
- Status Monitoring

---

## Reports

- Financial Reports
- Budget Reports
- Expense Reports
- Audit Reports

---

## Audit Logs

- User Activity
- Data Changes
- Approval History
- Blockchain Verification History

---

## Blockchain

- Transaction Verification
- Hash Storage
- Integrity Validation
- Transaction Viewer

---

# 10. High-Level Architecture

The project follows an N-Tier Layered Architecture.

```
Client

↓

Routes

↓

Middleware

↓

Controllers

↓

Services

↓

Repositories

↓

Prisma ORM

↓

MySQL Database

↓

Blockchain Layer
```

---

## Architectural Principles

- Separation of Concerns
- Dependency Injection (where applicable)
- Single Responsibility Principle
- Layer Isolation
- Reusable Services
- Testable Business Logic

---

# 11. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Table
- React Hook Form
- Zod
- TanStack Query
- Lucide React
- Recharts

---

## Backend

- Node.js
- Express.js
- TypeScript

---

## Database

- MySQL
- Prisma ORM

---

## Authentication

- JWT
- Refresh Tokens
- Role-Based Access Control

---

## Blockchain

- Solidity
- Hardhat
- Ethers.js
- Sepolia Testnet
- Local Hardhat Network (Development)

---

## Development Tools

- Git
- GitHub
- ESLint
- Prettier
- Docker (Optional)
- Postman / Bruno
- VS Code

---

# 12. Development Philosophy

The project follows several engineering principles.

## Clean Architecture

Business logic should not depend on UI implementation.

---

## Reusability

Components, services, and utilities should be reusable whenever practical.

---

## Maintainability

Readability is preferred over cleverness.

Future developers should be able to understand the code quickly.

---

## Consistency

Follow established coding standards, naming conventions, and project documentation.

---

## Documentation First

Major features should be documented before implementation whenever feasible.

---

## AI-Assisted Development

The project is designed to support AI-assisted development.

AI tools should:

- Analyze the existing codebase before making changes.
- Respect the layered architecture.
- Reuse existing components whenever possible.
- Avoid introducing duplicate functionality.
- Preserve coding conventions.
- Update documentation when introducing significant features.

---

````markdown
---

# 13. Business Rules

This section defines the core business rules that govern the application's behavior.

Business rules must remain independent of the user interface and should be enforced in the service layer.

---

## General Rules

- Every authenticated action must be associated with a valid user.
- Every significant financial action must be recorded in the audit log.
- Critical financial records should be verified using blockchain.
- Deleted financial records should be archived instead of permanently removed whenever possible.
- All timestamps should use UTC internally.
- Financial values must never be stored as formatted strings.

---

## Budget Rules

- Budget allocations cannot have negative values.
- Total allocated budget cannot exceed the approved fiscal budget.
- Archived allocations cannot be edited.
- Closed allocations cannot receive new expenses.
- Budget utilization must be recalculated after every approved expense.

---

## Expense Rules

- Every expense must belong to a budget allocation.
- Expense amount cannot exceed the remaining budget.
- Rejected expenses cannot be marked as paid.
- Expenses requiring approval cannot bypass the approval workflow.

---

## Approval Rules

- Only authorized users may approve requests.
- Users cannot approve their own submissions (unless explicitly permitted by policy).
- Rejections should include a reason.
- Every approval decision must be recorded.

---

## Blockchain Rules

Blockchain should only verify finalized financial records.

Do not write draft or temporary records to the blockchain.

---

# 14. User Roles

---

## Administrator

Primary responsibilities:

- Manage users
- Manage roles
- Configure the system
- View all modules
- Access audit logs

---

## Budget Officer

Responsibilities:

- Create budget allocations
- Update allocations
- Submit budget requests
- Monitor budgets

Cannot:

- Perform final approvals
- Modify audit history

---

## Department Head

Responsibilities:

- Review departmental requests
- Approve or reject requests
- Monitor department spending

---

## Treasurer

Responsibilities:

- Final approval
- Validate budget availability
- Review financial reports

---

## Auditor

Responsibilities:

- Read-only access
- Review blockchain records
- Inspect audit history
- Generate compliance reports

Cannot:

- Modify financial records
- Approve requests

---

# 15. Permission Matrix

| Feature | Admin | Budget Officer | Department Head | Treasurer | Auditor |
|----------|:----:|:--------------:|:---------------:|:----------:|:--------:|
| View Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Budget Allocation | ✓ | ✓ | | | |
| Edit Budget Allocation | ✓ | ✓ | | | |
| Archive Budget Allocation | ✓ | ✓ | | | |
| Submit Budget Request | ✓ | ✓ | | | |
| Review Requests | ✓ | | ✓ | ✓ | |
| Approve Requests | ✓ | | ✓ | ✓ | |
| Reject Requests | ✓ | | ✓ | ✓ | |
| Record Expense | ✓ | ✓ | | | |
| View Reports | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Audit Logs | ✓ | | | | ✓ |
| Verify Blockchain Records | ✓ | | | | ✓ |
| Manage Users | ✓ | | | | |

---

# 16. Business Modules

The application is organized into the following business modules.

---

## Authentication

Responsibilities

- Login
- Logout
- Session validation
- Token refresh
- Role verification

---

## Dashboard

Displays:

- Financial summaries
- KPIs
- Charts
- Notifications
- Recent activities

---

## Budget Allocation

Responsibilities

- Create allocations
- Update allocations
- Archive allocations
- Track utilization

---

## Budget Approval

Responsibilities

- Submit requests
- Review requests
- Approve or reject
- Track workflow

---

## Expense Monitoring

Responsibilities

- Record expenses
- Track spending
- Manage attachments
- Monitor utilization

---

## Audit Logs

Responsibilities

- Record user actions
- Record data changes
- Maintain activity history

---

## Blockchain

Responsibilities

- Record verification hashes
- Validate integrity
- Display transaction history

---

## Reports

Responsibilities

- Generate reports
- Export reports
- Financial analytics

---

# 17. Budget Allocation Workflow

```
Create Allocation

↓

Validate Input

↓

Save Allocation

↓

Audit Log

↓

(Optional Blockchain Verification)

↓

Active Allocation
```

---

## Workflow Description

1. User creates a budget allocation.
2. System validates the request.
3. Allocation is saved.
4. Audit log is created.
5. Allocation becomes active.

---

# 18. Budget Approval Workflow

```
Draft

↓

Submitted

↓

Department Review

↓

Treasurer Review

↓

Approved

↓

Blockchain Verification

↓

Completed
```

---

## Rejection Flow

```
Submitted

↓

Rejected

↓

Returned for Revision

↓

Resubmitted
```

---

## Approval States

- Draft
- Submitted
- Under Review
- Approved
- Rejected
- Returned
- Completed

---

# 19. Expense Workflow

```
Create Expense

↓

Validate Budget

↓

Submit

↓

Approval (if required)

↓

Approved

↓

Record Expense

↓

Update Budget Utilization

↓

Audit Log

↓

Blockchain Verification
```

---

## Expense Status

- Draft
- Submitted
- Approved
- Rejected
- Paid

---

# 20. Audit Workflow

Every important operation should generate an audit entry.

Examples

- Login
- Logout
- Create Budget
- Edit Budget
- Archive Budget
- Create Expense
- Approve Request
- Reject Request

---

Audit entries should include:

- User
- Timestamp
- Action
- Entity
- Entity ID
- Previous Values
- New Values

---

# 21. Blockchain Verification Workflow

```
Approved Financial Record

↓

Generate Hash

↓

Submit Transaction

↓

Wait for Confirmation

↓

Store Transaction Metadata

↓

Verification Complete
```

---

Store:

- Transaction Hash
- Block Number
- Timestamp
- Network
- Smart Contract Address

---

# 22. Notifications

System-generated notifications include:

- Budget Created
- Budget Updated
- Budget Archived
- Approval Required
- Approval Completed
- Expense Submitted
- Expense Approved
- Blockchain Verification Completed

---

Notification Channels

- In-App
- Email (Future)

---

# 23. Business Validation Rules

Examples

## Budget Allocation

- Department required
- Fiscal year required
- Positive amount
- Unique allocation (per department and fiscal year, if applicable)

---

## Approval

- Only assigned approvers may approve.
- Comments required when rejecting.
- Completed requests cannot be modified.

---

## Expense

- Budget must be active.
- Remaining budget must be sufficient.
- Date cannot be outside the allowed reporting period (if enforced).

---

# 24. Module Relationships

```
Authentication
        │
        ▼
Dashboard
        │
        ▼
Budget Allocation
        │
        ▼
Budget Approval
        │
        ▼
Expense Monitoring
        │
        ▼
Reports
        │
        ▼
Audit Logs
        │
        ▼
Blockchain Verification
```

Modules interact through service-layer APIs and should avoid direct coupling wherever possible.

---

# 25. State Management Principles

Business state should have a single source of truth.

General lifecycle:

```
Create

↓

Read

↓

Update

↓

Archive

↓

Audit
```

Avoid duplicate state across unrelated components.

---

````markdown
---

# 26. Technical Architecture

This section defines the technical architecture of the application.

The project follows an **N-Tier Layered Architecture** to promote maintainability, scalability, and separation of concerns.

---

## Architectural Layers

```
Frontend

↓

API Routes

↓

Middleware

↓

Controllers

↓

Services

↓

Repositories

↓

Prisma ORM

↓

MySQL Database

↓

Blockchain Layer
```

---

## Layer Responsibilities

### Frontend

Responsible for:

- User Interface
- Form Validation
- API Requests
- Client-side State
- Routing

---

### Routes

Responsible for:

- Endpoint Registration
- Middleware Assignment
- Request Routing

Routes should never contain business logic.

---

### Middleware

Responsible for:

- Authentication
- Authorization
- Request Validation
- Logging
- Rate Limiting (Future)

---

### Controllers

Responsible for:

- Receiving requests
- Calling services
- Returning responses

Controllers should remain thin.

---

### Services

Responsible for:

- Business Rules
- Transactions
- Validation
- Workflow Execution

Most application logic belongs here.

---

### Repositories

Responsible for:

- Database Queries
- Prisma Operations
- Data Persistence

Repositories should not contain business rules.

---

### Prisma ORM

Responsible for:

- Type-safe database access
- Schema synchronization
- Migrations

---

### Database

Stores operational business data.

Blockchain is **not** the primary database.

---

### Blockchain

Responsible only for:

- Verification
- Integrity
- Immutable history

---

# 27. Frontend Architecture

The frontend follows a feature-first architecture.

```
src/

├── app/
├── components/
├── features/
├── hooks/
├── layouts/
├── lib/
├── pages/
├── routes/
├── services/
├── store/
├── styles/
├── types/
└── utils/
```

---

## Folder Responsibilities

### app/

Application bootstrap.

---

### components/

Reusable UI components.

---

### features/

Business modules.

Example

```
budget

approval

expense

reports
```

---

### hooks/

Reusable React hooks.

Examples

```
useAuth()

usePagination()

usePermissions()

useBudget()
```

---

### layouts/

Application layouts.

---

### services/

API communication layer.

---

### store/

Global state.

---

### types/

Shared TypeScript interfaces.

---

### utils/

Pure utility functions.

---

# 28. Backend Architecture

Recommended backend structure.

```
src/

controllers/

services/

repositories/

routes/

middleware/

validators/

types/

config/

utils/

prisma/
```

---

## Responsibilities

### controllers/

HTTP handling.

---

### services/

Business logic.

---

### repositories/

Database access.

---

### validators/

Request validation.

---

### middleware/

Authentication and authorization.

---

### config/

Environment configuration.

---

### utils/

Shared helper functions.

---

# 29. Database Architecture

The relational database stores all operational information.

---

## Core Entities

- User
- Role
- Permission
- Department
- Budget Allocation
- Budget Request
- Expense
- Approval
- Audit Log
- Blockchain Transaction

---

## Relationships

```
Department

↓

Budget Allocation

↓

Expense

↓

Approval

↓

Blockchain Verification
```

---

## Design Principles

- Normalize data
- Use foreign keys
- Avoid duplicated data
- Archive instead of deleting
- Timestamp all entities

---

# 30. Prisma Conventions

---

## Naming

Models

```
PascalCase
```

Fields

```
camelCase
```

---

## IDs

Use UUIDs where practical.

---

## Timestamps

Every major entity should include:

```
createdAt

updatedAt
```

Optional

```
deletedAt
```

---

## Relations

Always define both sides of a relationship.

---

## Migrations

Never edit production migrations.

Always create new migrations.

---

# 31. API Architecture

The application follows REST principles.

---

## Standard Response

```json
{
    "success": true,
    "message": "Budget created successfully.",
    "data": {}
}
```

---

## Error Response

```json
{
    "success": false,
    "message": "Validation failed.",
    "errors": []
}
```

---

## Endpoint Organization

```
/api/auth

/api/users

/api/departments

/api/budget

/api/approval

/api/expenses

/api/reports

/api/audit

/api/blockchain
```

---

# 32. Request Lifecycle

```
Client

↓

Route

↓

Middleware

↓

Validation

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Response
```

---

# 33. Authentication Flow

```
Login

↓

Validate Credentials

↓

Generate JWT

↓

Return Token

↓

Authenticated Requests

↓

Middleware Validation
```

---

## Authorization

Authorization should use:

- Roles
- Permissions
- Resource ownership (where applicable)

---

# 34. Blockchain Architecture

Blockchain acts as a verification layer.

---

## Verification Flow

```
Financial Record

↓

Generate Hash

↓

Submit Smart Contract Transaction

↓

Wait Confirmation

↓

Store Metadata
```

---

## Stored Metadata

- Transaction Hash
- Block Number
- Contract Address
- Network
- Timestamp

---

## Smart Contract Responsibilities

- Store hashes
- Verify hashes
- Emit events

Smart contracts should not contain business logic unrelated to verification.

---

# 35. Data Flow

Example

```
Budget Form

↓

Validation

↓

API

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Blockchain Verification (Optional)

↓

Response

↓

Frontend Refresh
```

---

# 36. Error Handling Strategy

Errors should be categorized.

---

## Validation Errors

```
400
```

---

## Authentication Errors

```
401
```

---

## Authorization Errors

```
403
```

---

## Not Found

```
404
```

---

## Server Errors

```
500
```

---

## Rules

Never expose:

- Stack traces
- SQL queries
- Secrets

---

# 37. Logging Strategy

Log:

- Login attempts
- Financial operations
- Approval actions
- Blockchain transactions
- System errors

---

Never log:

- Passwords
- JWT secrets
- Sensitive personal information

---

# 38. State Management

Client state should use:

- TanStack Query
- Zustand (global UI state)

---

Avoid:

- Duplicate state
- Unnecessary global state

---

# 39. Caching Strategy

Cache:

- Dashboard summaries
- Reports
- Lookup tables
- Department lists

Avoid caching:

- Sensitive user information
- Permission checks
- Authentication state

---

# 40. Security Architecture

Security is layered.

```
Authentication

↓

Authorization

↓

Validation

↓

Business Rules

↓

Database Constraints

↓

Blockchain Verification
```

---

## Principles

- Validate every request.
- Never trust client input.
- Use parameterized queries.
- Sanitize user input.
- Verify permissions in the service layer.

---

# 41. Performance Considerations

- Paginate large datasets.
- Lazy load heavy pages.
- Optimize database indexes.
- Use server-side filtering.
- Minimize unnecessary re-renders.
- Batch API requests when practical.

---

# 42. Development Guidelines

Developers should:

- Follow the layered architecture.
- Keep controllers thin.
- Place business logic in services.
- Reuse components before creating new ones.
- Update documentation alongside significant code changes.

---

````markdown
---

# 43. Development Standards

This section defines the engineering standards that every contributor must follow.

The objective is to ensure:

- Consistent code quality
- Predictable architecture
- Easier maintenance
- Faster onboarding
- Reliable AI-assisted development

---

# 44. Coding Standards

## General Principles

Follow these principles in every module.

- Write readable code.
- Prefer clarity over cleverness.
- Keep functions small and focused.
- Avoid unnecessary abstractions.
- Follow the Single Responsibility Principle.

---

## Naming Conventions

### Variables

Use camelCase.

```ts
const totalBudget = 500000;
const remainingBalance = 120000;
```

---

### Constants

Use UPPER_SNAKE_CASE.

```ts
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
```

---

### Functions

Use camelCase with descriptive verbs.

```ts
createBudgetAllocation()

approveBudgetRequest()

calculateRemainingBudget()

verifyBlockchainTransaction()
```

---

### Components

Use PascalCase.

```tsx
BudgetCard

ApprovalTimeline

ExpenseTable
```

---

### Interfaces

Prefix with `I` only if required by team convention. Otherwise prefer descriptive names.

```ts
interface BudgetAllocation {}

interface ExpenseSummary {}
```

---

### Enums

Use PascalCase.

```ts
enum ApprovalStatus {}
```

---

# 45. TypeScript Standards

## Avoid

```ts
any
```

Use explicit types whenever possible.

---

## Prefer

```ts
unknown
```

instead of `any` when the type is not yet known.

---

## Shared Types

Shared interfaces belong in

```
src/types/
```

Avoid duplicating interfaces across features.

---

## Null Safety

Prefer

```ts
undefined
```

over unnecessary `null` values unless the database requires `null`.

---

# 46. React Standards

## Functional Components Only

Use function components.

Avoid class components.

---

## Hooks

Use hooks for reusable logic.

Examples

```
useAuth()

usePermissions()

usePagination()

useBudget()

useExpense()
```

---

## Component Size

Recommended maximum

```
200–300 lines
```

If a component grows significantly larger, consider extracting smaller child components or custom hooks.

---

## Component Composition

Prefer

```
<Card>

<CardHeader />

<CardContent />

<CardFooter />

</Card>
```

instead of creating monolithic components.

---

# 47. Backend Standards

Controllers should:

- Validate requests
- Call services
- Return responses

Controllers should **not**

- Query the database directly
- Contain business logic
- Perform complex calculations

---

Services should

- Execute business rules
- Coordinate workflows
- Manage transactions
- Call repositories

---

Repositories should

- Execute Prisma queries
- Map persistence operations
- Hide database implementation details

Repositories should not contain business rules.

---

# 48. Folder Organization

Each feature should follow a consistent structure.

```
feature/

components/

hooks/

services/

types/

validators/

utils/
```

Avoid placing unrelated files together.

---

# 49. Import Standards

Import order

1. React
2. Third-party libraries
3. Internal aliases
4. Relative imports
5. Styles

Example

```ts
import React from "react";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import "./styles.css";
```

---

# 50. Error Handling Standards

Do not silently ignore errors.

Always

- log errors where appropriate
- return meaningful messages
- avoid exposing internal implementation details

---

Example

Good

```
Unable to create budget allocation.
```

Bad

```
Unhandled exception.
```

---

# 51. Logging Standards

Log

- Authentication events
- Financial operations
- Approval actions
- Blockchain operations
- Unexpected exceptions

Do not log

- Passwords
- Access tokens
- Secrets
- Personally sensitive information

---

# 52. Git Workflow

Recommended branching strategy

```
main

develop

feature/*

bugfix/*

hotfix/*
```

---

Feature Example

```
feature/budget-approval

feature/expense-monitoring

feature/blockchain-verification
```

---

Bug Fix Example

```
bugfix/approval-validation

bugfix/dashboard-loading
```

---

# 53. Commit Message Convention

Use conventional commits.

Examples

```
feat: add approval workflow

fix: resolve expense validation

docs: update component library

refactor: simplify budget service

test: add approval service tests

chore: update dependencies
```

---

# 54. Pull Request Guidelines

Every pull request should include

- Summary
- Motivation
- Screenshots (if UI changes)
- Testing performed
- Related issue or task

---

Checklist

- Code builds successfully
- Tests pass
- Lint passes
- Documentation updated
- No duplicated components

---

# 55. Code Review Checklist

Reviewers should verify

Architecture

- Layered architecture maintained
- No business logic in controllers
- Repositories only access persistence

Code Quality

- Readable names
- Small functions
- Reusable components

Performance

- No unnecessary rendering
- Efficient database queries

Security

- Permission checks
- Validation
- Sanitization

Documentation

- Public APIs documented
- New components documented
- Major changes reflected in project docs

---

# 56. Testing Strategy

Testing pyramid

```
Unit Tests

↓

Integration Tests

↓

End-to-End Tests
```

---

## Unit Tests

Focus

- Services
- Utilities
- Validation
- Hooks

---

## Integration Tests

Focus

- API endpoints
- Database interactions
- Authentication

---

## End-to-End Tests

Focus

- Login
- Budget Allocation
- Approval Workflow
- Expense Monitoring
- Report Generation

---

# 57. Environment Management

Configuration belongs in environment variables.

Examples

```
DATABASE_URL

JWT_SECRET

PORT

BLOCKCHAIN_RPC_URL

PRIVATE_KEY

CONTRACT_ADDRESS
```

Never hardcode secrets.

---

# 58. Configuration Standards

Centralize configuration.

Example

```
config/

database.ts

auth.ts

blockchain.ts

app.ts
```

Avoid scattering configuration values throughout the codebase.

---

# 59. Documentation Standards

Every major feature should include

- Purpose
- Architecture
- API changes
- Database changes
- Component updates
- Testing notes

Documentation should be updated alongside implementation.

---

# 60. Dependency Management

Before introducing a new dependency

Ask

- Does an existing dependency already solve this?
- Is it actively maintained?
- Is it compatible with the current stack?
- Is it necessary?

Avoid unnecessary libraries.

---

# 61. Security Guidelines

Developers must

- Validate all inputs
- Authorize all protected actions
- Escape user-generated output when required
- Protect secrets
- Use HTTPS in production
- Rotate credentials when necessary

---

# 62. Performance Guidelines

Frontend

- Lazy load routes
- Memoize expensive computations
- Virtualize large tables
- Avoid unnecessary state

Backend

- Paginate results
- Optimize indexes
- Minimize N+1 queries
- Batch related operations

---

# 63. Documentation Maintenance

The following documents should remain synchronized with implementation:

- README.md
- PROJECT_KNOWLEDGE.md
- API.md
- DATABASE.md
- DESIGN_SYSTEM.md
- COMPONENT_LIBRARY.md
- AUTHORIZATION.md
- BLOCKCHAIN.md
- Phase documentation

---

# 64. Engineering Principles

The team should consistently apply the following principles:

- Separation of Concerns
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- SOLID Principles
- Composition over Inheritance
- Convention over Configuration
- Documentation First
- Security by Default
- Accessibility by Default

---

````markdown
---

# 65. AI-Assisted Development Guidelines

This project is designed to support AI-assisted software development.

AI tools (Claude Code, Codex, GitHub Copilot, Cursor, Gemini CLI, etc.) should be treated as engineering assistants rather than autonomous decision-makers.

Every AI-generated change must be reviewed before being merged.

---

## Primary Objectives

AI should help developers:

- Understand the existing codebase
- Reduce repetitive coding
- Improve documentation
- Detect bugs
- Generate tests
- Suggest refactoring
- Improve maintainability

AI should never replace architectural reasoning.

---

# 66. AI Workflow

Before implementing any feature, AI should follow this sequence.

```
Analyze Codebase

↓

Understand Existing Architecture

↓

Locate Related Components

↓

Reuse Existing Logic

↓

Implement Changes

↓

Update Documentation

↓

Suggest Tests
```

Never skip the analysis phase.

---

# 67. AI Development Rules

## Rule 1

Always analyze the existing implementation before generating code.

---

## Rule 2

Reuse existing components whenever possible.

Avoid creating duplicate components.

---

## Rule 3

Never bypass the layered architecture.

Correct flow:

```
Route

↓

Controller

↓

Service

↓

Repository

↓

Database
```

---

## Rule 4

Business logic belongs inside Services.

---

## Rule 5

Database queries belong inside Repositories.

---

## Rule 6

Controllers should remain thin.

---

## Rule 7

Never modify unrelated modules.

---

## Rule 8

Preserve backwards compatibility whenever practical.

---

## Rule 9

Prefer extending existing features over replacing them.

---

## Rule 10

Update documentation whenever architecture, APIs, or reusable components change.

---

# 68. AI Prompting Standards

When requesting implementation from an AI assistant, include:

- Feature description
- Current architecture
- Relevant modules
- Constraints
- Expected outcome

Good prompt example:

```
Analyze the existing Budget Approval module.

Identify reusable services and components.

Implement the requested feature without violating the N-Tier architecture.

Reuse existing validation and repository patterns.

Update documentation if reusable components or APIs change.
```

Avoid prompts that only say:

```
Create this feature.
```

---

# 69. Refactoring Guidelines

Refactoring should improve maintainability without changing behavior.

Acceptable refactoring:

- Smaller components
- Smaller services
- Improved naming
- Better type safety
- Reduced duplication

Avoid:

- Unnecessary rewrites
- Large architectural changes during feature work
- Mixing refactoring with unrelated feature development

---

# 70. Architectural Decision Records (ADRs)

Significant technical decisions should be documented.

Recommended format:

```
docs/adr/

ADR-001-layered-architecture.md

ADR-002-blockchain-verification.md

ADR-003-authentication.md
```

Each ADR should include:

- Context
- Decision
- Alternatives
- Consequences

---

# 71. Known Architectural Decisions

Current project decisions include:

- N-Tier Layered Architecture
- React + TypeScript frontend
- Express + TypeScript backend
- Prisma ORM
- MySQL as the operational database
- Blockchain used only for verification
- RESTful APIs
- Role-Based Access Control
- Feature-first frontend organization
- Component-driven UI

Future changes should respect these decisions unless intentionally superseded by a documented ADR.

---

# 72. Technical Debt Register

Known technical debt should be tracked rather than ignored.

Suggested categories:

- Performance
- Security
- Code Quality
- Documentation
- UI Consistency
- Testing

Example:

| ID | Area | Description | Priority |
|----|------|-------------|----------|
| TD-001 | UI | Replace duplicated table layouts with shared DataTable | Medium |
| TD-002 | Backend | Optimize report queries for large datasets | High |

---

# 73. Common Pitfalls

Avoid the following:

- Business logic inside controllers
- Direct database queries from controllers
- Duplicated UI components
- Hardcoded permissions
- Hardcoded colors instead of design tokens
- Inconsistent validation rules
- Ignoring loading or error states
- Creating APIs without updating documentation

---

## 74. Project Roadmap

The project follows a structured implementation roadmap consisting of major phases and subphases. Each phase builds upon the previous one to ensure a stable, maintainable, and scalable system.

---

### Phase 1 — Project Foundation

**Deliverables**

* Project initialization
* Development environment setup
* Repository configuration
* Coding standards
* Documentation foundation

---

### Phase 2 — Authentication & Authorization

**Deliverables**

* User authentication
* JWT implementation
* Role-Based Access Control (RBAC)
* Session management
* Route protection

---

### Phase 3 — Core System Foundation

**Deliverables**

* Dashboard
* User management
* Role and permission management
* Department management
* Core application layout
* Shared components

---

### Phase 4 — Budget Management

The Budget Management module is implemented through seven incremental subphases.

#### Phase 4.1 — Master Data Management

**Deliverables**

* Department Management
* Budget Category Management
* Fiscal Year Management
* Funding Source Management
* Budget Type Management

---

#### Phase 4.2 — Core Budget Allocation Management

**Deliverables**

* Budget Allocation CRUD
* Allocation Dashboard
* Budget Allocation Details
* Budget Allocation History
* Budget Utilization
* Allocation Search & Filtering
* Archive & Restore

---

#### Phase 4.3 — Budget Approval Workflow

**Deliverables**

* Approval Queue
* Approval Details
* Multi-level Approval Workflow
* Approval Timeline
* Approval History
* Approval Comments
* Notifications
* Bulk Approval Actions

---

#### Phase 4.4 — Blockchain Integration

**Deliverables**

* Smart Contract Integration
* Budget Allocation Verification
* Blockchain Transaction Recording
* Verification Dashboard
* Transaction History
* Blockchain Status Monitoring

---

#### Phase 4.5 — Document Management

**Deliverables**

* Document Upload
* Attachment Management
* File Preview
* Version History
* Document Download
* Supporting Documents

---

#### Phase 4.6 — Audit Trail & Status Logs

**Deliverables**

* Audit Logging
* Entity History
* Status Change History
* User Activity Logs
* Blockchain Verification History
* Financial Activity Timeline

---

#### Phase 4.7 — Reports & Analytics

**Deliverables**

* Budget Reports
* Allocation Reports
* Approval Reports
* Financial Analytics
* Dashboard Analytics
* Export (PDF, Excel, CSV)

---

### Phase 5 — Expense Monitoring

**Deliverables**

* Expense Recording
* Expense Approval
* Expense Tracking
* Budget Utilization Monitoring
* Expense Attachments

---

### Phase 6 — Blockchain Enhancement

**Deliverables**

* Advanced Verification
* Blockchain Monitoring
* Smart Contract Enhancements
* Integrity Validation
* Transaction Analytics

---

### Phase 7 — Reports & Business Intelligence

**Deliverables**

* Executive Dashboard
* Financial Reports
* Comparative Analysis
* Data Visualization
* Report Scheduling

---

### Phase 8 — Audit & Compliance

**Deliverables**

* Advanced Audit Logs
* Compliance Reports
* Financial Traceability
* Verification Reports

---

### Phase 9 — System Administration

**Deliverables**

* System Configuration
* Backup & Restore
* User Administration
* Security Configuration
* Maintenance Tools

---

### Phase 10 — Testing & Quality Assurance

**Deliverables**

* Unit Testing
* Integration Testing
* End-to-End Testing
* Performance Testing
* Security Testing
* Bug Fixing

---

### Phase 11 — Deployment & Production Readiness

**Deliverables**

* Production Deployment
* Environment Configuration
* Monitoring
* Logging
* Performance Optimization
* Security Hardening

---

### Phase 12 — Documentation & Project Completion

**Deliverables**

* Final Documentation
* User Manual
* Technical Documentation
* Deployment Guide
* Maintenance Guide
* Project Turnover

---

## Progress Tracking

Update this section as development progresses.

| Phase     | Status                                      |
| --------- | ------------------------------------------- |
| Phase 1   | ☑ Completed                                 |
| Phase 2   | ☑ Completed                                 |
| Phase 3   | ☑ Completed                                 |
| Phase 4.1 | ☑ Completed                                 |
| Phase 4.2 | ☑ Completed                                 |
| Phase 4.3 | ☑ Completed                                 |
| Phase 4.4 | ☑ Completed                                 |
| Phase 4.5 | ☐ Not Started / ◐ In Progress / ☑ Completed |
| Phase 4.6 | ☐ Not Started / ◐ In Progress / ☑ Completed |
| Phase 4.7 | ☐ Not Started / ◐ In Progress / ☑ Completed |
| Phase 5   | ☐ Not Started / ◐ In Progress / ☑ Completed |
| Phase 6   | ☐ Not Started / ◐ In Progress / ☑ Completed |
| Phase 7   | ☐ Not Started / ◐ In Progress / ☑ Completed |
| Phase 8   | ☐ Not Started / ◐ In Progress / ☑ Completed |
| Phase 9   | ☐ Not Started / ◐ In Progress / ☑ Completed |
| Phase 10  | ☐ Not Started / ◐ In Progress / ☑ Completed |
| Phase 11  | ☐ Not Started / ◐ In Progress / ☑ Completed |
| Phase 12  | ☐ Not Started / ◐ In Progress / ☑ Completed |

The roadmap should be updated whenever a phase or subphase is completed to ensure the documentation accurately reflects the current implementation status.


# 75. AI Context Checklist

Before generating code, confirm:

- Existing implementation reviewed
- Related modules identified
- Existing components reused
- Business rules understood
- Permissions considered
- Validation requirements identified
- Database impact reviewed
- API impact reviewed
- Documentation impact reviewed

If any answer is "No", perform that analysis before writing code.

---

# 76. Developer Onboarding Checklist

New contributors should:

- Read README.md
- Read PROJECT_KNOWLEDGE.md
- Read DESIGN_SYSTEM.md
- Read COMPONENT_LIBRARY.md
- Understand folder structure
- Set up the development environment
- Run the application locally
- Review current implementation
- Understand the active development phase

---

# 77. Before You Code Checklist

Before writing code:

- Understand the feature request.
- Identify affected modules.
- Search for reusable components.
- Review existing services.
- Review related API endpoints.
- Confirm business rules.
- Consider security implications.
- Consider accessibility requirements.

---

# 78. Before You Merge Checklist

Before merging changes:

- Application builds successfully
- Lint passes
- Tests pass
- No TypeScript errors
- Documentation updated
- New reusable components documented
- APIs documented
- Responsive layout verified
- Accessibility reviewed
- Security reviewed
- No duplicated functionality introduced

---

# 79. Success Criteria

The project is considered technically successful when:

- The architecture remains modular.
- Business logic is centralized.
- Documentation matches implementation.
- Components are reusable.
- APIs are consistent.
- Security best practices are followed.
- Financial records are traceable.
- Blockchain verification is reliable.
- The system is maintainable by future developers.

---

# 80. Conclusion

The purpose of this document is to provide a shared understanding of the project for both developers and AI assistants.

Every implementation should align with:

- Business requirements
- Technical architecture
- Engineering standards
- Design system
- Component library
- Security principles
- Long-term maintainability

When uncertainty exists, prefer consistency with the documented architecture over introducing new patterns.

Future contributors should treat this document as the primary reference for understanding how the system is intended to evolve.

---

# Document References

This document should be maintained alongside:

- README.md
- API.md
- DATABASE.md
- AUTHORIZATION.md
- BLOCKCHAIN.md
- DESIGN_SYSTEM.md
- COMPONENT_LIBRARY.md
- UI_SPECIFICATIONS.md
- TESTING_GUIDE.md
- Phase documentation

Together, these documents form the official knowledge base for the Blockchain-Based Budget Allocation and Expense Monitoring System.
````
