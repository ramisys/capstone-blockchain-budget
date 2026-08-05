/**
 * Document type values used throughout the Document Management module.
 * These mirror the `DocumentType` Prisma enum.
 */
export const DOCUMENT_TYPES = {
  PURCHASE_REQUEST: 'PurchaseRequest',
  PURCHASE_ORDER: 'PurchaseOrder',
  QUOTATION: 'Quotation',
  RECEIPT: 'Receipt',
  INVOICE: 'Invoice',
  DISBURSEMENT_VOUCHER: 'DisbursementVoucher',
  LIQUIDATION_REPORT: 'LiquidationReport',
  BUDGET_PROPOSAL: 'BudgetProposal',
  CONTRACT: 'Contract',
  OTHER: 'Other',
};

export const DOCUMENT_TYPES_LIST = Object.values(DOCUMENT_TYPES);

/**
 * Human-readable labels for document types, used by the UI.
 */
export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.PURCHASE_REQUEST]: 'Purchase Request',
  [DOCUMENT_TYPES.PURCHASE_ORDER]: 'Purchase Order',
  [DOCUMENT_TYPES.QUOTATION]: 'Quotation',
  [DOCUMENT_TYPES.RECEIPT]: 'Receipt',
  [DOCUMENT_TYPES.INVOICE]: 'Invoice',
  [DOCUMENT_TYPES.DISBURSEMENT_VOUCHER]: 'Disbursement Voucher',
  [DOCUMENT_TYPES.LIQUIDATION_REPORT]: 'Liquidation Report',
  [DOCUMENT_TYPES.BUDGET_PROPOSAL]: 'Budget Proposal',
  [DOCUMENT_TYPES.CONTRACT]: 'Contract',
  [DOCUMENT_TYPES.OTHER]: 'Other Supporting Document',
};
