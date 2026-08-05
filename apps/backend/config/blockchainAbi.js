/**
 * BudgetLedger contract ABI.
 *
 * Mirrors `apps/contracts/contracts/BudgetLedger.sol`. Kept static here so the
 * backend can talk to the ledger without requiring a Hardhat deployment
 * artifact on disk.
 */
export const BUDGET_LEDGER_ABI = [
  {
    type: 'function',
    name: 'record',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'contentHash', type: 'bytes32' }],
    outputs: [{ name: 'recordIndex', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'verify',
    stateMutability: 'view',
    inputs: [{ name: 'contentHash', type: 'bytes32' }],
    outputs: [
      { name: 'exists', type: 'bool' },
      { name: 'anchoredBy', type: 'address' },
      { name: 'anchoredAt', type: 'uint256' },
      { name: 'blockNumber', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getRecord',
    stateMutability: 'view',
    inputs: [{ name: 'contentHash', type: 'bytes32' }],
    outputs: [
      { name: 'contentHash', type: 'bytes32' },
      { name: 'anchoredBy', type: 'address' },
      { name: 'anchoredAt', type: 'uint256' },
      { name: 'blockNumber', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'recordCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Recorded',
    inputs: [
      { name: 'contentHash', type: 'bytes32', indexed: true },
      { name: 'anchoredBy', type: 'address', indexed: true },
      { name: 'blockNumber', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'error',
    name: 'HashAlreadyRecorded',
    inputs: [{ name: 'contentHash', type: 'bytes32' }],
  },
  {
    type: 'error',
    name: 'NotOwner',
    inputs: [],
  },
];

/**
 * AuditLedger contract ABI.
 *
 * Mirrors `apps/contracts/contracts/AuditLedger.sol`. Kept static here so the
 * backend can talk to the audit ledger without requiring a Hardhat deployment
 * artifact on disk. Includes only what the backend uses: recordEvent,
 * verifyEvent, owner, totalEvents, plus the EventRecorded event and errors.
 */
export const AUDIT_LEDGER_ABI = [
  {
    type: 'function',
    name: 'recordEvent',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'eventHash', type: 'bytes32' },
      { name: 'category', type: 'string' },
    ],
    outputs: [{ name: 'eventCountAfter', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'verifyEvent',
    stateMutability: 'view',
    inputs: [{ name: 'eventHash', type: 'bytes32' }],
    outputs: [
      { name: 'exists', type: 'bool' },
      { name: 'category', type: 'string' },
      { name: 'anchoredBy', type: 'address' },
      { name: 'anchoredAt', type: 'uint256' },
      { name: 'blockNumber', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getAuditEvent',
    stateMutability: 'view',
    inputs: [{ name: 'eventHash', type: 'bytes32' }],
    outputs: [
      {
        name: 'ev',
        type: 'tuple',
        components: [
          { name: 'eventHash', type: 'bytes32' },
          { name: 'category', type: 'string' },
          { name: 'anchoredBy', type: 'address' },
          { name: 'anchoredAt', type: 'uint256' },
          { name: 'blockNumber', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'eventCount',
    stateMutability: 'view',
    inputs: [{ name: 'category', type: 'string' }],
    outputs: [{ name: 'count', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalEvents',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'EventRecorded',
    inputs: [
      { name: 'eventHash', type: 'bytes32', indexed: true },
      { name: 'category', type: 'string', indexed: true },
      { name: 'anchoredBy', type: 'address', indexed: true },
      { name: 'blockNumber', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'error',
    name: 'EventAlreadyRecorded',
    inputs: [{ name: 'eventHash', type: 'bytes32' }],
  },
  {
    type: 'error',
    name: 'InvalidCategory',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotOwner',
    inputs: [],
  },
];
