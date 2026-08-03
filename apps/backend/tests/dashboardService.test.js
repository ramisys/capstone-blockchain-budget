import assert from 'node:assert/strict';
import { dashboardService } from '../services/dashboardService.js';
import { userRepository } from '../repositories/userRepository.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { fundSourceRepository } from '../repositories/fundSourceRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { budgetCategoryRepository } from '../repositories/budgetCategoryRepository.js';
import { budgetProgramRepository } from '../repositories/budgetProgramRepository.js';
import { allocationRepository } from '../repositories/allocationRepository.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';
import { ALLOCATION_STATUS } from '../constants/allocationStatus.js';

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

    const notifications = await dashboardService.getNotifications();

    const info = notifications.find((n) => n.type === 'info');
    assert.ok(info, 'Expected an info notification');
    assert.ok(info.message.includes('4'));
    assert.ok(info.title === 'Pending Approvals');
  });

  await test('should always include a system-status success notification', async () => {
    userRepository.aggregateStatusCounts = async () => [
      { status: USER_STATUS.ACTIVE, _count: 5 },
    ];
    allocationRepository.countByStatusAll = async () => [];

    const notifications = await dashboardService.getNotifications();

    const success = notifications.find((n) => n.type === 'success');
    assert.ok(success, 'Expected a success notification');
    assert.equal(success.title, 'System Status');
  });

  await test('should only include system-status when nothing needs attention', async () => {
    userRepository.aggregateStatusCounts = async () => [
      { status: USER_STATUS.ACTIVE, _count: 5 },
    ];
    allocationRepository.countByStatusAll = async () => [
      { status: ALLOCATION_STATUS.APPROVED, _count: 10 },
    ];

    const notifications = await dashboardService.getNotifications();
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].type, 'success');
  });

  console.log('\n5. getBlockchainStatus Tests:');
  await test('should return an honest not-configured status', async () => {
    const status = await dashboardService.getBlockchainStatus();

    assert.equal(status.connected, false);
    assert.equal(status.network, null);
    assert.equal(status.latestBlock, null);
    assert.equal(status.lastSync, null);
    assert.equal(status.smartContract, null);
    assert.equal(status.message, 'Blockchain integration is not yet configured.');
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
