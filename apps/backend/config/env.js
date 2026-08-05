import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

// Fail fast instead of falling back to a known/weak secret, which would let
// attackers forge tokens. Require a strong, unique secret in every environment.
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET must be set to a cryptographically random value of at least 32 characters. ' +
      'See apps/backend/.env.example for guidance.'
  );
}

/**
 * Validate blockchain configuration parameters at startup when set.
 */
function validateBlockchainEnv() {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
  if (rpcUrl) {
    try {
      const parsed = new URL(rpcUrl);
      if (!['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)) {
        throw new Error(`Invalid protocol '${parsed.protocol}'`);
      }
    } catch (err) {
      throw new Error(`BLOCKCHAIN_RPC_URL must be a valid URL (${err.message}).`);
    }
  }

  const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
  if (contractAddress && !/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) {
    throw new Error('BLOCKCHAIN_CONTRACT_ADDRESS must be a valid 20-byte hex Ethereum address (0x...).');
  }

  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  if (privateKey && !/^0x[0-9a-fA-F]{64}$|^[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error('BLOCKCHAIN_PRIVATE_KEY must be a valid 32-byte hex private key (64 hex characters).');
  }

  const explorerUrl = process.env.BLOCKCHAIN_EXPLORER_URL;
  if (explorerUrl) {
    try {
      new URL(explorerUrl);
    } catch {
      throw new Error('BLOCKCHAIN_EXPLORER_URL must be a valid URL.');
    }
  }
}

validateBlockchainEnv();

/**
 * Validate storage configuration parameters at startup when set.
 */
function validateStorageEnv() {
  const driver = process.env.STORAGE_DRIVER || 'local';
  if (!['local', 's3'].includes(driver)) {
    throw new Error(`STORAGE_DRIVER must be either 'local' or 's3' (got '${driver}').`);
  }

  const maxFileSizeBytes = parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 25 * 1024 * 1024;
  if (maxFileSizeBytes <= 0) {
    throw new Error('MAX_FILE_SIZE_BYTES must be a positive integer.');
  }

  const maxVersions = parseInt(process.env.MAX_DOCUMENT_VERSIONS, 10) || 50;
  if (maxVersions <= 0) {
    throw new Error('MAX_DOCUMENT_VERSIONS must be a positive integer.');
  }
}

validateStorageEnv();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'budgetchain-api',
    audience: process.env.JWT_AUDIENCE || 'budgetchain-web',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    loginWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5,
    sensitiveWindowMs: parseInt(process.env.SENSITIVE_RATE_LIMIT_WINDOW_MS, 10) || 60 * 60 * 1000,
    sensitiveMax: parseInt(process.env.SENSITIVE_RATE_LIMIT_MAX, 10) || 10,
  },
  blockchain: {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || null,
    network: process.env.BLOCKCHAIN_NETWORK || 'unknown',
    chainId: process.env.BLOCKCHAIN_CHAIN_ID
      ? parseInt(process.env.BLOCKCHAIN_CHAIN_ID, 10)
      : null,
    contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || null,
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || null,
    rpcTimeoutMs: parseInt(process.env.BLOCKCHAIN_RPC_TIMEOUT_MS, 10) || 5000,
    explorerUrl: process.env.BLOCKCHAIN_EXPLORER_URL || null,
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    root: process.env.STORAGE_ROOT || 'storage/documents',
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 25 * 1024 * 1024,
    maxVersions: parseInt(process.env.MAX_DOCUMENT_VERSIONS, 10) || 50,
  },
};
