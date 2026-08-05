/**
 * Audit action definitions for the Audit Trail module.
 *
 * Mirrors the backend `AUDIT_ACTIONS` constant. Values are used verbatim in
 * API requests/responses while labels drive filter dropdowns and tables.
 */

export const AUDIT_ACTIONS = {
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_REFRESH_TOKEN: 'AUTH_REFRESH_TOKEN',

  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',

  FISCAL_YEAR_CREATE: 'FISCAL_YEAR_CREATE',
  FISCAL_YEAR_UPDATE: 'FISCAL_YEAR_UPDATE',
  FISCAL_YEAR_DELETE: 'FISCAL_YEAR_DELETE',
  FISCAL_YEAR_ACTIVATE: 'FISCAL_YEAR_ACTIVATE',

  FUND_SOURCE_CREATE: 'FUND_SOURCE_CREATE',
  FUND_SOURCE_UPDATE: 'FUND_SOURCE_UPDATE',
  FUND_SOURCE_DELETE: 'FUND_SOURCE_DELETE',

  DEPARTMENT_CREATE: 'DEPARTMENT_CREATE',
  DEPARTMENT_UPDATE: 'DEPARTMENT_UPDATE',
  DEPARTMENT_DELETE: 'DEPARTMENT_DELETE',

  BUDGET_CATEGORY_CREATE: 'BUDGET_CATEGORY_CREATE',
  BUDGET_CATEGORY_UPDATE: 'BUDGET_CATEGORY_UPDATE',
  BUDGET_CATEGORY_DELETE: 'BUDGET_CATEGORY_DELETE',

  BUDGET_PROGRAM_CREATE: 'BUDGET_PROGRAM_CREATE',
  BUDGET_PROGRAM_UPDATE: 'BUDGET_PROGRAM_UPDATE',
  BUDGET_PROGRAM_DELETE: 'BUDGET_PROGRAM_DELETE',

  ALLOCATION_CREATE: 'ALLOCATION_CREATE',
  ALLOCATION_UPDATE: 'ALLOCATION_UPDATE',
  ALLOCATION_DELETE: 'ALLOCATION_DELETE',
  ALLOCATION_STATUS_CHANGE: 'ALLOCATION_STATUS_CHANGE',
  ALLOCATION_SUBMIT: 'ALLOCATION_SUBMIT',
  ALLOCATION_APPROVE: 'ALLOCATION_APPROVE',
  ALLOCATION_REJECT: 'ALLOCATION_REJECT',
  ALLOCATION_RETURN: 'ALLOCATION_RETURN',

  BLOCKCHAIN_RECORD: 'BLOCKCHAIN_RECORD',
  BLOCKCHAIN_VERIFY: 'BLOCKCHAIN_VERIFY',
  BLOCKCHAIN_RETRY: 'BLOCKCHAIN_RETRY',

  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  DOCUMENT_UPDATE: 'DOCUMENT_UPDATE',
  DOCUMENT_REPLACE: 'DOCUMENT_REPLACE',
  DOCUMENT_ARCHIVE: 'DOCUMENT_ARCHIVE',
  DOCUMENT_VERIFY: 'DOCUMENT_VERIFY',
  DOCUMENT_ANCHOR_RETRY: 'DOCUMENT_ANCHOR_RETRY',
} as const;

export type AuditActionValue = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ACTION_LIST: Array<{ value: string; label: string }> = [
  { value: AUDIT_ACTIONS.AUTH_LOGIN, label: 'User Login' },
  { value: AUDIT_ACTIONS.AUTH_LOGOUT, label: 'User Logout' },
  { value: AUDIT_ACTIONS.AUTH_REFRESH_TOKEN, label: 'Token Refresh' },
  { value: AUDIT_ACTIONS.USER_CREATE, label: 'User Created' },
  { value: AUDIT_ACTIONS.USER_UPDATE, label: 'User Updated' },
  { value: AUDIT_ACTIONS.USER_DELETE, label: 'User Deleted' },
  { value: AUDIT_ACTIONS.USER_ROLE_CHANGE, label: 'User Role Changed' },
  { value: AUDIT_ACTIONS.USER_STATUS_CHANGE, label: 'User Status Changed' },
  { value: AUDIT_ACTIONS.FISCAL_YEAR_CREATE, label: 'Fiscal Year Created' },
  { value: AUDIT_ACTIONS.FISCAL_YEAR_UPDATE, label: 'Fiscal Year Updated' },
  { value: AUDIT_ACTIONS.FISCAL_YEAR_DELETE, label: 'Fiscal Year Deleted' },
  { value: AUDIT_ACTIONS.FISCAL_YEAR_ACTIVATE, label: 'Fiscal Year Activated' },
  { value: AUDIT_ACTIONS.FUND_SOURCE_CREATE, label: 'Fund Source Created' },
  { value: AUDIT_ACTIONS.FUND_SOURCE_UPDATE, label: 'Fund Source Updated' },
  { value: AUDIT_ACTIONS.FUND_SOURCE_DELETE, label: 'Fund Source Deleted' },
  { value: AUDIT_ACTIONS.DEPARTMENT_CREATE, label: 'Department Created' },
  { value: AUDIT_ACTIONS.DEPARTMENT_UPDATE, label: 'Department Updated' },
  { value: AUDIT_ACTIONS.DEPARTMENT_DELETE, label: 'Department Deleted' },
  { value: AUDIT_ACTIONS.BUDGET_CATEGORY_CREATE, label: 'Budget Category Created' },
  { value: AUDIT_ACTIONS.BUDGET_CATEGORY_UPDATE, label: 'Budget Category Updated' },
  { value: AUDIT_ACTIONS.BUDGET_CATEGORY_DELETE, label: 'Budget Category Deleted' },
  { value: AUDIT_ACTIONS.BUDGET_PROGRAM_CREATE, label: 'Budget Program Created' },
  { value: AUDIT_ACTIONS.BUDGET_PROGRAM_UPDATE, label: 'Budget Program Updated' },
  { value: AUDIT_ACTIONS.BUDGET_PROGRAM_DELETE, label: 'Budget Program Deleted' },
  { value: AUDIT_ACTIONS.ALLOCATION_CREATE, label: 'Allocation Created' },
  { value: AUDIT_ACTIONS.ALLOCATION_UPDATE, label: 'Allocation Updated' },
  { value: AUDIT_ACTIONS.ALLOCATION_DELETE, label: 'Allocation Deleted' },
  { value: AUDIT_ACTIONS.ALLOCATION_STATUS_CHANGE, label: 'Allocation Status Changed' },
  { value: AUDIT_ACTIONS.ALLOCATION_SUBMIT, label: 'Allocation Submitted' },
  { value: AUDIT_ACTIONS.ALLOCATION_APPROVE, label: 'Allocation Approved' },
  { value: AUDIT_ACTIONS.ALLOCATION_REJECT, label: 'Allocation Rejected' },
  { value: AUDIT_ACTIONS.ALLOCATION_RETURN, label: 'Allocation Returned' },
  { value: AUDIT_ACTIONS.BLOCKCHAIN_RECORD, label: 'Blockchain Record' },
  { value: AUDIT_ACTIONS.BLOCKCHAIN_VERIFY, label: 'Blockchain Verify' },
  { value: AUDIT_ACTIONS.BLOCKCHAIN_RETRY, label: 'Blockchain Retry' },
  { value: AUDIT_ACTIONS.DOCUMENT_UPLOAD, label: 'Document Uploaded' },
  { value: AUDIT_ACTIONS.DOCUMENT_UPDATE, label: 'Document Updated' },
  { value: AUDIT_ACTIONS.DOCUMENT_REPLACE, label: 'Document Replaced' },
  { value: AUDIT_ACTIONS.DOCUMENT_ARCHIVE, label: 'Document Archived' },
  { value: AUDIT_ACTIONS.DOCUMENT_VERIFY, label: 'Document Verified' },
  { value: AUDIT_ACTIONS.DOCUMENT_ANCHOR_RETRY, label: 'Document Anchor Retry' },
];

export const AUDIT_ACTION_LABELS: Record<string, string> = Object.fromEntries(
  AUDIT_ACTION_LIST.map((entry) => [entry.value, entry.label])
);
