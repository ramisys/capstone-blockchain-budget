import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ethers } from 'ethers';
import { config } from './env.js';
import { BUDGET_LEDGER_ABI, AUDIT_LEDGER_ABI } from './blockchainAbi.js';

/**
 * Path to the deployment artifact written by the Hardhat deploy script
 * (`npm run blockchain:deploy`). The backend falls back to this file when
 * BLOCKCHAIN_CONTRACT_ADDRESS is not set.
 */
const DEPLOYMENT_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
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
 * Read the AuditLedger contract address from the Hardhat deployment artifact,
 * if present.
 *
 * @returns {string|null} Audit ledger contract address or null
 */
function readDeployedAuditLedgerAddress() {
  try {
    if (!fs.existsSync(DEPLOYMENT_FILE)) return null;
    const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf8'));
    return typeof deployment?.auditLedgerAddress === 'string'
      ? deployment.auditLedgerAddress
      : null;
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
    this._auditContract = null;
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
   * Whether the audit ledger is fully configured (RPC URL + audit contract address).
   *
   * @returns {boolean}
   */
  isAuditConfigured() {
    return Boolean(config.blockchain.rpcUrl && this.getAuditLedgerAddress());
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
   * Resolve the AuditLedger contract address from env, falling back to the
   * deployment file.
   *
   * @returns {string|null}
   */
  getAuditLedgerAddress() {
    return config.blockchain.auditLedgerAddress || readDeployedAuditLedgerAddress();
  }

  /**
   * Return a block explorer URL for a given transaction hash, or null if unconfigured.
   *
   * @param {string|null} txHash
   * @returns {string|null}
   */
  getExplorerTxUrl(txHash) {
    if (!txHash || !config.blockchain.explorerUrl) return null;
    const base = config.blockchain.explorerUrl.replace(/\/+$/, '');
    return `${base}/tx/${txHash}`;
  }

  /**
   * Return a block explorer URL for a contract or account address, or null if unconfigured.
   *
   * @param {string|null} address
   * @returns {string|null}
   */
  getExplorerAddressUrl(address) {
    if (!address || !config.blockchain.explorerUrl) return null;
    const base = config.blockchain.explorerUrl.replace(/\/+$/, '');
    return `${base}/address/${address}`;
  }

  /**
   * Lazily initialize the shared ethers provider and wallet (used by both the
   * budget ledger and the audit ledger). Cached across calls.
   *
   * @private
   * @returns {Object} { provider, signer }
   */
  _loadBase() {
    if (this._provider) {
      return { provider: this._provider, signer: this._signer };
    }

    if (!config.blockchain.rpcUrl) {
      throw new Error('BLOCKCHAIN_RPC_URL is not configured');
    }

    const fetchReq = new ethers.FetchRequest(config.blockchain.rpcUrl);
    if (config.blockchain.rpcTimeoutMs) {
      fetchReq.timeout = config.blockchain.rpcTimeoutMs;
    }

    const provider = new ethers.JsonRpcProvider(
      fetchReq,
      config.blockchain.chainId ? Number(config.blockchain.chainId) : undefined
    );

    let signer = null;
    if (config.blockchain.privateKey) {
      signer = new ethers.Wallet(config.blockchain.privateKey, provider);
    }

    this._provider = provider;
    this._signer = signer;
    return { provider, signer };
  }

  /**
   * Lazily initialize the ethers provider, wallet, and BudgetLedger contract.
   *
   * @private
   * @returns {Object} { provider, signer, contract }
   */
  _load() {
    if (this._contract) {
      return { provider: this._provider, signer: this._signer, contract: this._contract };
    }

    const { provider, signer } = this._loadBase();

    const contractAddress = this.getContractAddress();
    if (!contractAddress) {
      throw new Error('BudgetLedger contract address is not configured');
    }

    const contract = new ethers.Contract(contractAddress, BUDGET_LEDGER_ABI, signer || provider);

    this._contract = contract;
    return { provider, signer, contract };
  }

  /**
   * Lazily initialize the ethers provider, wallet, and AuditLedger contract.
   *
   * Reuses the same provider/signer as the budget ledger (they share the RPC
   * URL and signing key); only the contract instance differs, and it does not
   * depend on the BudgetLedger address being configured. Reads are possible
   * whenever an RPC URL is configured; writes need a signer.
   *
   * @private
   * @returns {Object} { provider, signer, contract }
   */
  _loadAudit() {
    if (this._auditContract) {
      return { provider: this._provider, signer: this._signer, contract: this._auditContract };
    }

    const auditLedgerAddress = this.getAuditLedgerAddress();
    if (!auditLedgerAddress) {
      throw new Error('AuditLedger contract address is not configured');
    }

    const { provider, signer } = this._loadBase();

    const contract = new ethers.Contract(auditLedgerAddress, AUDIT_LEDGER_ABI, signer || provider);

    this._auditContract = contract;
    return { provider, signer, contract };
  }

  /**
   * Reset the cached provider/contract instances (used in tests).
   */
  _reset() {
    this._provider = null;
    this._signer = null;
    this._contract = null;
    this._auditContract = null;
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
   * Anchor an audit event hash on the AuditLedger contract. Throws when
   * unconfigured or when the node rejects the transaction.
   *
   * @param {string} eventHash - Hex-encoded 32-byte event hash (e.g. SHA-256)
   * @param {string} category - Non-empty event category (e.g. the audit action)
   * @returns {Promise<{txHash: string, blockNumber: number}>} Confirmation
   */
  async auditRecord(eventHash, category) {
    const { contract, provider } = this._loadAudit();
    if (!this.hasSigner()) {
      throw new Error('BLOCKCHAIN_PRIVATE_KEY is not configured; cannot submit ledger transactions');
    }

    const tx = await contract.recordEvent(eventHash, category);
    const receipt = await tx.wait();
    const blockNumber = receipt?.blockNumber ?? (await provider.getBlockNumber());

    this._lastSync = new Date();
    return { txHash: receipt.hash, blockNumber: Number(blockNumber) };
  }

  /**
   * Check whether an audit event hash is anchored on the AuditLedger contract.
   *
   * @param {string} eventHash - Hex-encoded 32-byte event hash
   * @returns {Promise<{exists: boolean, category: string, anchoredBy: string, anchoredAt: number, blockNumber: number}>}
   */
  async auditVerify(eventHash) {
    const { contract } = this._loadAudit();
    const [exists, category, anchoredBy, anchoredAt, blockNumber] = await contract.verifyEvent(
      eventHash
    );
    return {
      exists,
      category,
      anchoredBy,
      anchoredAt: Number(anchoredAt),
      blockNumber: Number(blockNumber),
    };
  }

  /**
   * Fetch the current on-chain audit event count.
   *
   * @returns {Promise<number>}
   */
  async getAuditEventCount() {
    const { contract } = this._loadAudit();
    const count = await contract.totalEvents();
    return Number(count);
  }

  /**
   * Probe connectivity and report the AuditLedger status without throwing.
   * Never used to decide critical behavior, only for the status dashboard.
   *
   * @returns {Promise<Object>} Audit ledger status summary
   */
  async getAuditLedgerStatus() {
    if (!this.isAuditConfigured()) {
      return {
        configured: false,
        connected: false,
        auditLedgerAddress: null,
        totalEvents: null,
        explorerUrl: config.blockchain.explorerUrl,
        contractExplorerUrl: null,
        message: 'Audit ledger integration is not yet configured.',
      };
    }

    try {
      const { provider } = this._loadAudit();
      await provider.getNetwork();
      const totalEvents = await this.getAuditEventCount().catch(() => null);
      const auditLedgerAddress = this.getAuditLedgerAddress();

      return {
        configured: true,
        connected: true,
        auditLedgerAddress,
        totalEvents,
        explorerUrl: config.blockchain.explorerUrl,
        contractExplorerUrl: this.getExplorerAddressUrl(auditLedgerAddress),
        message: 'Audit ledger is connected.',
      };
    } catch (error) {
      return {
        configured: true,
        connected: false,
        auditLedgerAddress: this.getAuditLedgerAddress(),
        totalEvents: null,
        explorerUrl: config.blockchain.explorerUrl,
        contractExplorerUrl: this.getExplorerAddressUrl(this.getAuditLedgerAddress()),
        message: `Audit ledger node is unreachable: ${error?.message || String(error)}`,
      };
    }
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
        explorerUrl: config.blockchain.explorerUrl,
        contractExplorerUrl: null,
        message: 'Blockchain integration is not yet configured.',
      };
    }

    try {
      const { provider } = this._load();
      const network = await provider.getNetwork();
      const latestBlock = await provider.getBlockNumber();
      const onChainCount = await this.getRecordCount().catch(() => null);
      const contractAddress = this.getContractAddress();

      return {
        connected: true,
        network: config.blockchain.network || network.name,
        chainId: Number(network.chainId),
        latestBlock,
        lastSync: this._lastSync ? this._lastSync.toISOString() : null,
        contractAddress,
        explorerUrl: config.blockchain.explorerUrl,
        contractExplorerUrl: this.getExplorerAddressUrl(contractAddress),
        onChainCount,
        message: 'Blockchain ledger is connected.',
      };
    } catch (error) {
      const contractAddress = this.getContractAddress();
      return {
        connected: false,
        network: config.blockchain.network || NETWORK_LABEL || null,
        chainId: config.blockchain.chainId,
        latestBlock: null,
        lastSync: this._lastSync ? this._lastSync.toISOString() : null,
        contractAddress,
        explorerUrl: config.blockchain.explorerUrl,
        contractExplorerUrl: this.getExplorerAddressUrl(contractAddress),
        message: `Blockchain node is unreachable: ${error?.message || String(error)}`,
      };
    }
  }
}

export const blockchainProvider = new BlockchainProvider();
