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
  },
};
