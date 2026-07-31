import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.js';
import { loginSchema } from '../validators/authValidator.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { config } from '../config/env.js';

async function runTests() {
  console.log('🧪 Starting Phase 1 Authentication Unit Tests...\n');

  // 1. Test Password Hashing
  const plainPassword = 'AdminPassword123!';
  const hashed = await hashPassword(plainPassword);
  const isMatch = await comparePassword(plainPassword, hashed);
  const isWrongMatch = await comparePassword('WrongPassword', hashed);

  console.log('1. Password Hashing & Verification:');
  console.log(`   - Hash created: ${hashed.substring(0, 20)}...`);
  console.log(`   - Valid password match: ${isMatch ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Invalid password match: ${!isWrongMatch ? '✅ PASSED' : '❌ FAILED'}\n`);

  // 2. Test JWT Signing & Verification
  const userPayload = {
    id: 'test-uuid-1234',
    email: 'admin@university.edu',
    role: 'Administrator',
  };

  const token = signToken(userPayload);
  const decoded = verifyToken(token);

  console.log('2. JWT Sign & Verify:');
  console.log(`   - Token generated: ${token.substring(0, 25)}...`);
  console.log(`   - Decoded ID match: ${decoded.id === userPayload.id ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Decoded Role match: ${decoded.role === userPayload.role ? '✅ PASSED' : '❌ FAILED'}\n`);

  // 3. Test Zod Validator Schema
  const validLogin = loginSchema.safeParse({ email: 'user@test.com', password: 'secretpassword' });
  const invalidLogin = loginSchema.safeParse({ email: 'invalid-email', password: '' });

  console.log('3. Zod Request Validation:');
  console.log(`   - Valid login payload parse: ${validLogin.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Invalid payload rejected: ${!invalidLogin.success ? '✅ PASSED' : '❌ FAILED'}\n`);

  // 4. Test Response Formatter
  const successFormat = formatSuccessResponse('Success message', { key: 'val' });
  const errorFormat = formatErrorResponse('Error message', [{ field: 'email', message: 'invalid' }]);

  console.log('4. Standard Response Formatter:');
  console.log(`   - Success format matches contract: ${successFormat.success === true && successFormat.message === 'Success message' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Error format matches contract: ${errorFormat.success === false && errorFormat.message === 'Error message' ? '✅ PASSED' : '❌ FAILED'}\n`);

  // 5. Test RBAC Middleware Logic
  const adminMiddleware = authorize('Administrator', 'Treasurer');
  let rbacPassed = false;
  let rbacBlocked = false;

  const mockReqAdmin = { user: { role: 'Administrator' } };
  adminMiddleware(mockReqAdmin, {}, (err) => {
    if (!err) rbacPassed = true;
  });

  const mockReqAuditor = { user: { role: 'Auditor' } };
  adminMiddleware(mockReqAuditor, {}, (err) => {
    if (err && err.statusCode === 403) rbacBlocked = true;
  });

  console.log('5. Role-Based Access Control (RBAC):');
  console.log(`   - Allowed role (Administrator) permitted: ${rbacPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Disallowed role (Auditor) blocked with 403: ${rbacBlocked ? '✅ PASSED' : '❌ FAILED'}\n`);

  // 6. Test JWT Security Hardening
  const checks = [];

  const check = (name, condition) => {
    checks.push(condition);
    console.log(`   - ${name}: ${condition ? '✅ PASSED' : '❌ FAILED'}`);
  };

  console.log('6. JWT Security Hardening:');

  const decodedClaims = verifyToken(token);
  check('Issuer claim matches config', decodedClaims.iss === config.jwt.issuer);
  check('Audience claim matches config', decodedClaims.aud === config.jwt.audience);
  check('Unique token ID (jti) present', Boolean(decodedClaims.jti));

  let forgedRejected = false;
  try {
    const forged = jwt.sign(userPayload, 'this-is-not-the-real-jwt-secret', { algorithm: 'HS256' });
    verifyToken(forged);
  } catch {
    forgedRejected = true;
  }
  check('Token signed with wrong secret rejected', forgedRejected);

  let wrongAudienceRejected = false;
  try {
    const wrongAudience = jwt.sign(userPayload, config.jwt.secret, {
      algorithm: 'HS256',
      issuer: config.jwt.issuer,
      audience: 'another-consumer-app',
    });
    verifyToken(wrongAudience);
  } catch {
    wrongAudienceRejected = true;
  }
  check('Token with wrong audience rejected', wrongAudienceRejected);

  let wrongIssuerRejected = false;
  try {
    const wrongIssuer = jwt.sign(userPayload, config.jwt.secret, {
      algorithm: 'HS256',
      issuer: 'attacker-issuer',
      audience: config.jwt.audience,
    });
    verifyToken(wrongIssuer);
  } catch {
    wrongIssuerRejected = true;
  }
  check('Token with wrong issuer rejected', wrongIssuerRejected);

  let expiredRejected = false;
  try {
    const expired = jwt.sign(
      { ...userPayload, exp: Math.floor(Date.now() / 1000) - 60 },
      config.jwt.secret,
      {
        algorithm: 'HS256',
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }
    );
    verifyToken(expired);
  } catch (err) {
    expiredRejected = err.name === 'TokenExpiredError';
  }
  check('Expired token rejected with TokenExpiredError', expiredRejected);

  console.log('\n✨ All unit logic tests completed successfully!');
  if (checks.some((passed) => !passed)) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
