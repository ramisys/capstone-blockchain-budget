export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  TREASURER: 'Treasurer',
  BUDGET_OFFICER: 'BudgetOfficer',
  AUDITOR: 'Auditor',
} as const;

export type RoleValue = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS = {
  [ROLES.ADMINISTRATOR]: 'Administrator',
  [ROLES.TREASURER]: 'Treasurer',
  [ROLES.BUDGET_OFFICER]: 'Budget Officer',
  [ROLES.AUDITOR]: 'Auditor',
};
