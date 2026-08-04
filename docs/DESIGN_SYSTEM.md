# Design System

> **Project:** Blockchain-Based Budget Allocation and Expense Monitoring System
> 
> **Version:** 1.0.0
> 
> **Last Updated:** August 2026

---

# Table of Contents

- [1. Introduction](#1-introduction)
- [2. Design Principles](#2-design-principles)
- [3. Design Goals](#3-design-goals)
- [4. Brand Identity](#4-brand-identity)
- [5. Color System](#5-color-system)
- [6. Typography](#6-typography)
- [7. Spacing System](#7-spacing-system)
- [8. Border Radius](#8-border-radius)
- [9. Shadows](#9-shadows)
- [10. Borders](#10-borders)
- [11. Grid System](#11-grid-system)
- [12. Responsive Breakpoints](#12-responsive-breakpoints)
- [13. Iconography](#13-iconography)
- [14. Elevation](#14-elevation)
- [15. Accessibility Standards](#15-accessibility-standards)

---

# 1. Introduction

## Purpose

The Design System establishes a single source of truth for the user interface of the Blockchain-Based Budget Allocation and Expense Monitoring System.

It ensures that every screen, component, and interaction is:

- Consistent
- Accessible
- Responsive
- Professional
- Maintainable

All developers must follow this document when creating or modifying UI components.

---

## Objectives

The design system aims to:

- Maintain visual consistency
- Improve development speed
- Reduce duplicate components
- Improve accessibility
- Simplify maintenance
- Create a professional government-grade interface

---

# 2. Design Principles

The interface should follow these principles.

---

## 2.1 Clarity

Users should immediately understand:

- what page they are on
- what action they can perform
- what information is important

Avoid visual clutter.

---

## 2.2 Consistency

Every page should behave similarly.

Examples:

- Buttons should always look the same.
- Cards should use identical spacing.
- Tables should share the same layout.
- Colors must always represent the same meaning.

---

## 2.3 Simplicity

Only display necessary information.

Avoid unnecessary decorations.

The system is intended for financial management—not marketing.

---

## 2.4 Accessibility

The interface should be usable by everyone.

Support:

- Keyboard navigation
- Screen readers
- High contrast
- Focus indicators

---

## 2.5 Feedback

Every user action must receive feedback.

Examples:

- Loading indicators
- Success messages
- Error messages
- Confirmation dialogs

---

## 2.6 Responsiveness

Every page must work on:

- Desktop
- Tablet
- Mobile

---

# 3. Design Goals

The interface should communicate:

- Trust
- Transparency
- Security
- Accuracy
- Professionalism

Avoid playful or overly colorful designs.

The visual language should resemble enterprise software.

Examples:

- GitHub
- Stripe Dashboard
- Linear
- Microsoft Azure Portal
- Vercel Dashboard

---

# 4. Brand Identity

## Theme

Professional Government Dashboard

---

## Personality

- Clean
- Modern
- Minimal
- Secure
- Reliable
- Enterprise

---

## Visual Tone

Use whitespace generously.

Avoid heavy gradients.

Avoid excessive shadows.

Prioritize readability.

---

# 5. Color System

## Primary Color

Represents:

- Trust
- Financial Management
- Security

| Shade | Hex     |
| ----- | ------- |
| 50    | #EFF6FF |
| 100   | #DBEAFE |
| 200   | #BFDBFE |
| 300   | #93C5FD |
| 400   | #60A5FA |
| 500   | #3B82F6 |
| 600   | #2563EB |
| 700   | #1D4ED8 |
| 800   | #1E40AF |
| 900   | #1E3A8A |

---

## Neutral Colors

Used for:

- Backgrounds
- Borders
- Text

| Shade | Hex     |
| ----- | ------- |
| 50    | #F8FAFC |
| 100   | #F1F5F9 |
| 200   | #E2E8F0 |
| 300   | #CBD5E1 |
| 400   | #94A3B8 |
| 500   | #64748B |
| 600   | #475569 |
| 700   | #334155 |
| 800   | #1E293B |
| 900   | #0F172A |

---

## Success

Used for:

- Approved
- Completed
- Verified

| Shade | Hex     |
| ----- | ------- |
| 500   | #22C55E |
| 600   | #16A34A |
| 700   | #15803D |

---

## Warning

Used for:

- Pending
- Review Required

| Shade | Hex     |
| ----- | ------- |
| 500   | #F59E0B |
| 600   | #D97706 |

---

## Danger

Used for:

- Rejected
- Errors
- Failed

| Shade | Hex     |
| ----- | ------- |
| 500   | #EF4444 |
| 600   | #DC2626 |

---

## Information

| Shade | Hex     |
| ----- | ------- |
| 500   | #0EA5E9 |
| 600   | #0284C7 |

---

# 6. Typography

## Font Family

Primary:

```
Inter
```

Fallback

```
system-ui
sans-serif
```

---

## Font Weights

| Weight | Usage              |
| ------ | ------------------ |
| 400    | Body               |
| 500    | Labels             |
| 600    | Headings           |
| 700    | Important Headings |

---

## Type Scale

| Element    | Size |
| ---------- | ---- |
| Display    | 48px |
| H1         | 36px |
| H2         | 30px |
| H3         | 24px |
| H4         | 20px |
| H5         | 18px |
| Body Large | 16px |
| Body       | 14px |
| Small      | 12px |
| Caption    | 11px |

---

## Line Height

| Type    | Value |
| ------- | ----- |
| Heading | 120%  |
| Body    | 150%  |
| Caption | 140%  |

---

# 7. Spacing System

Use an **8-point spacing system**.

Never use arbitrary spacing values.

## Scale

| Token | Pixels |
| ----- | ------ |
| xs    | 4      |
| sm    | 8      |
| md    | 16     |
| lg    | 24     |
| xl    | 32     |
| 2xl   | 40     |
| 3xl   | 48     |
| 4xl   | 64     |
| 5xl   | 80     |

---

## Component Padding

Buttons

```
px-4 py-2
```

Cards

```
24px
```

Dialogs

```
32px
```

Forms

```
24px
```

---

# 8. Border Radius

| Token | Value  |
| ----- | ------ |
| none  | 0      |
| sm    | 4px    |
| md    | 8px    |
| lg    | 12px   |
| xl    | 16px   |
| 2xl   | 20px   |
| full  | 9999px |

---

# 9. Shadows

## Small

```
0 1px 2px rgba(0,0,0,.05)
```

Used for

- Inputs
- Cards

---

## Medium

```
0 4px 12px rgba(0,0,0,.08)
```

Used for

- Dropdowns
- Popovers

---

## Large

```
0 12px 32px rgba(0,0,0,.12)
```

Used for

- Modals

---

# 10. Borders

Border Width

```
1px
```

Default Border

```
Slate 200
```

Hover

```
Slate 300
```

Focus

```
Primary 500
```

---

# 11. Grid System

Desktop

```
12 Columns
```

Tablet

```
8 Columns
```

Mobile

```
4 Columns
```

Maximum Content Width

```
1440px
```

Default Page Padding

Desktop

```
32px
```

Tablet

```
24px
```

Mobile

```
16px
```

---

# 12. Responsive Breakpoints

| Breakpoint | Width  |
| ---------- | ------ |
| xs         | 480px  |
| sm         | 640px  |
| md         | 768px  |
| lg         | 1024px |
| xl         | 1280px |
| 2xl        | 1536px |

---

# 13. Iconography

Icon Library

```
Lucide React
```

---

## Sizes

| Usage   | Size |
| ------- | ---- |
| Small   | 16px |
| Default | 20px |
| Medium  | 24px |
| Large   | 32px |

---

## Rules

Icons should always:

- have consistent stroke width
- align with text
- never replace labels
- use semantic meaning

---

# 14. Elevation

Use elevation sparingly.

| Level | Usage      |
| ----- | ---------- |
| 0     | Background |
| 1     | Cards      |
| 2     | Dropdowns  |
| 3     | Modals     |

Avoid stacking multiple shadows.

---

# 15. Accessibility Standards

The application must comply with WCAG AA standards.

---

## Contrast Ratio

Minimum:

```
4.5:1
```

Large Text

```
3:1
```

---

## Keyboard Navigation

Every interactive element must support:

- Tab
- Shift+Tab
- Enter
- Escape

---

## Focus Ring

Every focusable element should display a visible outline.

---

## Screen Reader Support

Every icon-only button must include:

- aria-label
- aria-describedby (when appropriate)

---

## Error Messages

Every invalid field should provide:

- descriptive error message
- red border
- accessible announcement

---

## Responsive Zoom

The application should remain usable at:

- 125%
- 150%
- 200%

without horizontal scrolling.

---

# 16. Buttons

Buttons communicate user actions and should be consistent throughout the application.

## Variants

| Variant     | Purpose                        |
| ----------- | ------------------------------ |
| Primary     | Main call-to-action            |
| Secondary   | Less emphasized actions        |
| Outline     | Alternative primary actions    |
| Ghost       | Low emphasis actions           |
| Destructive | Delete or irreversible actions |
| Success     | Confirmation actions           |
| Link        | Inline navigation              |

---

## Sizes

| Size   | Height       |
| ------ | ------------ |
| Small  | 32px         |
| Medium | 40px         |
| Large  | 48px         |
| Icon   | 40px × 40px |

---

## States

Every button supports:

- Default
- Hover
- Active
- Focus
- Disabled
- Loading

---

## Rules

- Only one Primary button per major section.
- Never use more than one Destructive button together.
- Loading buttons must disable additional clicks.
- Icons should appear before text when representing an action.

Examples

```
Save Changes
Submit Budget
Approve
Reject
Archive
```

---

# 17. Form Controls

Forms should be simple, predictable, and easy to complete.

---

## Text Input

Used for:

- Names
- Descriptions
- IDs
- Search

States:

- Default
- Focus
- Error
- Disabled
- Read Only

---

## Number Input

Used for:

- Budget Amount
- Expenses
- Quantities

Rules:

- Right-align values
- Format currency automatically
- Prevent invalid characters

---

## Currency Input

Display format

```
₱ 100,000.00
```

Requirements:

- Thousand separators
- Decimal support
- Currency prefix
- Validation

---

## Text Area

Used for:

- Remarks
- Justifications
- Notes

Minimum height

```
120px
```

---

## Select

Supports:

- Search
- Keyboard navigation
- Disabled options
- Clear selection

---

## Date Picker

Used for:

- Allocation Date
- Expense Date
- Approval Date

---

## Checkbox

Used for:

- Multiple selection
- Permissions
- Bulk actions

---

## Radio Group

Used when only one value is allowed.

---

## Toggle Switch

Used for

- Enable/Disable
- Active/Inactive

---

## Validation

Every required field must indicate:

- Required marker
- Error message
- Invalid border
- Accessible description

---

# 18. Tables

Tables are the primary data presentation component.

---

## Features

Every table should support:

- Sorting
- Pagination
- Search
- Filters
- Empty State
- Loading Skeleton
- Responsive scrolling

---

## Row Height

```
56px
```

---

## Header

Headers should:

- remain sticky
- support sorting
- indicate active sort

---

## Row Actions

Use an overflow menu when there are more than three actions.

Example

```
View

Edit

Archive

Delete
```

---

## Empty State

Should include:

- Illustration
- Message
- Call to Action

---

## Loading State

Use skeleton rows instead of spinners whenever possible.

---

# 19. Cards

Cards group related information.

---

## Variants

Default

Outlined

Interactive

Statistic

Summary

---

## Statistic Card

Contains:

- Title
- Value
- Icon
- Trend
- Description

---

## Budget Card

Contains:

- Department
- Allocated Amount
- Remaining Budget
- Status
- Last Updated

---

## Expense Card

Contains:

- Expense Category
- Amount
- Date
- Status

---

# 20. Badges

Badges communicate status.

---

## Status Colors

| Status              | Color   |
| ------------------- | ------- |
| Draft               | Gray    |
| Pending             | Amber   |
| Under Review        | Blue    |
| Approved            | Green   |
| Rejected            | Red     |
| Archived            | Slate   |
| Blockchain Verified | Emerald |

---

## Rules

Badges should:

- Use icons when appropriate
- Be concise
- Never exceed two words

---

# 21. Alerts

Alerts communicate important system information.

---

## Types

Success

Information

Warning

Error

---

## Structure

Alert contains:

- Icon
- Title
- Description
- Optional Action

---

# 22. Navigation

Navigation should remain consistent across all pages.

---

## Sidebar

Contains:

Dashboard

Budget Allocation

Budget Approval

Expense Monitoring

Audit Logs

Reports

Users

Settings

---

Rules:

- Active page highlighted
- Icons always visible
- Collapsible on desktop
- Hidden behind drawer on mobile

---

## Top Navigation

Contains:

Search

Notifications

Profile Menu

Theme Toggle

---

## Breadcrumb

Example

```
Dashboard

>

Budget Allocation

>

Create
```

---

# 23. Tabs

Tabs organize related content.

Examples

```
Overview

Transactions

Approvals

History
```

---

Rules

- Maximum 7 tabs
- Active tab clearly highlighted
- Keyboard accessible

---

# 24. Dropdown Menus

Dropdowns should support:

- Keyboard navigation
- Search
- Disabled options
- Group labels
- Icons

---

# 25. Modal Dialogs

Used for:

- Confirmation
- Create
- Edit
- View Details

---

Sizes

Small

Medium

Large

Extra Large

Full Screen

---

Structure

Header

Body

Footer

---

Footer Buttons

Primary

Secondary

Cancel

---

Rules

- Close with Escape
- Trap keyboard focus
- Prevent accidental dismissal for destructive actions

---

# 26. Toast Notifications

Used for lightweight feedback.

---

Types

Success

Error

Warning

Information

---

Duration

```
3–5 seconds
```

---

Position

Top Right

---

Examples

```
Budget approved successfully.

Expense created successfully.

Network connection lost.

Blockchain verification completed.
```

---

# 27. Loading States

Never leave users wondering if something is happening.

---

Preferred Loading Indicators

1. Skeleton
2. Progress Bar
3. Spinner

---

Skeleton Usage

- Tables
- Cards
- Dashboard
- Detail Pages

---

Spinner Usage

- Small actions
- Inline loading
- Button loading

---

# 28. Empty States

Every page must define an empty state.

---

Contains

Illustration

Title

Description

Primary Action

---

Example

Title

```
No Budget Allocations Found
```

Description

```
Create your first budget allocation to begin managing department budgets.
```

Button

```
Create Allocation
```

---

# 29. Charts

Charts should prioritize readability over decoration.

---

Supported Charts

Bar Chart

Line Chart

Pie Chart

Area Chart

Donut Chart

---

Rules

- Always include labels
- Always include legends
- Avoid unnecessary animations
- Use consistent colors
- Provide tooltips

---

Color Mapping

Blue

Budget

Green

Approved

Amber

Pending

Red

Rejected

Gray

Archived

---

# 30. Search & Filtering

Every data-heavy page should include search.

---

Supported Filters

Date Range

Department

Status

Budget Category

Amount

Fiscal Year

---

Rules

- Preserve filters after refresh when appropriate.
- Display active filter count.
- Allow clearing all filters with one action.

---

# 31. Pagination

Default page sizes

10

25

50

100

---

Controls

Previous

Next

Page Number

Page Size

---

Rules

Always display:

Current Page

Total Pages

Total Records

---

# 32. File Upload

Supported Files

PDF

DOCX

XLSX

PNG

JPEG

---

Maximum Size

```
10 MB
```

---

Display

File Name

Upload Progress

Preview (if applicable)

Remove Button

---

# 33. Notifications

Notification Types

Approval Request

Approval Completed

Expense Submitted

Budget Updated

Blockchain Verification

System Announcement

---

Each notification should contain:

Icon

Title

Description

Timestamp

Read/Unread State

---

# 34. Dashboard Widgets

Approved widgets include:

- Budget Summary
- Expense Summary
- Pending Approvals
- Recent Transactions
- Budget Utilization
- Department Statistics
- Blockchain Verification Status
- Audit Activity
- Financial Trends
- Quick Actions

Dashboard layout should prioritize the most critical financial information above the fold.

---

````markdown
---

# 35. Motion & Animation

Animations should improve usability, not distract users.

## Principles

- Keep animations subtle and purposeful.
- Never delay critical user actions.
- Respect user preferences for reduced motion.
- Avoid excessive movement on data-heavy pages.

---

## Transition Durations

| Type | Duration |
|-------|----------|
| Fast | 100ms |
| Standard | 200ms |
| Slow | 300ms |

---

## Standard Animations

### Fade

Used for:

- Toasts
- Alerts
- Empty States

---

### Slide

Used for:

- Drawers
- Sidebars
- Mobile Navigation

---

### Scale

Used for:

- Dialogs
- Context Menus
- Popovers

---

### Skeleton Loading

Used for:

- Tables
- Dashboard Cards
- Reports
- Detail Pages

---

## Hover Effects

Interactive elements should provide visual feedback.

Examples:

- Slight background change
- Border highlight
- Shadow elevation
- Cursor change

Avoid excessive scaling or bouncing.

---

# 36. Dark Mode Guidelines

Dark mode is not required for Version 1 but the design system should support future implementation.

---

## Requirements

- Maintain sufficient contrast.
- Preserve semantic colors.
- Avoid pure black backgrounds.
- Use softer shadows.

---

## Recommended Backgrounds

| Element | Light | Dark |
|----------|--------|-------|
| Page | White | Slate 950 |
| Card | White | Slate 900 |
| Sidebar | Slate 900 | Slate 950 |

---

# 37. Page Layout Templates

Every page should follow a consistent layout.

---

## Standard Page Structure

```
Top Navigation

↓

Page Header

↓

Actions

↓

Filters

↓

Content

↓

Pagination
```

---

## Page Header

Contains:

- Title
- Description
- Primary Action

Example

```
Budget Allocation

Manage departmental budget allocations.

[ Create Allocation ]
```

---

## Dashboard Layout

Recommended order:

1. Summary Cards
2. Budget Utilization
3. Pending Approvals
4. Recent Transactions
5. Charts
6. Activity Feed

---

## Detail Page Layout

```
Header

↓

Summary Card

↓

Tabs

↓

Content

↓

Audit Trail
```

---

# 38. Component Composition

Reusable components should be composed from smaller building blocks.

Example

```
Budget Card

├── Badge
├── Title
├── Description
├── Amount
└── Actions
```

Avoid creating large monolithic components.

---

# 39. Naming Conventions

## Components

Use PascalCase.

Examples

```
BudgetCard
ApprovalTimeline
ExpenseTable
DashboardStats
```

---

## Files

Use kebab-case.

Examples

```
budget-card.tsx
approval-dialog.tsx
expense-table.tsx
```

---

## CSS Variables

Use semantic naming.

Example

```
--primary
--background
--foreground
--border
--success
--warning
--destructive
```

Avoid color-specific names such as:

```
--blue
--green
--red
```

---

# 40. Design Tokens

Design tokens provide a centralized source of design values.

---

## Colors

```css
--primary
--secondary
--background
--foreground
--muted
--border
--success
--warning
--destructive
```

---

## Typography

```css
--font-sans
--font-heading
--font-mono
```

---

## Radius

```css
--radius-sm
--radius-md
--radius-lg
--radius-xl
```

---

## Shadows

```css
--shadow-sm
--shadow-md
--shadow-lg
```

---

## Spacing

```css
--space-1
--space-2
--space-3
--space-4
...
```

---

# 41. Implementation Guidelines

The frontend should follow these principles.

---

## Reuse Before Creating

Always check if a component already exists before creating a new one.

---

## Single Responsibility

A component should have one primary purpose.

---

## Composition Over Duplication

Prefer composing multiple reusable components instead of duplicating code.

---

## Predictable Behavior

Components should behave consistently across all pages.

---

## Accessibility First

Accessibility is a default requirement—not an optional enhancement.

---

# 42. Design Review Checklist

Before merging UI changes, verify:

## Visual Consistency

- Typography matches the design system.
- Colors use approved tokens.
- Spacing follows the 8-point grid.
- Icons are consistent.

---

## Responsiveness

- Mobile
- Tablet
- Desktop

Test all layouts.

---

## Accessibility

- Keyboard navigation
- Focus states
- ARIA labels
- Color contrast

---

## Performance

- Avoid unnecessary re-renders.
- Optimize large tables.
- Lazy load heavy components.
- Minimize layout shifts.

---

## Empty States

Every page should include:

- Empty State
- Loading State
- Error State

---

## Validation

Forms should provide:

- Inline validation
- Helpful error messages
- Required indicators

---

# 43. UI Do's and Don'ts

## Do

- Use reusable components.
- Maintain consistent spacing.
- Use semantic colors.
- Provide loading feedback.
- Keep interfaces simple.

---

## Don't

- Introduce new colors without updating the design system.
- Duplicate components.
- Use arbitrary spacing values.
- Hide important actions.
- Overuse animations.
- Mix different button styles on the same page.

---

# 44. Future Enhancements

Potential future improvements include:

- Dark Mode
- Internationalization (i18n)
- RTL Language Support
- Theme Customization
- High Contrast Mode
- Advanced Data Visualization
- Offline Support
- Command Palette
- Keyboard Shortcuts
- Component Playground
- Storybook Integration
- Design Token Automation

---

# 45. Versioning

Changes to this document should follow semantic versioning.

| Version | Description |
|----------|-------------|
| 1.0.0 | Initial Design System |
| 1.1.0 | New components or tokens |
| 2.0.0 | Breaking design changes |

---

# Appendix A — Recommended Technology Stack

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

Forms

- React Hook Form
- Zod

Tables

- TanStack Table

Charts

- Recharts

Icons

- Lucide React

Animations

- Framer Motion

Notifications

- Sonner

State Management

- TanStack Query
- Zustand

---

# Appendix B — Component Hierarchy

```
App

├── AppLayout
│   ├── Sidebar
│   ├── TopNavigation
│   └── PageContainer
│
├── Dashboard
│
├── Budget Allocation
│
├── Budget Approval
│
├── Expense Monitoring
│
├── Reports
│
├── Audit Logs
│
└── Settings
```

---

# Appendix C — Design Philosophy

This design system is intended to support a modern enterprise-grade financial management application.

Every interface should prioritize:

- Clarity over decoration
- Consistency over creativity
- Accessibility over convenience
- Maintainability over complexity

By adhering to this document, the project will maintain a unified visual language, improve developer productivity, and deliver a professional user experience suitable for government financial operations.

---
````
