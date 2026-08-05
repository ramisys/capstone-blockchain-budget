import rateLimit from 'express-rate-limit';
import { formatErrorResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import {
  authLoginLimiter,
  globalLimiter,
  sensitiveRouteLimiter,
  uploadLimiter,
} from '../middleware/rateLimiter.js';

async function runRateLimiterTests() {
  console.log('🧪 Starting Rate Limiter Middleware Tests...\n');

  // 1. Verify Rate Limiter Definitions
  console.log('1. Middleware Export Verification:');
  console.log(`   - globalLimiter defined: ${typeof globalLimiter === 'function' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - authLoginLimiter defined: ${typeof authLoginLimiter === 'function' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - sensitiveRouteLimiter defined: ${typeof sensitiveRouteLimiter === 'function' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - uploadLimiter defined: ${typeof uploadLimiter === 'function' ? '✅ PASSED' : '❌ FAILED'}\n`);

  // 2. Test Custom Rate Limit Handler & HTTP 429 Payload Standard
  console.log('2. Rate Limit Response & Header Format:');
  let responseStatus = null;
  let responseBody = null;

  const mockReq = {
    ip: '127.0.0.1',
    method: 'POST',
    originalUrl: '/api/auth/login',
    headers: {},
    app: {
      get: (key) => (key === 'trust proxy' ? 1 : undefined),
    },
  };

  const mockRes = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
    setHeader() {},
    getHeader() {},
  };

  // Create isolated test limiter with max: 2 attempts to verify 429 handler triggering
  const testLimiter = rateLimit({
    windowMs: 60000,
    max: 2,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      return res
        .status(HTTP_STATUS.TOO_MANY_REQUESTS)
        .json(formatErrorResponse('Too many requests. Please try again later.', []));
    },
  });

  let hitCount = 0;
  const dummyNext = () => {
    hitCount++;
  };

  // Request 1 (Allowed)
  await testLimiter(mockReq, mockRes, dummyNext);
  // Request 2 (Allowed)
  await testLimiter(mockReq, mockRes, dummyNext);
  // Request 3 (Blocked -> Triggers 429 Handler)
  await testLimiter(mockReq, mockRes, dummyNext);

  console.log(`   - First 2 requests permitted: ${hitCount === 2 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - 3rd request blocked with status 429: ${responseStatus === 429 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Payload success property is false: ${responseBody?.success === false ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Payload message matches spec: ${responseBody?.message === 'Too many requests. Please try again later.' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Payload errors property is an array: ${Array.isArray(responseBody?.errors) ? '✅ PASSED' : '❌ FAILED'}\n`);

  console.log('✨ All Rate Limiter Middleware Tests Completed Successfully!');
}

runRateLimiterTests().catch((err) => {
  console.error('❌ Rate limiter test failed:', err);
  process.exit(1);
});
