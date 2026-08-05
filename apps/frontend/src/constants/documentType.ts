/**
 * Document type definitions.
 *
 * Mirrors the backend `DocumentType` enum. Values are used verbatim in API
 * requests/responses while `DOCUMENT_TYPE_LABELS` provides human-readable
 * labels for the UI.
 */

export const DOCUMENT_TYPE = {
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
} as const;

export type DocumentTypeValue = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];

export const DOCUMENT_TYPE_LIST = [
  DOCUMENT_TYPE.PURCHASE_REQUEST,
  DOCUMENT_TYPE.PURCHASE_ORDER,
  DOCUMENT_TYPE.QUOTATION,
  DOCUMENT_TYPE.RECEIPT,
  DOCUMENT_TYPE.INVOICE,
  DOCUMENT_TYPE.DISBURSEMENT_VOUCHER,
  DOCUMENT_TYPE.LIQUIDATION_REPORT,
  DOCUMENT_TYPE.BUDGET_PROPOSAL,
  DOCUMENT_TYPE.CONTRACT,
  DOCUMENT_TYPE.OTHER,
];

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPE.PURCHASE_REQUEST]: 'Purchase Request',
  [DOCUMENT_TYPE.PURCHASE_ORDER]: 'Purchase Order',
  [DOCUMENT_TYPE.QUOTATION]: 'Quotation',
  [DOCUMENT_TYPE.RECEIPT]: 'Receipt',
  [DOCUMENT_TYPE.INVOICE]: 'Invoice',
  [DOCUMENT_TYPE.DISBURSEMENT_VOUCHER]: 'Disbursement Voucher',
  [DOCUMENT_TYPE.LIQUIDATION_REPORT]: 'Liquidation Report',
  [DOCUMENT_TYPE.BUDGET_PROPOSAL]: 'Budget Proposal',
  [DOCUMENT_TYPE.CONTRACT]: 'Contract',
  [DOCUMENT_TYPE.OTHER]: 'Other Supporting Document',
};
