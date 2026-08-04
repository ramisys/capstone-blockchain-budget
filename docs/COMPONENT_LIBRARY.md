````markdown
# Component Library

> **Project:** Blockchain-Based Budget Allocation and Expense Monitoring System
>
> **Version:** 1.0.0
>
> **Last Updated:** August 2026

---

# Table of Contents

- [1. Introduction](#1-introduction)
- [2. Component Philosophy](#2-component-philosophy)
- [3. Directory Structure](#3-directory-structure)
- [4. Naming Conventions](#4-naming-conventions)
- [5. Component Standards](#5-component-standards)
- [6. Layout Components](#6-layout-components)
- [7. Navigation Components](#7-navigation-components)

---

# 1. Introduction

## Purpose

The Component Library documents every reusable frontend component used throughout the application.

It serves as the single source of truth for developers to ensure:

- Consistent UI
- Reusable components
- Predictable behavior
- Faster development
- Easier maintenance

Every new component should be added to this document before widespread use.

---

## Goals

This library aims to:

- Minimize duplicated code
- Standardize component APIs
- Improve accessibility
- Encourage composition over duplication
- Simplify onboarding for new developers

---

# 2. Component Philosophy

The frontend follows these guiding principles.

---

## Reusable

A component should be reusable in multiple pages without modification.

✅ Good

```
<DataTable />
```

❌ Bad

```
<BudgetAllocationTableOnly />
```

unless the component contains business-specific behavior.

---

## Composable

Prefer building small components that can be combined.

Example

```
<Card>

    <CardHeader />

    <CardContent />

    <CardFooter />

</Card>
```

---

## Predictable

Every component should behave consistently.

Buttons should always:

- hover the same way
- focus the same way
- disable the same way

---

## Accessible

Every interactive component must support:

- keyboard navigation
- screen readers
- visible focus
- semantic HTML

---

## Type Safe

All components must use TypeScript interfaces.

Example

```tsx
interface ButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
}
```

---

# 3. Directory Structure

Recommended structure

```text
src/

components/

    layout/

    navigation/

    ui/

    forms/

    data-display/

    feedback/

    dashboard/

    budget/

    approval/

    expense/

    blockchain/

    reports/

    audit/

    shared/
```

---

## Folder Responsibilities

| Folder | Purpose |
|---------|----------|
| layout | Page layouts |
| navigation | Sidebar, navbar, breadcrumbs |
| ui | Generic reusable UI |
| forms | Form controls |
| data-display | Tables, cards, charts |
| feedback | Alerts, toast, loading |
| dashboard | Dashboard widgets |
| budget | Budget management |
| approval | Approval workflow |
| expense | Expense monitoring |
| blockchain | Blockchain-related UI |
| reports | Reports |
| audit | Audit logs |
| shared | Common utilities |

---

# 4. Naming Conventions

## Component Names

Use PascalCase.

Examples

```
BudgetCard

ApprovalTimeline

ExpenseTable

Sidebar

DashboardStats
```

---

## File Names

Use kebab-case.

```
budget-card.tsx

approval-dialog.tsx

expense-table.tsx
```

---

## Props

Use camelCase.

```
isLoading

currentPage

totalAmount
```

---

## Event Handlers

Prefix with

```
on
```

Examples

```
onClick

onSubmit

onApprove

onReject
```

---

# 5. Component Standards

Every component should include:

- Props Interface
- Documentation
- Accessibility
- Loading State
- Error Handling (when applicable)
- Unit Tests (future)

---

## Standard Documentation Template

Every component in this library follows:

```
Purpose

Location

Props

Variants

States

Accessibility

Usage

Notes
```

---

# 6. Layout Components

Layout components define the application's overall structure.

---

# AppLayout

## Purpose

Provides the primary application shell.

Responsible for:

- Sidebar
- Top Navigation
- Main Content
- Responsive Layout

---

## Location

```
components/layout/app-layout.tsx
```

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | ReactNode | ✅ | Page content |

---

## Structure

```
<AppLayout>

    <Sidebar />

    <TopNavigation />

    <MainContent />

</AppLayout>
```

---

## States

- Desktop
- Tablet
- Mobile

---

## Accessibility

- Landmark elements
- Keyboard navigation
- Skip-to-content support

---

## Notes

Only one AppLayout should exist.

---

# PageContainer

## Purpose

Provides consistent spacing and width for all pages.

---

## Location

```
components/layout/page-container.tsx
```

---

## Props

| Prop | Type |
|------|------|
| children | ReactNode |

---

## Responsibilities

- Horizontal padding
- Vertical spacing
- Maximum width
- Responsive behavior

---

# PageHeader

## Purpose

Displays page title and actions.

---

Contains

- Title
- Description
- Action Buttons

---

Example

```
Budget Allocation

Manage department budgets.

[ Create Allocation ]
```

---

## Props

| Prop | Type |
|------|------|
| title | string |
| description | string |
| actions | ReactNode |

---

# Section

## Purpose

Groups related content.

---

Used for

- Dashboard sections
- Reports
- Forms
- Tables

---

# Card

## Purpose

Container for grouped information.

---

Variants

- Default
- Elevated
- Outlined
- Interactive

---

Props

| Prop | Type |
|------|------|
| title | string |
| children | ReactNode |

---

Children

```
CardHeader

CardContent

CardFooter
```

---

Accessibility

Use semantic HTML.

---

# CardHeader

Displays

- Title
- Subtitle
- Actions

---

# CardContent

Contains

Main content.

---

# CardFooter

Contains

Actions

Summary

Links

---

# Divider

## Purpose

Separates related content.

---

Variants

Horizontal

Vertical

---

# Spacer

## Purpose

Creates consistent spacing.

---

Props

```
size
```

Values

```
xs

sm

md

lg

xl
```

---

# Container

## Purpose

Limits content width.

---

Sizes

```
sm

md

lg

xl

full
```

---

# Stack

## Purpose

Vertical arrangement of components.

---

Props

```
spacing

align

justify
```

---

# Grid

## Purpose

Responsive layout system.

---

Props

```
columns

gap

responsive
```

---

# 7. Navigation Components

---

# Sidebar

## Purpose

Primary application navigation.

---

Location

```
components/navigation/sidebar.tsx
```

---

Contents

Dashboard

Budget Allocation

Budget Approval

Expense Monitoring

Audit Logs

Reports

Users

Settings

---

Props

| Prop | Type |
|------|------|
| collapsed | boolean |

---

States

Expanded

Collapsed

Mobile Drawer

---

Accessibility

- Keyboard support
- Focus trapping on mobile
- Active item indication

---

# SidebarItem

Represents one navigation link.

---

Props

| Prop | Type |
|------|------|
| icon | LucideIcon |
| label | string |
| href | string |
| active | boolean |

---

# TopNavigation

Purpose

Displays:

- Search
- Notifications
- User Menu

---

Children

```
SearchBar

NotificationBell

UserMenu
```

---

# Breadcrumb

Purpose

Displays navigation hierarchy.

---

Example

```
Dashboard

>

Budget Allocation

>

Create
```

---

Props

```
items
```

---

# NavigationTabs

Purpose

Switches between related content.

---

Examples

Overview

History

Transactions

Approvals

---

# PaginationNavigation

Purpose

Controls page navigation.

---

Contains

Previous

Next

Page Numbers

Page Size

---

# UserMenu

Purpose

Displays authenticated user actions.

---

Contains

Profile

Settings

Logout

---

# NotificationBell

Purpose

Displays unread notifications.

---

Features

Unread Count

Recent Notifications

Mark All Read

---

# SearchBar

Purpose

Provides application-wide search.

---

Supports

- Instant search
- Keyboard shortcuts
- Clear button
- Search icon

---

Accessibility

- ARIA labels
- Keyboard navigation
- Focus management

---

# CommandPalette *(Future)*

Purpose

Keyboard-first navigation.

---

Shortcut

```
Ctrl + K
```

---

Capabilities

Search Pages

Search Users

Search Budgets

Search Reports

Execute Actions

---

# Summary

The following layout and navigation components are defined in this section:

- AppLayout
- PageContainer
- PageHeader
- Section
- Card
- CardHeader
- CardContent
- CardFooter
- Divider
- Spacer
- Container
- Stack
- Grid
- Sidebar
- SidebarItem
- TopNavigation
- Breadcrumb
- NavigationTabs
- PaginationNavigation
- UserMenu
- NotificationBell
- SearchBar
- CommandPalette (Future)

These components establish the structural foundation of the application's frontend and should be reused across all pages to maintain consistency.
````
````markdown
---

# 8. Form Components

Form components are responsible for collecting, validating, and submitting user input.

All form components should integrate with:

- React Hook Form
- Zod Validation
- shadcn/ui
- Tailwind CSS

Every form component should support:

- Disabled State
- Read-only State
- Validation
- Keyboard Navigation
- Accessible Labels
- Error Messages

---

# Button

## Purpose

Triggers an action.

---

## Location

```
components/ui/button.tsx
```

---

## Variants

- Primary
- Secondary
- Outline
- Ghost
- Destructive
- Success
- Link

---

## Sizes

- Small
- Medium
- Large
- Icon

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| variant | ButtonVariant | ❌ | Button style |
| size | ButtonSize | ❌ | Button size |
| disabled | boolean | ❌ | Disable interaction |
| loading | boolean | ❌ | Show loading spinner |
| leftIcon | ReactNode | ❌ | Icon before text |
| rightIcon | ReactNode | ❌ | Icon after text |
| onClick | () => void | ❌ | Click handler |

---

## States

- Default
- Hover
- Active
- Focus
- Disabled
- Loading

---

## Accessibility

- Keyboard accessible
- Visible focus ring
- Disabled buttons are not focusable

---

## Example

```tsx
<Button variant="default">
    Save Changes
</Button>
```

---

# IconButton

## Purpose

Compact button displaying only an icon.

---

## Use Cases

- Edit
- Delete
- Refresh
- Settings
- More Actions

---

## Required

Every IconButton must include:

```
aria-label
```

---

## Example

```tsx
<IconButton
    icon={<Trash2 />}
    aria-label="Delete budget"
/>
```

---

# TextInput

## Purpose

Collects single-line text input.

---

## Location

```
components/forms/text-input.tsx
```

---

## Props

| Prop | Type |
|------|------|
| label | string |
| placeholder | string |
| disabled | boolean |
| required | boolean |
| error | string |

---

## States

- Default
- Focus
- Error
- Disabled
- Read-only

---

## Accessibility

- Associated label
- Error announcement
- Keyboard support

---

# CurrencyInput

## Purpose

Captures monetary values.

---

## Features

- Peso symbol (₱)
- Thousand separators
- Decimal support
- Numeric validation

---

## Example

```
₱ 250,000.00
```

---

## Validation

- Positive values only
- Maximum amount configurable

---

# NumberInput

## Purpose

Accepts numeric values.

---

Supports

- Integer
- Decimal
- Increment buttons (optional)

---

# PasswordInput

## Purpose

Secure password entry.

---

Features

- Show/Hide Password
- Strength Indicator (optional)

---

# TextArea

## Purpose

Multi-line text input.

---

Use Cases

- Remarks
- Justification
- Description
- Notes

---

## Props

| Prop | Type |
|------|------|
| rows | number |
| maxLength | number |

---

# SearchInput

## Purpose

Reusable search field.

---

Features

- Search icon
- Clear button
- Debounced search
- Keyboard shortcut support

---

# Select

## Purpose

Dropdown selection.

---

Features

- Searchable
- Keyboard navigation
- Disabled options
- Placeholder
- Clear selection

---

## Example

```
Department

▼ Finance
```

---

# Combobox

## Purpose

Searchable dropdown with autocomplete.

---

Use Cases

- Department
- Employee
- Supplier
- User

---

# MultiSelect

## Purpose

Allows selecting multiple values.

---

Features

- Chips
- Search
- Remove selected item
- Select all

---

# DatePicker

## Purpose

Selects calendar dates.

---

Supports

- Single date
- Date range
- Fiscal year

---

## Example

```
July 15, 2026
```

---

# DateRangePicker

## Purpose

Selects a range of dates.

---

Use Cases

- Reports
- Transactions
- Audit Logs

---

# Checkbox

## Purpose

Binary selection.

---

Use Cases

- Accept terms
- Permissions
- Bulk actions

---

# CheckboxGroup

## Purpose

Multiple related checkboxes.

---

Example

Permissions

☑ View

☐ Create

☑ Edit

☐ Delete

---

# RadioGroup

## Purpose

Single selection from multiple options.

---

Example

Budget Type

○ Operational

● Capital

---

# Switch

## Purpose

Toggle true/false values.

---

Examples

- Active
- Enabled
- Public

---

# Slider *(Optional)*

## Purpose

Numeric selection within a range.

---

Use Cases

- Budget thresholds
- Percentage allocation

---

# FileUpload

## Purpose

Uploads supporting documents.

---

Supported Files

- PDF
- DOCX
- XLSX
- PNG
- JPG

---

Maximum Size

```
10 MB
```

---

Features

- Drag and Drop
- Upload Progress
- Remove File
- Preview

---

# AvatarUpload

## Purpose

Profile picture upload.

---

Features

- Crop
- Preview
- Remove

---

# FormField

## Purpose

Wraps a single form control.

---

Contains

- Label
- Input
- Helper Text
- Error Message

---

Structure

```
Label

Input

Helper

Error
```

---

# FormSection

## Purpose

Groups related fields.

---

Example

Personal Information

Budget Details

Approval Information

---

# FormGrid

## Purpose

Responsive form layout.

---

Desktop

```
2 Columns
```

Tablet

```
2 Columns
```

Mobile

```
1 Column
```

---

# FormActions

## Purpose

Displays action buttons.

---

Standard Layout

```
Cancel

Save
```

or

```
Back

Next
```

---

# HelperText

## Purpose

Provides additional guidance.

---

Example

```
Maximum allocation is ₱1,000,000.
```

---

# ErrorMessage

## Purpose

Displays validation feedback.

---

Rules

- Clear
- Concise
- Actionable

---

Example

```
Budget amount is required.
```

---

# ValidationSummary

## Purpose

Displays all form errors.

Useful for large forms.

---

# SearchFilters

## Purpose

Reusable filter panel.

---

Contains

- Search
- Department
- Status
- Date
- Reset Button

---

# FilterChip

## Purpose

Displays an active filter.

---

Example

```
Status: Approved ✕

Department: Finance ✕
```

---

# EmptyFormState

## Purpose

Displayed when no editable data exists.

---

Example

"No information available."

---

# LoadingForm

## Purpose

Skeleton placeholder while form loads.

---

Contains

- Skeleton labels
- Skeleton inputs
- Skeleton buttons

---

# Form Accessibility Standards

Every form must:

- Use semantic labels
- Associate labels with inputs
- Display visible focus
- Support keyboard navigation
- Announce validation errors
- Use descriptive helper text

---

# Summary

The following form components are defined in this section:

- Button
- IconButton
- TextInput
- CurrencyInput
- NumberInput
- PasswordInput
- TextArea
- SearchInput
- Select
- Combobox
- MultiSelect
- DatePicker
- DateRangePicker
- Checkbox
- CheckboxGroup
- RadioGroup
- Switch
- Slider (Optional)
- FileUpload
- AvatarUpload
- FormField
- FormSection
- FormGrid
- FormActions
- HelperText
- ErrorMessage
- ValidationSummary
- SearchFilters
- FilterChip
- EmptyFormState
- LoadingForm
````
````markdown
---

# 9. Data Display Components

Data display components present information in a clear, consistent, and accessible manner.

These components are used throughout:

- Dashboard
- Budget Allocation
- Budget Approval
- Expense Monitoring
- Reports
- Audit Logs
- User Management

---

# DataTable

## Purpose

Displays structured data with enterprise-level features.

---

## Location

```
components/data-display/data-table.tsx
```

---

## Built With

- TanStack Table
- shadcn/ui Table
- React Query
- Tailwind CSS

---

## Features

- Pagination
- Sorting
- Global Search
- Column Filters
- Column Visibility
- Row Selection
- Bulk Actions
- Sticky Header
- Responsive Layout
- Loading State
- Empty State

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| columns | ColumnDef[] | ✅ | Table columns |
| data | T[] | ✅ | Data source |
| loading | boolean | ❌ | Loading indicator |
| pagination | boolean | ❌ | Enable pagination |
| searchable | boolean | ❌ | Enable search |
| selectable | boolean | ❌ | Enable row selection |

---

## States

- Loading
- Empty
- Error
- Populated

---

## Accessibility

- Keyboard navigation
- Screen reader compatible
- Sort announcements
- Focus management

---

## Example

```tsx
<DataTable
    columns={columns}
    data={budgets}
/>
```

---

# TableToolbar

## Purpose

Displays actions above a DataTable.

---

Contains

- Search
- Filters
- Export
- Refresh
- Bulk Actions

---

# TablePagination

## Purpose

Controls page navigation.

---

Features

- Page Size
- Previous
- Next
- Jump to Page

---

# TableEmptyState

## Purpose

Displayed when no rows exist.

---

Contains

- Illustration
- Title
- Description
- Primary Action

---

# TableLoading

## Purpose

Displays skeleton rows.

---

Avoid full-page spinners.

---

# StatisticCard

## Purpose

Displays KPI values.

---

Examples

- Total Budget
- Total Expenses
- Remaining Budget
- Pending Approvals

---

Props

| Prop | Type |
|------|------|
| title | string |
| value | string |
| icon | ReactNode |
| trend | number |
| description | string |

---

Example

```
Total Budget

₱12,450,000

↑ 8%
```

---

# DashboardCard

## Purpose

Generic dashboard widget.

---

Contains

Header

Body

Footer

---

# BudgetCard

## Purpose

Displays budget allocation information.

---

Contains

- Department
- Budget Category
- Allocated Amount
- Remaining Budget
- Status
- Last Updated

---

Actions

View

Edit

Archive

---

# ExpenseCard

## Purpose

Displays expense information.

---

Contains

- Expense Name
- Amount
- Department
- Category
- Date
- Status

---

# ApprovalCard

## Purpose

Displays approval request details.

---

Contains

- Requester
- Department
- Requested Amount
- Current Status
- Priority
- Date Submitted

---

Actions

Approve

Reject

View Details

---

# ReportCard

## Purpose

Displays report summary.

---

Contains

- Report Name
- Generated Date
- Report Type
- Download Button

---

# UserCard

## Purpose

Displays user information.

---

Contains

- Avatar
- Name
- Role
- Department
- Status

---

# Badge

## Purpose

Displays concise metadata.

---

Variants

- Default
- Secondary
- Outline
- Success
- Warning
- Destructive

---

Example

```
Approved
```

---

# StatusBadge

## Purpose

Standardized workflow status indicator.

---

Statuses

- Draft
- Pending
- Under Review
- Approved
- Rejected
- Archived

---

Rules

Never create custom status colors.

Always use approved design tokens.

---

# PriorityBadge

## Purpose

Displays priority level.

---

Values

- Low
- Medium
- High
- Critical

---

# ProgressBar

## Purpose

Displays completion percentage.

---

Use Cases

- Budget Utilization
- Report Generation
- Blockchain Verification

---

# CircularProgress

## Purpose

Displays compact progress.

---

Example

```
72%
```

---

# Timeline

## Purpose

Displays chronological events.

---

Use Cases

- Approval History
- Audit Trail
- Blockchain Transactions

---

Items

- Timestamp
- User
- Action
- Description

---

# ActivityFeed

## Purpose

Displays recent activities.

---

Examples

- Budget Approved
- Expense Submitted
- User Added

---

# AuditTimeline

## Purpose

Displays audit log history.

---

Contains

- Actor
- Action
- Timestamp
- Entity
- Previous Value
- New Value

---

# Avatar

## Purpose

Displays user profile image.

---

Fallback

Initials

---

Sizes

- Small
- Medium
- Large

---

# AvatarGroup

## Purpose

Displays multiple users.

---

Example

```
AB
CD
EF
+4
```

---

# Tooltip

## Purpose

Provides contextual information.

---

Rules

Should never contain critical information.

---

# Popover

## Purpose

Displays additional content.

---

Use Cases

- Quick Details
- Inline Actions
- Metadata

---

# Accordion

## Purpose

Expandable content sections.

---

Use Cases

- FAQ
- Audit Details
- Report Sections

---

# Tabs

## Purpose

Switch between related content.

---

Examples

Overview

Transactions

History

Attachments

---

# DescriptionList

## Purpose

Displays label-value information.

---

Example

Department

Finance

Allocated Budget

₱500,000

---

# EmptyState

## Purpose

Displayed when data is unavailable.

---

Contains

- Illustration
- Heading
- Description
- Action Button

---

Example

"No expenses have been recorded."

---

# ErrorState

## Purpose

Displayed when data retrieval fails.

---

Contains

- Error Icon
- Message
- Retry Button

---

# LoadingSkeleton

## Purpose

Placeholder during loading.

---

Variants

- Card Skeleton
- Table Skeleton
- Form Skeleton
- Dashboard Skeleton

---

# Divider

## Purpose

Separates content visually.

---

Variants

- Horizontal
- Vertical

---

# KPIGrid

## Purpose

Responsive container for statistic cards.

---

Desktop

```
4 Columns
```

Tablet

```
2 Columns
```

Mobile

```
1 Column
```

---

# ChartCard

## Purpose

Reusable wrapper for charts.

---

Contains

- Title
- Chart
- Legend
- Actions

---

# BarChartCard

## Purpose

Displays comparisons.

---

Examples

Budget by Department

Expense by Category

---

# LineChartCard

## Purpose

Displays trends.

---

Examples

Monthly Expenses

Budget Growth

---

# PieChartCard

## Purpose

Displays proportional data.

---

Examples

Budget Distribution

Expense Categories

---

# AreaChartCard

## Purpose

Displays cumulative trends.

---

# DonutChartCard

## Purpose

Compact proportional chart.

---

# Legend

## Purpose

Explains chart colors.

---

Rules

Always accompany charts.

---

# Metric

## Purpose

Displays a single measurable value.

---

Example

```
Approved Budgets

142
```

---

# Summary

The following data display components are defined:

- DataTable
- TableToolbar
- TablePagination
- TableEmptyState
- TableLoading
- StatisticCard
- DashboardCard
- BudgetCard
- ExpenseCard
- ApprovalCard
- ReportCard
- UserCard
- Badge
- StatusBadge
- PriorityBadge
- ProgressBar
- CircularProgress
- Timeline
- ActivityFeed
- AuditTimeline
- Avatar
- AvatarGroup
- Tooltip
- Popover
- Accordion
- Tabs
- DescriptionList
- EmptyState
- ErrorState
- LoadingSkeleton
- Divider
- KPIGrid
- ChartCard
- BarChartCard
- LineChartCard
- PieChartCard
- AreaChartCard
- DonutChartCard
- Legend
- Metric
````
````markdown
---

# 10. Business Components

Business components encapsulate domain-specific functionality unique to the Blockchain-Based Budget Allocation and Expense Monitoring System.

These components should not contain generic UI logic. Instead, they compose reusable UI components from previous sections to implement business workflows.

---

# Dashboard Components

---

## DashboardOverview

### Purpose

Main landing page displaying financial summaries and recent activity.

---

### Location

```
components/dashboard/dashboard-overview.tsx
```

---

### Contains

- KPIGrid
- BudgetSummaryCard
- ExpenseSummaryCard
- PendingApprovalCard
- BudgetUtilizationChart
- RecentTransactionsCard
- ActivityFeed
- BlockchainStatusCard

---

## BudgetSummaryCard

### Purpose

Displays total allocated budget.

---

### Information

- Total Budget
- Utilized Budget
- Remaining Budget
- Percentage Used

---

## ExpenseSummaryCard

Displays

- Total Expenses
- This Month
- Pending Expenses

---

## PendingApprovalCard

Displays

- Pending Requests
- High Priority Requests
- Overdue Requests

---

## RecentTransactionsCard

Displays

- Latest Allocations
- Latest Expenses
- Latest Approvals

---

## BudgetUtilizationChart

Charts

- Department Comparison
- Monthly Trend
- Allocation Distribution

---

## BlockchainStatusCard

Displays

- Latest Block
- Network Status
- Verified Transactions
- Failed Transactions

---

# Budget Allocation Components

---

## BudgetAllocationForm

### Purpose

Creates or edits budget allocations.

---

### Uses

- CurrencyInput
- DepartmentSelect
- FiscalYearSelect
- DatePicker
- TextArea

---

### Validation

- Required fields
- Positive amount
- Fiscal year exists
- Department exists

---

## BudgetAllocationTable

Displays

- Department
- Fiscal Year
- Amount
- Remaining
- Status

---

Supports

- Search
- Filters
- Pagination
- Export

---

## BudgetAllocationDetails

Displays

- Allocation Information
- Audit History
- Blockchain Verification
- Expense Summary

---

## BudgetAllocationStatusBadge

Statuses

- Draft
- Active
- Closed
- Archived

---

## BudgetAllocationActions

Contains

- View
- Edit
- Archive
- Duplicate

---

# Budget Approval Components

---

## ApprovalQueue

### Purpose

Displays all pending approval requests.

---

Columns

- Request ID
- Department
- Amount
- Submitted By
- Date
- Priority
- Status

---

Supports

- Sorting
- Filtering
- Bulk Approval
- Bulk Rejection

---

## ApprovalDetails

Displays

- Request Information
- Supporting Documents
- Comments
- Approval History

---

## ApprovalTimeline

Displays

```
Created

↓

Submitted

↓

Reviewed

↓

Approved

↓

Blockchain Recorded
```

---

## ApprovalActions

Contains

- Approve
- Reject
- Return for Revision
- Request Clarification

---

## ApprovalCommentBox

Purpose

Collect reviewer comments.

---

Validation

Comment required when rejecting.

---

## ApprovalHistory

Displays

- Reviewer
- Decision
- Timestamp
- Comment

---

## ApprovalProgress

Displays

Current workflow stage.

---

## ApprovalNotificationBanner

Examples

```
Awaiting Department Head Approval
```

```
Awaiting Treasurer Approval
```

---

# Expense Monitoring Components

---

## ExpenseForm

Purpose

Create or edit expense records.

---

Contains

- Category
- Description
- Amount
- Date
- Attachments

---

## ExpenseTable

Columns

- Expense
- Department
- Amount
- Date
- Status

---

Supports

- Search
- Export
- Filters

---

## ExpenseCard

Compact expense summary.

---

## ExpenseDetails

Displays

- Expense Information
- Attachments
- Approval Status
- Audit Trail

---

## ExpenseAttachmentViewer

Supports

- PDF
- Images
- Office Documents

---

## ExpenseStatusBadge

Statuses

- Draft
- Submitted
- Approved
- Rejected
- Paid

---

# Blockchain Components

> **Implemented (Phase 4.4):** `BlockchainStatusBadge`, `BlockchainVerificationCard` (+ `BlockchainVerificationContent`), and `BlockchainRecordTable` live in `apps/frontend/src/components/blockchain/`. State/query glue: `src/hooks/useBlockchain.ts`, `src/services/blockchainService.ts`, `src/constants/blockchainStatus.ts`, `src/types/blockchain.ts`. The Blockchain Ledger page is `src/pages/blockchain/BlockchainLedger.tsx`.

---

## BlockchainVerificationBadge

Displays

```
Verified
```

or

```
Pending Verification
```

---

## BlockchainTransactionCard

Displays

- Transaction Hash
- Block Number
- Timestamp
- Gas Used

---

## BlockchainHashViewer

Purpose

Display blockchain hash.

---

Features

- Copy
- Expand
- Verify

---

## BlockchainTimeline

Shows

```
Transaction Submitted

↓

Block Confirmed

↓

Verification Complete
```

---

## BlockchainStatusIndicator

States

- Connected
- Connecting
- Offline
- Error

---

## SmartContractInformation

Displays

- Contract Address
- Network
- Version

---

# Reports Components

---

## ReportGenerator

Purpose

Generate reports.

---

Supports

- PDF
- Excel
- CSV

---

## ReportFilters

Contains

- Date Range
- Department
- Category
- Fiscal Year

---

## ReportPreview

Displays

Generated report preview.

---

## ReportDownloadActions

Buttons

- Download PDF
- Download Excel
- Download CSV

---

# Audit Components

---

## AuditLogTable

Displays

- User
- Action
- Entity
- Timestamp
- IP Address

---

Supports

- Search
- Filtering
- Export

---

## AuditLogDetails

Displays

- Previous Value
- New Value
- Metadata

---

## AuditActivityTimeline

Chronological system events.

---

## EntityHistory

Displays every modification made to an entity.

---

# Notification Components

---

## NotificationCenter

Displays all system notifications.

---

Categories

- Budget
- Approval
- Expense
- Blockchain
- System

---

## NotificationItem

Displays

- Icon
- Title
- Description
- Timestamp

---

## NotificationSettings

Configure

- Email Notifications
- In-App Notifications
- Push Notifications (Future)

---

# User Management Components

---

## UserTable

Displays

- Name
- Email
- Department
- Role
- Status

---

## UserForm

Create or edit users.

---

## RoleBadge

Displays

- Administrator
- Budget Officer
- Treasurer
- Department Head
- Auditor

---

## PermissionMatrix

Displays role permissions.

---

# Reusable Business Widgets

---

## FiscalYearSelector

Reusable fiscal year dropdown.

---

## DepartmentSelector

Reusable department selector.

---

## BudgetCategorySelector

Reusable category selector.

---

## AmountSummary

Displays

Allocated

Spent

Remaining

---

## FinancialMetric

Displays

- Currency
- Percentage
- Trend

---

## VerificationStatus

Displays blockchain verification state.

---

# Component Relationships

```
DashboardOverview
│
├── KPIGrid
├── BudgetSummaryCard
├── ExpenseSummaryCard
├── PendingApprovalCard
├── BlockchainStatusCard
└── ActivityFeed

BudgetAllocationPage
│
├── BudgetAllocationTable
├── BudgetAllocationActions
├── BudgetAllocationDetails
└── BudgetAllocationForm

ApprovalPage
│
├── ApprovalQueue
├── ApprovalDetails
├── ApprovalTimeline
├── ApprovalActions
└── ApprovalCommentBox

ExpensePage
│
├── ExpenseTable
├── ExpenseDetails
├── ExpenseForm
└── ExpenseAttachmentViewer
```

---

# Best Practices

- Business components should compose reusable UI components rather than reimplement them.
- Keep business logic in hooks, services, or state management layers—not inside presentational components.
- Fetch data outside the component when practical (e.g., via TanStack Query).
- Prefer small, focused components over large, monolithic ones.
- Reuse selectors (Department, Fiscal Year, Category) across all modules for consistency.
- Every business component should support loading, empty, error, and permission-denied states when applicable.

---

# Summary

The following business components are defined:

- DashboardOverview
- BudgetSummaryCard
- ExpenseSummaryCard
- PendingApprovalCard
- RecentTransactionsCard
- BudgetUtilizationChart
- BlockchainStatusCard
- BudgetAllocationForm
- BudgetAllocationTable
- BudgetAllocationDetails
- BudgetAllocationStatusBadge
- BudgetAllocationActions
- ApprovalQueue
- ApprovalDetails
- ApprovalTimeline
- ApprovalActions
- ApprovalCommentBox
- ApprovalHistory
- ApprovalProgress
- ApprovalNotificationBanner
- ExpenseForm
- ExpenseTable
- ExpenseCard
- ExpenseDetails
- ExpenseAttachmentViewer
- ExpenseStatusBadge
- BlockchainVerificationBadge
- BlockchainTransactionCard
- BlockchainHashViewer
- BlockchainTimeline
- BlockchainStatusIndicator
- SmartContractInformation
- ReportGenerator
- ReportFilters
- ReportPreview
- ReportDownloadActions
- AuditLogTable
- AuditLogDetails
- AuditActivityTimeline
- EntityHistory
- NotificationCenter
- NotificationItem
- NotificationSettings
- UserTable
- UserForm
- RoleBadge
- PermissionMatrix
- FiscalYearSelector
- DepartmentSelector
- BudgetCategorySelector
- AmountSummary
- FinancialMetric
- VerificationStatus
````
````markdown
---

# 11. Overlay & Utility Components

These components provide application-wide functionality and support multiple business modules.

---

# Dialog

## Purpose

Displays critical information or requires user confirmation before continuing.

---

## Location

```
components/ui/dialog.tsx
```

---

## Use Cases

- Delete Confirmation
- Archive Confirmation
- View Details
- Edit Record
- Approval Confirmation

---

## Sizes

| Size | Width |
|------|------|
| Small | 400px |
| Medium | 600px |
| Large | 800px |
| Full | 100% |

---

## Features

- Focus trapping
- Escape to close
- Click outside (optional)
- Accessible labels
- Footer actions

---

# ConfirmationDialog

## Purpose

Reusable confirmation dialog for destructive actions.

---

## Standard Buttons

```
Cancel

Confirm
```

---

## Examples

```
Delete Budget Allocation

Archive Record

Reject Request

Reset Password
```

---

# Drawer

## Purpose

Displays secondary content without leaving the current page.

---

## Use Cases

- Mobile Navigation
- Quick Details
- Filter Panel

---

# Sheet

## Purpose

Side panel for editing or viewing information.

---

Use Cases

- Quick Edit
- User Details
- Budget Preview

---

# Popover

## Purpose

Displays lightweight contextual information.

---

Examples

- User Card
- Transaction Preview
- Metadata

---

# ContextMenu

## Purpose

Displays contextual actions.

---

Example

```
View

Edit

Duplicate

Archive

Delete
```

---

# Tooltip

## Purpose

Provides additional information for controls.

---

Rules

- Keep text short
- Never hide critical information
- Delay appearance slightly

---

# DropdownMenu

## Purpose

Displays grouped actions.

---

Examples

```
Export

Duplicate

Archive

Delete
```

---

# Toast Notifications

## Purpose

Provides lightweight system feedback.

---

## Types

- Success
- Error
- Warning
- Information

---

## Position

Top Right

---

## Duration

```
3–5 Seconds
```

---

## Examples

```
Budget created successfully.

Expense approved.

Blockchain verification completed.

Network connection lost.
```

---

# NotificationCenter

## Purpose

Displays persistent notifications.

---

Categories

- Budget
- Expense
- Approval
- Blockchain
- Reports
- System

---

Features

- Mark Read
- Mark All Read
- Delete
- Filter

---

# Loading Components

---

# LoadingOverlay

Purpose

Prevent interaction while critical operations complete.

---

# LoadingSpinner

Use for

- Small actions
- Buttons
- Inline loading

---

# SkeletonLoader

Preferred loading indicator.

---

Variants

- Table
- Card
- Dashboard
- Form
- Details

---

# ProgressIndicator

Displays long-running operations.

---

Examples

- Report Generation
- Blockchain Synchronization
- File Upload

---

# Error Components

---

# ErrorBoundary

Purpose

Catch React rendering errors.

---

Fallback

```
Something went wrong.

[Reload]
```

---

# ErrorPage

Purpose

Application-level error page.

---

Examples

- 404
- 403
- 500

---

# PermissionDenied

Purpose

Displayed when access is denied.

---

Example

```
You do not have permission to view this page.
```

---

# OfflineBanner

Purpose

Notify user of connectivity issues.

---

States

- Online
- Offline
- Reconnecting

---

# Permission Components

---

# PermissionGuard

Purpose

Conditionally render UI.

---

Example

```tsx
<PermissionGuard permission="budget.create">
    <CreateBudgetButton />
</PermissionGuard>
```

---

# RoleGuard

Purpose

Restrict components to specific roles.

---

Supported Roles

- Administrator
- Budget Officer
- Treasurer
- Department Head
- Auditor

---

# ProtectedRoute

Purpose

Restrict navigation based on authentication and authorization.

---

# File Components

---

# FilePreview

Supports

- PDF
- DOCX
- XLSX
- PNG
- JPG

---

# FileDownloadButton

Purpose

Download uploaded files.

---

# AttachmentList

Displays

- File Name
- Size
- Uploaded By
- Date

---

# Search Components

---

# GlobalSearch

Purpose

Search across the application.

---

Supports

- Budgets
- Expenses
- Users
- Reports

---

# FilterPanel

Reusable filter drawer.

---

Contains

- Status
- Department
- Fiscal Year
- Date Range

---

# ActiveFilters

Displays active filters.

---

Example

```
Department: Finance

Status: Approved
```

---

# Export Components

---

# ExportMenu

Formats

- PDF
- Excel
- CSV

---

# PrintButton

Purpose

Print reports and summaries.

---

# Theme Components

---

# ThemeProvider

Purpose

Provides application theme.

---

Supported

- Light
- Dark (Future)
- System (Future)

---

# LanguageProvider *(Future)*

Purpose

Internationalization.

---

Supported

- English

Future

- Filipino

---

# Component Testing Standards

Every reusable component should be tested.

---

## Required Tests

- Rendering
- User Interaction
- Accessibility
- Keyboard Navigation
- Disabled State
- Loading State
- Error State

---

# Component Documentation Standards

Each component should include:

- Purpose
- Props
- Variants
- States
- Accessibility
- Example Usage
- Notes

---

# Performance Guidelines

## Do

- Memoize expensive components.
- Virtualize large tables.
- Lazy load heavy pages.
- Use React Query caching.
- Split bundles by route.

---

## Avoid

- Deep prop drilling
- Large monolithic components
- Repeated API requests
- Inline anonymous functions in large lists

---

# Accessibility Checklist

Every component should support:

- Semantic HTML
- Keyboard navigation
- Visible focus
- Screen readers
- ARIA labels
- Color contrast
- Reduced motion

---

# Component Development Checklist

Before adding a new component:

- Does a similar component already exist?
- Can an existing component be extended?
- Is it reusable?
- Is it accessible?
- Is it responsive?
- Is it documented?
- Is it typed?
- Is it tested?

---

# Pull Request Checklist

Before merging frontend changes:

- Design System followed
- Component Library updated
- No duplicated components
- Responsive on all breakpoints
- Accessibility verified
- Loading state implemented
- Error state implemented
- Empty state implemented
- TypeScript errors resolved
- Linting passed

---

# Versioning

| Version | Description |
|----------|-------------|
| 1.0.0 | Initial component library |
| 1.1.0 | New components added |
| 2.0.0 | Breaking API changes |

---

# Future Enhancements

Potential additions include:

- Storybook Integration
- Visual Regression Testing
- Component Playground
- Theme Customization
- Animation Library
- RTL Language Support
- High Contrast Mode
- AI-assisted UI Generation

---

# Appendix A — Recommended Libraries

## UI

- shadcn/ui
- Tailwind CSS

## Forms

- React Hook Form
- Zod

## Data Tables

- TanStack Table

## Charts

- Recharts

## State Management

- TanStack Query
- Zustand

## Icons

- Lucide React

## Animation

- Framer Motion

## Notifications

- Sonner

---

# Appendix B — Component Dependency Flow

```
Pages

↓

Business Components

↓

Reusable Components

↓

shadcn/ui Components

↓

Tailwind CSS

↓

Design Tokens
```

---

# Appendix C — Frontend Architecture

```
Pages

↓

Layouts

↓

Business Components

↓

Reusable UI Components

↓

Hooks

↓

Services

↓

API Layer
```

---

# Conclusion

The Component Library defines the standard for every reusable frontend component within the Blockchain-Based Budget Allocation and Expense Monitoring System.

Following this document ensures:

- Consistent user experience
- Faster feature development
- Reduced code duplication
- Improved accessibility
- Easier maintenance
- Better collaboration among developers

Every new reusable component introduced into the project should conform to this library and be documented accordingly.
````
