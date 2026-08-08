import assert from 'node:assert/strict';
import { dashboardService } from '../services/dashboardService.js';
import { userRepository } from '../repositories/userRepository.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { fundSourceRepository } from '../repositories/fundSourceRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { budgetCategoryRepository } from '../repositories/budgetCategoryRepository.js';
import { budgetProgramRepository } from '../repositories/budgetProgramRepository.js';
import { allocationRepository } from '../repositories/allocationRepository.js';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { blockchainProvider } from '../config/blockchain.js';
import { BLOCKCHAIN_RECORD_STATUS } from '../constants/blockchainStatus.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';
import { ALLOCATION_STATUS } from '../constants/allocationStatus.js';
import { NOTIFICATION_KEYS } from '../constants/notificationKeys.js';

const originalMethods = {
  userStats: userRepository.getDashboardStatsAggregated,
  roleCounts: userRepository.aggregateRoleCounts,
  statusCounts: userRepository.aggregateStatusCounts,
  fiscalYearCount: fiscalYearRepository.count,
  fundSourceCount: fundSourceRepository.count,
  departmentCount: departmentRepository.count,
  budgetCategoryCount: budgetCategoryRepository.count,
  budgetProgramCount: budgetProgramRepository.count,
  findRecentlyCreated: userRepository.findRecentlyCreated,
  allocFindRecent: allocationRepository.findRecent,
  allocCountByStatusAll: allocationRepository.countByStatusAll,
  blockchainStatusCounts: blockchainRepository.countByStatus,
  blockchainLatest: blockchainRepository.getLatest,
  providerGetStatus: blockchainProvider.getStatus,
};

function resetMocks() {
  userRepository.getDashboardStatsAggregated = originalMethods.userStats;
  userRepository.aggregateRoleCounts = originalMethods.roleCounts;
  userRepository.aggregateStatusCounts = originalMethods.statusCounts;
  fiscalYearRepository.count = originalMethods.fiscalYearCount;
  fundSourceRepository.count = originalMethods.fundSourceCount;
  departmentRepository.count = originalMethods.departmentCount;
  budgetCategoryRepository.count = originalMethods.budgetCategoryCount;
  budgetProgramRepository.count = originalMethods.budgetProgramCount;
  userRepository.findRecentlyCreated = originalMethods.findRecentlyCreated;
  allocationRepository.findRecent = originalMethods.allocFindRecent;
  allocationRepository.countByStatusAll = originalMethods.allocCountByStatusAll;
  blockchainRepository.countByStatus = originalMethods.blockchainStatusCounts;
  blockchainRepository.getLatest = originalMethods.blockchainLatest;
  blockchainProvider.getStatus = originalMethods.providerGetStatus;
}

async function runDashboardServiceTests() {
  console.log('🧪 Starting Dashboard Service Unit Tests...\n');
  let passedTests = 0;
  let totalTests = 0;

  const test = async (name, testFn) => {
    totalTests++;
    resetMocks();
    try {
      await testFn();
      console.log(`   - ${name}: ✅ PASSED`);
      passedTests++;
    } catch (err) {
      console.error(`   - ${name}: ❌ FAILED`);
      console.error(`     ${err.stack || err}`);
    } finally {
      resetMocks();
    }
  };

  console.log('1. getDashboardStats Tests:');
  await test('should merge user statistics with entity counts', async () => {
    userRepository.getDashboardStatsAggregated = async () => ({
      totalUsers: 10,
      activeUsers: 7,
      inactiveUsers: 3,
      pendingUsers: 0,
      admins: 1,
    });
    fiscalYearRepository.count = async () => 3;
    fundSourceRepository.count = async () => 5;
    departmentRepository.count = async () => 8;
    budgetCategoryRepository.count = async () => 6;
    budgetProgramRepository.count = async () => 12;

    const result = await dashboardService.getDashboardStats();

    assert.equal(result.totalUsers, 10);
    assert.equal(result.activeUsers, 7);
    assert.equal(result.inactiveUsers, 3);
    assert.equal(result.fiscalYears, 3);
    assert.equal(result.fundSources, 5);
    assert.equal(result.departments, 8);
    assert.equal(result.budgetCategories, 6);
    assert.equal(result.budgetPrograms, 12);
  });

  console.log('\n2. getDashboardCharts Tests:');
  await test('should format role and status counts for the charts', async () => {
    userRepository.aggregateRoleCounts = async () => [
      { role: ROLES.ADMINISTRATOR, _count: 2 },
      { role: ROLES.TREASURER, _count: 1 },
      { role: ROLES.BUDGET_OFFICER, _count: 4 },
      { role: ROLES.AUDITOR, _count: 3 },
    ];
    userRepository.aggregateStatusCounts = async () => [
      { status: USER_STATUS.ACTIVE, _count: 9 },
      { status: USER_STATUS.INACTIVE, _count: 1 },
    ];

    const result = await dashboardService.getDashboardCharts();

    assert.deepEqual(result.usersByRole, [
      { role: 'Administrator', count: 2 },
      { role: 'Treasurer', count: 1 },
      { role: 'Budget Officer', count: 4 },
      { role: 'Auditor', count: 3 },
    ]);
    assert.deepEqual(result.usersByStatus, [
      { status: 'Active', count: 9 },
      { status: 'Inactive', count: 1 },
    ]);
  });

  console.log('\n3. getRecentActivities Tests:');
  await test('should merge user and allocation activities sorted by time descending', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const twoHoursAgo = new Date(now.getTime() - 7200000);
    const threeHoursAgo = new Date(now.getTime() - 10800000);

    userRepository.findRecentlyCreated = async () => [
      { id: 'u1', fullName: 'Jane Smith', role: ROLES.TREASURER, status: USER_STATUS.ACTIVE, createdAt: oneHourAgo, updatedAt: oneHourAgo },
      { id: 'u2', fullName: 'Bob Wilson', role: ROLES.BUDGET_OFFICER, status: USER_STATUS.ACTIVE, createdAt: threeHoursAgo, updatedAt: threeHoursAgo },
    ];
    allocationRepository.findRecent = async () => [
      { id: 'a1', allocationCode: 'BA-2026-001', department: { name: 'Engineering' }, creator: { fullName: 'Admin' }, status: 'Draft', createdAt: twoHoursAgo },
    ];

    const activities = await dashboardService.getRecentActivities(10);

    assert.equal(activities.length, 3);
    // Should be sorted newest first
    assert.equal(activities[0].id, 'user-u1');
    assert.equal(activities[0].type, 'USER_CREATED');
    assert.ok(activities[0].message.includes('Jane Smith'));
    assert.ok(activities[0].message.includes('Treasurer'));

    assert.equal(activities[1].id, 'alloc-a1');
    assert.equal(activities[1].type, 'ALLOCATION_CREATED');
    assert.ok(activities[1].message.includes('BA-2026-001'));
    assert.ok(activities[1].message.includes('Engineering'));

    assert.equal(activities[2].id, 'user-u2');
  });

  await test('should respect the limit parameter', async () => {
    const now = new Date();
    userRepository.findRecentlyCreated = async () => [
      { id: 'u1', fullName: 'A', role: ROLES.ADMINISTRATOR, status: USER_STATUS.ACTIVE, createdAt: new Date(now.getTime() - 1000), updatedAt: now },
      { id: 'u2', fullName: 'B', role: ROLES.TREASURER, status: USER_STATUS.ACTIVE, createdAt: new Date(now.getTime() - 2000), updatedAt: now },
      { id: 'u3', fullName: 'C', role: ROLES.AUDITOR, status: USER_STATUS.ACTIVE, createdAt: new Date(now.getTime() - 3000), updatedAt: now },
    ];
    allocationRepository.findRecent = async () => [];

    const activities = await dashboardService.getRecentActivities(2);
    assert.equal(activities.length, 2);
  });

  await test('should return empty array when no records exist', async () => {
    userRepository.findRecentlyCreated = async () => [];
    allocationRepository.findRecent = async () => [];

    const activities = await dashboardService.getRecentActivities();
    assert.deepEqual(activities, []);
  });

  console.log('\n4. getNotifications Tests:');
  await test('should generate warning when inactive users exist', async () => {
    userRepository.aggregateStatusCounts = async () => [
      { status: USER_STATUS.ACTIVE, _count: 8 },
      { status: USER_STATUS.INACTIVE, _count: 2 },
    ];
    allocationRepository.countByStatusAll = async () => [];
    blockchainRepository.countByStatus = async () => [];

    const notifications = await dashboardService.getNotifications();

    const warning = notifications.find((n) => n.type === 'warning');
    assert.ok(warning, 'Expected a warning notification');
    assert.ok(warning.message.includes('2'));
    assert.ok(warning.title === 'Inactive Users');
  });

  await test('should generate info notification for pending approvals', async () => {
    userRepository.aggregateStatusCounts = async () => [
      { status: USER_STATUS.ACTIVE, _count: 5 },
    ];
    allocationRepository.countByStatusAll = async () => [
      { status: ALLOCATION_STATUS.DRAFT, _count: 3 },
      { status: ALLOCATION_STATUS.PENDING_APPROVAL, _count: 4 },
    ];
    blockchainRepository.countByStatus = async () => [];

    const notifications = await dashboardService.getNotifications();

    const info = notifications.find((n) => n.type === 'info');
    assert.ok(info, 'Expected an info notification');
    assert.ok(info.message.includes('4'));
    assert.ok(info.title === 'Pending Approvals');
  });

  await test('should report failed ledger anchors as an error notification', async () => {
    userRepository.aggregateStatusCounts = async () => [
      { status: USER_STATUS.ACTIVE, _count: 5 },
    ];
    allocationRepository.countByStatusAll = async () => [];
    blockchainRepository.countByStatus = async () => [
      { status: BLOCKCHAIN_RECORD_STATUS.CONFIRMED, _count: 4 },
      { status: BLOCKCHAIN_RECORD_STATUS.FAILED, _count: 2 },
    ];

    const notifications = await dashboardService.getNotifications();

    const failed = notifications.find(
      (n) => n.key === NOTIFICATION_KEYS.LEDGER_ANCHORS_FAILED
    );
    assert.ok(failed, 'Expected a failed-anchor notification');
    assert.equal(failed.type, 'error');
    assert.equal(failed.count, 2);
    assert.ok(failed.message.includes('2'));
  });

  await test('should return no notifications when nothing needs attention', async () => {
    userRepository.aggregateStatusCounts = async () => [
      { status: USER_STATUS.ACTIVE, _count: 5 },
    ];
    allocationRepository.countByStatusAll = async () => [
      { status: ALLOCATION_STATUS.APPROVED, _count: 10 },
    ];
    blockchainRepository.countByStatus = async () => [
      { status: BLOCKCHAIN_RECORD_STATUS.CONFIRMED, _count: 10 },
    ];

    const notifications = await dashboardService.getNotifications();

    // No unearned "all systems normal" claim: an empty list is the honest
    // answer, and the dashboard renders its own empty state.
    assert.equal(notifications.length, 0);
  });

  await test('should carry a stable key and order the most urgent first', async () => {
    userRepository.aggregateStatusCounts = async () => [
      { status: USER_STATUS.ACTIVE, _count: 5 },
      { status: USER_STATUS.INACTIVE, _count: 1 },
    ];
    allocationRepository.countByStatusAll = async () => [
      { status: ALLOCATION_STATUS.PENDING_APPROVAL, _count: 3 },
    ];
    blockchainRepository.countByStatus = async () => [
      { status: BLOCKCHAIN_RECORD_STATUS.FAILED, _count: 1 },
    ];

    const notifications = await dashboardService.getNotifications();

    assert.equal(notifications.length, 3);
    assert.deepEqual(
      notifications.map((n) => n.key),
      [
        NOTIFICATION_KEYS.LEDGER_ANCHORS_FAILED,
        NOTIFICATION_KEYS.INACTIVE_USERS,
        NOTIFICATION_KEYS.PENDING_APPROVALS,
      ]
    );
  });

  console.log('\n5. getBlockchainStatus Tests:');
  await test('should delegate to the blockchain service and merge record stats', async () => {
    blockchainRepository.countByStatus = async () => [
      { status: BLOCKCHAIN_RECORD_STATUS.CONFIRMED, _count: 3 },
      { status: BLOCKCHAIN_RECORD_STATUS.PENDING, _count: 1 },
    ];
    blockchainRepository.getLatest = async () => ({
      id: 'r1',
      createdAt: new Date('2026-08-04T10:00:00.000Z'),
    });
    blockchainProvider.getStatus = async () => ({
      connected: true,
      network: 'hardhat',
      chainId: 31337,
      latestBlock: 120,
      lastSync: null,
      contractAddress: '0xabc',
      onChainCount: 4,
      message: 'Blockchain ledger is connected.',
    });

    const status = await dashboardService.getBlockchainStatus();

    assert.equal(status.connected, true);
    assert.equal(status.network, 'hardhat');
    assert.equal(status.latestBlock, 120);
    assert.equal(status.recordCount, 4);
    assert.equal(status.confirmedCount, 3);
    assert.equal(status.pendingCount, 1);
    assert.equal(status.failedCount, 0);
    assert.equal(status.lastSync, '2026-08-04T10:00:00.000Z');
  });

  await test('should report not-configured when the provider is unconfigured', async () => {
    blockchainProvider.getStatus = async () => ({
      connected: false,
      network: null,
      chainId: null,
      latestBlock: null,
      lastSync: null,
      contractAddress: null,
      message: 'Blockchain integration is not yet configured.',
    });
    blockchainRepository.countByStatus = async () => [];
    blockchainRepository.getLatest = async () => null;

    const status = await dashboardService.getBlockchainStatus();

    assert.equal(status.connected, false);
    assert.equal(status.recordCount, 0);
    assert.equal(status.confirmedCount, 0);
    assert.equal(status.pendingCount, 0);
    assert.equal(status.failedCount, 0);
    assert.equal(status.lastSync, null);
  });

  console.log('\n6. formatRole / formatStatus Helpers Tests:');
  await test('should map all known roles to display labels and fall back for unknown roles', () => {
    assert.equal(dashboardService.formatRole(ROLES.ADMINISTRATOR), 'Administrator');
    assert.equal(dashboardService.formatRole(ROLES.TREASURER), 'Treasurer');
    assert.equal(dashboardService.formatRole(ROLES.BUDGET_OFFICER), 'Budget Officer');
    assert.equal(dashboardService.formatRole(ROLES.AUDITOR), 'Auditor');
    assert.equal(dashboardService.formatRole('CustomRole'), 'CustomRole');
  });

  await test('should map known statuses to display labels and fall back for unknown statuses', () => {
    assert.equal(dashboardService.formatStatus(USER_STATUS.ACTIVE), 'Active');
    assert.equal(dashboardService.formatStatus(USER_STATUS.INACTIVE), 'Inactive');
    assert.equal(dashboardService.formatStatus('Pending'), 'Pending');
    assert.equal(dashboardService.formatStatus('CustomStatus'), 'CustomStatus');
  });

  console.log(`\n✨ Dashboard Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runDashboardServiceTests().catch((err) => {
  console.error('❌ Dashboard Service unit test failed:', err);
  process.exit(1);
});
