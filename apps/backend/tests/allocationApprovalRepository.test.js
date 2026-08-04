import assert from 'node:assert/strict';
import { allocationApprovalRepository } from '../repositories/allocationApprovalRepository.js';
import prisma from '../models/prismaClient.js';

const approvalData = {
  allocationId: 'alloc-1',
  action: 'Submitted',
  comment: null,
  actorId: 'user-1',
};

const approvalRecord = {
  id: 'approval-1',
  ...approvalData,
  createdAt: new Date('2026-01-18T09:00:00.000Z'),
  actor: { id: 'user-1', fullName: 'Jose Rizal', email: 'jose@university.edu', role: 'BudgetOfficer' },
};

async function runAllocationApprovalRepositoryTests() {
  console.log('🧪 Starting Allocation Approval Repository Unit Tests...\n');
  let passedTests = 0;
  let totalTests = 0;

  const test = async (name, testFn) => {
    totalTests += 1;
    try {
      await testFn();
      passedTests += 1;
      console.log(`   - ${name}: ✅ PASSED`);
    } catch (error) {
      console.log(`   - ${name}: ❌ FAILED — ${error.message}`);
    }
  };

  await test('create() calls prisma with the approval data and actor include', async () => {
    let capturedArgs = null;
    prisma.allocationApproval.create = async (args) => {
      capturedArgs = args;
      return approvalRecord;
    };

    const result = await allocationApprovalRepository.create(approvalData);

    assert.deepEqual(capturedArgs.data, approvalData);
    assert.deepEqual(capturedArgs.include, {
      actor: { select: { id: true, fullName: true, email: true, role: true } },
    });
    assert.equal(result.id, 'approval-1');
    assert.equal(result.actor.fullName, 'Jose Rizal');
  });

  await test('create() selects actor fields and omits password hashes', async () => {
    let capturedArgs = null;
    prisma.allocationApproval.create = async (args) => {
      capturedArgs = args;
      return approvalRecord;
    };

    await allocationApprovalRepository.create(approvalData);

    const selected = capturedArgs.include.actor.select;
    assert.deepEqual(Object.keys(selected).sort(), ['email', 'fullName', 'id', 'role']);
    assert.equal(selected.password, undefined);
    assert.equal(selected.passwordHash, undefined);
  });

  await test('findManyByAllocationId() scopes to the allocation, newest first', async () => {
    let capturedArgs = null;
    prisma.allocationApproval.findMany = async (args) => {
      capturedArgs = args;
      return [approvalRecord];
    };

    const result = await allocationApprovalRepository.findManyByAllocationId('alloc-1');

    assert.equal(capturedArgs.where.allocationId, 'alloc-1');
    assert.deepEqual(capturedArgs.orderBy, { createdAt: 'desc' });
    assert.equal(capturedArgs.include.actor.select.id, true);
    assert.equal(result.length, 1);
  });

  console.log(
    `\n✨ Allocation Approval Repository Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`
  );
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllocationApprovalRepositoryTests().catch((err) => {
  console.error('❌ Allocation Approval Repository unit test failed:', err);
  process.exit(1);
});
