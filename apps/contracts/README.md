# Smart Contracts

Smart contracts for the Blockchain-Based Budget Allocation and Expense Monitoring System.

## Contract

- `contracts/BudgetLedger.sol` — immutable, tamper-evident registry. The backend anchors
  each budget allocation by writing its SHA-256 content hash to the ledger. `verify` returns
  `exists = false` for a hash that no longer matches an anchored record.

## Toolchain

Uses Hardhat + ethers v6 (`@nomicfoundation/hardhat-toolbox`).

## Commands (run from repo root)

| Command | Description |
|---------|-------------|
| `npm run blockchain:compile` | Compile contracts |
| `npm run blockchain:node` | Start a local Hardhat node (JSON-RPC on `http://127.0.0.1:8545`) |
| `npm run blockchain:deploy` | Deploy to the local node and write `deployments/contracts.json` (requires the node to be running) |
| `npm test --workspace=apps/contracts` | Run the Hardhat contract test suite |

## Deployment

1. Terminal 1: `npm run blockchain:node`
2. Terminal 2: `npm run blockchain:deploy`

The deployment address is written to `apps/contracts/deployments/contracts.json`
(gitignored). The backend reads this file (or `BLOCKCHAIN_CONTRACT_ADDRESS` in
`apps/backend/.env`) to connect.
