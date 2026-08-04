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
    name: 'HashNotRecorded',
    inputs: [{ name: 'contentHash', type: 'bytes32' }],
  },
  {
    type: 'error',
    name: 'NotOwner',
    inputs: [],
  },
];
