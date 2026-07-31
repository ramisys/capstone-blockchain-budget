import assert from 'node:assert/strict';
import { dashboardService } from '../services/dashboardService.js';
import { userRepository } from '../repositories/userRepository.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { fundSourceRepository } from '../repositories/fundSourceRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { budgetCategoryRepository } from '../repositories/budgetCategoryRepository.js';
import { budgetProgramRepository } from '../repositories/budgetProgramRepository.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';

const originalMethods = {
  userStats: userRepository.getDashboardStatsAggregated,
  roleCounts: userRepository.aggregateRoleCounts,
  statusCounts: userRepository.aggregateStatusCounts,
  fiscalYearCount: fiscalYearRepository.count,
  fundSourceCount: fundSourceRepository.count,
  departmentCount: departmentRepository.count,
  budgetCategoryCount: budgetCategoryRepository.count,
  budgetProgramCount: budgetProgramRepository.count,
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

  console.log('\n3. Mock Data Methods Tests:');
  await test('should return three recent activities', async () => {
    const activities = await dashboardService.getRecentActivities();

    assert.equal(activities.length, 3);
    assert.ok(activities.every((a) => a.id && a.type && a.message && a.time));
  });

  await test('should return three notifications', async () => {
    const notifications = await dashboardService.getNotifications();

    assert.equal(notifications.length, 3);
    assert.ok(notifications.every((n) => n.title && n.message && n.type));
  });

  await test('should return the mock blockchain status object', async () => {
    const status = await dashboardService.getBlockchainStatus();

    assert.deepEqual(status, {
      connected: false,
      network: 'Localhost',
      latestBlock: 0,
      lastSync: null,
      smartContract: 'Not Connected',
    });
  });

  console.log('\n4. formatRole / formatStatus Helpers Tests:');
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
