import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ethers } from 'ethers';
import { config } from './env.js';
import { BUDGET_LEDGER_ABI } from './blockchainAbi.js';

/**
 * Path to the deployment artifact written by the Hardhat deploy script
 * (`npm run blockchain:deploy`). The backend falls back to this file when
 * BLOCKCHAIN_CONTRACT_ADDRESS is not set.
 */
const DEPLOYMENT_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'contracts',
  'deployments',
  'contracts.json'
);

const NETWORK_LABEL = config.blockchain.network;

/**
 * Read the contract address from the Hardhat deployment artifact, if present.
 *
 * @returns {string|null} Contract address or null
 */
function readDeployedContractAddress() {
  try {
    if (!fs.existsSync(DEPLOYMENT_FILE)) return null;
    const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf8'));
    return typeof deployment?.address === 'string' ? deployment.address : null;
  } catch {
    return null;
  }
}

/**
 * EVM adapter for the BudgetLedger contract.
 *
 * Lazily builds an ethers provider / wallet / contract on first use and caches
 * them. Reads are always possible when an RPC URL is configured; writes need a
 * signer (BLOCKCHAIN_PRIVATE_KEY). When the node is unreachable the exposed
 * methods throw, and the service layer decides how to fail gracefully.
 */
class BlockchainProvider {
  constructor() {
    this._provider = null;
    this._signer = null;
    this._contract = null;
    this._lastSync = null;
  }

  /**
   * Whether the ledger is fully configured (RPC URL + contract address).
   *
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(config.blockchain.rpcUrl && this.getContractAddress());
  }

  /**
   * Whether a signing key is available for submitting transactions.
   *
   * @returns {boolean}
   */
  hasSigner() {
    return Boolean(config.blockchain.privateKey);
  }

  /**
   * Resolve the contract address from env, falling back to the deployment file.
   *
   * @returns {string|null}
   */
  getContractAddress() {
    return config.blockchain.contractAddress || readDeployedContractAddress();
  }

  /**
   * Lazily initialize the ethers provider, wallet, and contract.
   *
   * @private
   * @returns {Object} { provider, signer, contract }
   */
  _load() {
    if (this._contract) {
      return { provider: this._provider, signer: this._signer, contract: this._contract };
    }

    if (!config.blockchain.rpcUrl) {
      throw new Error('BLOCKCHAIN_RPC_URL is not configured');
    }

    const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    const contractAddress = this.getContractAddress();
    if (!contractAddress) {
      throw new Error('BudgetLedger contract address is not configured');
    }

    let signer = null;
    if (config.blockchain.privateKey) {
      signer = new ethers.Wallet(config.blockchain.privateKey, provider);
    }

    const contract = new ethers.Contract(contractAddress, BUDGET_LEDGER_ABI, signer || provider);

    this._provider = provider;
    this._signer = signer;
    this._contract = contract;
    return { provider, signer, contract };
  }

  /**
   * Reset the cached provider/contract instances (used in tests).
   */
  _reset() {
    this._provider = null;
    this._signer = null;
    this._contract = null;
    this._lastSync = null;
  }

  /**
   * Anchor a content hash on the ledger. Throws when unconfigured or when the
   * node rejects the transaction.
   *
   * @param {string} contentHash - Hex-encoded 32-byte hash (e.g. SHA-256)
   * @returns {Promise<{txHash: string, blockNumber: number}>} Confirmation
   */
  async record(contentHash) {
    const { contract, provider } = this._load();
    if (!this.hasSigner()) {
      throw new Error('BLOCKCHAIN_PRIVATE_KEY is not configured; cannot submit ledger transactions');
    }

    const tx = await contract.record(contentHash);
    const receipt = await tx.wait();
    const blockNumber = receipt?.blockNumber ?? (await provider.getBlockNumber());

    this._lastSync = new Date();
    return { txHash: receipt.hash, blockNumber: Number(blockNumber) };
  }

  /**
   * Check whether a content hash is anchored on the ledger.
   *
   * @param {string} contentHash - Hex-encoded 32-byte hash
   * @returns {Promise<{exists: boolean, anchoredBy: string, anchoredAt: number, blockNumber: number}>}
   */
  async verify(contentHash) {
    const { contract } = this._load();
    const [exists, anchoredBy, anchoredAt, blockNumber] = await contract.verify(contentHash);
    return {
      exists,
      anchoredBy,
      anchoredAt: Number(anchoredAt),
      blockNumber: Number(blockNumber),
    };
  }

  /**
   * Fetch the current on-chain ledger record count.
   *
   * @returns {Promise<number>}
   */
  async getRecordCount() {
    const { contract } = this._load();
    const count = await contract.recordCount();
    return Number(count);
  }

  /**
   * Probe connectivity and report network status without throwing. Never used
   * to decide critical behavior, only for the status dashboard.
   *
   * @returns {Promise<Object>} Blockchain status summary
   */
  async getStatus() {
    if (!this.isConfigured()) {
      return {
        connected: false,
        network: null,
        chainId: null,
        latestBlock: null,
        lastSync: null,
        contractAddress: null,
        message: 'Blockchain integration is not yet configured.',
      };
    }

    try {
      const { provider } = this._load();
      const network = await provider.getNetwork();
      const latestBlock = await provider.getBlockNumber();
      const onChainCount = await this.getRecordCount().catch(() => null);

      return {
        connected: true,
        network: config.blockchain.network || network.name,
        chainId: Number(network.chainId),
        latestBlock,
        lastSync: this._lastSync ? this._lastSync.toISOString() : null,
        contractAddress: this.getContractAddress(),
        onChainCount,
        message: 'Blockchain ledger is connected.',
      };
    } catch (error) {
      return {
        connected: false,
        network: config.blockchain.network || NETWORK_LABEL || null,
        chainId: config.blockchain.chainId,
        latestBlock: null,
        lastSync: this._lastSync ? this._lastSync.toISOString() : null,
        contractAddress: this.getContractAddress(),
        message: `Blockchain node is unreachable: ${error?.message || String(error)}`,
      };
    }
  }
}

export const blockchainProvider = new BlockchainProvider();
