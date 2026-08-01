import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const passwordHashCache = new Map();

async function hashPassword(password) {
  if (!passwordHashCache.has(password)) {
    passwordHashCache.set(password, await bcrypt.hash(password, 10));
  }
  return passwordHashCache.get(password);
}

const USERS = [
  {
    fullName: 'System Administrator',
    email: 'admin@university.edu',
    password: 'AdminPassword123!',
    role: 'Administrator',
  },
  {
    fullName: 'Budget Officer',
    email: 'budgetofficer@university.edu',
    password: 'BudgetOfficer123!',
    role: 'BudgetOfficer',
  },
  {
    fullName: 'University Treasurer',
    email: 'treasurer@university.edu',
    password: 'Treasurer123!',
    role: 'Treasurer',
  },
  {
    fullName: 'Internal Auditor',
    email: 'auditor@university.edu',
    password: 'Auditor123!',
    role: 'Auditor',
  },
];

const FISCAL_YEARS = (currentYear) => [
  {
    code: `FY-${currentYear}`,
    description: `Fiscal Year ${currentYear}`,
    startDate: new Date(currentYear, 0, 1),
    endDate: new Date(currentYear, 11, 31),
    budgetAmount: 10000000,
  },
  {
    code: `FY-${currentYear - 1}`,
    description: `Fiscal Year ${currentYear - 1}`,
    startDate: new Date(currentYear - 1, 0, 1),
    endDate: new Date(currentYear - 1, 11, 31),
    budgetAmount: 8000000,
  },
];

const DEPARTMENTS = [
  {
    code: 'DEPT-ENG',
    name: 'College of Engineering',
    officeHead: 'Engr. Maria Santos',
    contactNumber: '0917-000-0001',
    email: 'engineering@university.edu',
    officeAddress: 'Main Campus, Engineering Building',
  },
  {
    code: 'DEPT-CAS',
    name: 'College of Arts and Sciences',
    officeHead: 'Dr. Juan Dela Cruz',
    contactNumber: '0917-000-0002',
    email: 'cas@university.edu',
    officeAddress: 'Main Campus, Humanities Building',
  },
  {
    code: 'DEPT-IT',
    name: 'Information Technology Services',
    officeHead: 'Ms. Ana Reyes',
    contactNumber: '0917-000-0003',
    email: 'its@university.edu',
    officeAddress: 'Main Campus, Admin Building',
  },
];

const FUND_SOURCES = [
  {
    code: 'FS-GF',
    name: 'General Fund',
    description: 'Regular appropriation from the national budget',
  },
  {
    code: 'FS-SEF',
    name: 'Special Education Fund',
    description: 'Allocation for education-specific programs',
  },
  {
    code: 'FS-TF',
    name: 'Trust Fund',
    description: 'Internally generated income and donations',
  },
];

const BUDGET_CATEGORIES = [
  {
    code: 'CAT-PS',
    name: 'Personnel Services',
    description: 'Salaries, wages, and other personnel benefits',
  },
  {
    code: 'CAT-MOOE',
    name: 'Maintenance and Other Operating Expenses',
    description: 'Operating expenses for maintenance and daily operations',
  },
  {
    code: 'CAT-CO',
    name: 'Capital Outlay',
    description: 'Infrastructure, equipment, and other capital assets',
  },
];

const PROGRAMS = [
  {
    code: 'PROG-ENG-INFRA',
    name: 'Engineering Infrastructure',
    description: 'Buildings, facilities, and laboratory infrastructure',
    departmentCode: 'DEPT-ENG',
    categoryCode: 'CAT-CO',
  },
  {
    code: 'PROG-ENG-OPS',
    name: 'Engineering Operations',
    description: 'Day-to-day operations and maintenance of the college',
    departmentCode: 'DEPT-ENG',
    categoryCode: 'CAT-MOOE',
  },
  {
    code: 'PROG-CAS-TEACH',
    name: 'Teaching Excellence',
    description: 'Faculty development and instructional materials',
    departmentCode: 'DEPT-CAS',
    categoryCode: 'CAT-PS',
  },
  {
    code: 'PROG-IT-SYSTEMS',
    name: 'IT Systems Modernization',
    description: 'Hardware, software, and network infrastructure upgrades',
    departmentCode: 'DEPT-IT',
    categoryCode: 'CAT-CO',
  },
];

const ALLOCATIONS = (currentYear) => [
  {
    allocationCode: `BA-${currentYear}-001`,
    fiscalYearCode: `FY-${currentYear}`,
    departmentCode: 'DEPT-ENG',
    fundSourceCode: 'FS-GF',
    categoryCode: 'CAT-CO',
    programCode: 'PROG-ENG-INFRA',
    allocatedAmount: 1500000,
    description: 'Engineering building infrastructure upgrade',
    status: 'Draft',
  },
  {
    allocationCode: `BA-${currentYear}-002`,
    fiscalYearCode: `FY-${currentYear}`,
    departmentCode: 'DEPT-IT',
    fundSourceCode: 'FS-SEF',
    categoryCode: 'CAT-CO',
    programCode: 'PROG-IT-SYSTEMS',
    allocatedAmount: 800000,
    description: 'IT systems modernization for online learning',
    status: 'PendingApproval',
  },
  {
    allocationCode: `BA-${currentYear}-003`,
    fiscalYearCode: `FY-${currentYear}`,
    departmentCode: 'DEPT-CAS',
    fundSourceCode: 'FS-GF',
    categoryCode: 'CAT-PS',
    programCode: 'PROG-CAS-TEACH',
    allocatedAmount: 2000000,
    description: 'Faculty development and instructional materials',
    status: 'Approved',
  },
  {
    allocationCode: `BA-${currentYear}-004`,
    fiscalYearCode: `FY-${currentYear}`,
    departmentCode: 'DEPT-ENG',
    fundSourceCode: 'FS-GF',
    categoryCode: 'CAT-MOOE',
    programCode: 'PROG-ENG-OPS',
    allocatedAmount: 250000,
    description: 'Laboratory equipment maintenance',
    status: 'Draft',
  },
  {
    allocationCode: `BA-${currentYear}-005`,
    fiscalYearCode: `FY-${currentYear}`,
    departmentCode: 'DEPT-CAS',
    fundSourceCode: 'FS-TF',
    categoryCode: 'CAT-MOOE',
    programCode: 'PROG-CAS-TEACH',
    allocatedAmount: 100000,
    description: 'Cultural activities funding (deferred)',
    status: 'Rejected',
  },
];

async function seedUsers() {
  const users = [];
  for (const user of USERS) {
    const hashedPassword = await hashPassword(user.password);
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        password: hashedPassword,
        role: user.role,
        status: 'Active',
      },
      create: {
        fullName: user.fullName,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        status: 'Active',
      },
    });
    users.push(record);
  }
  return users;
}

async function seedFiscalYears() {
  const currentYear = new Date().getFullYear();
  const fiscalYears = [];

  for (const fy of FISCAL_YEARS(currentYear)) {
    const record = await prisma.fiscalYear.upsert({
      where: { code: fy.code },
      update: fy,
      create: fy,
    });
    fiscalYears.push(record);
  }

  // Ensure exactly one fiscal year is active: the current year.
  await prisma.fiscalYear.updateMany({ data: { isActive: false } });
  const active = await prisma.fiscalYear.update({
    where: { code: `FY-${currentYear}` },
    data: { isActive: true, status: 'Active' },
  });

  return { fiscalYears, active };
}

async function seedMasterData() {
  // Departments and categories are keyed by their unique name so pre-existing
  // rows created during manual testing are adopted instead of colliding.
  const departments = [];
  for (const dept of DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { name: dept.name },
      update: dept,
      create: dept,
    });
    departments.push(record);
  }

  const fundSources = [];
  for (const fundSource of FUND_SOURCES) {
    const record = await prisma.fundSource.upsert({
      where: { code: fundSource.code },
      update: fundSource,
      create: fundSource,
    });
    fundSources.push(record);
  }

  const budgetCategories = [];
  for (const category of BUDGET_CATEGORIES) {
    const record = await prisma.budgetCategory.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
    budgetCategories.push(record);
  }

  const departmentByCode = new Map(departments.map((d) => [d.code, d.id]));
  const categoryByCode = new Map(budgetCategories.map((c) => [c.code, c.id]));

  const programs = [];
  for (const program of PROGRAMS) {
    const record = await prisma.budgetProgram.upsert({
      where: { code: program.code },
      update: {
        name: program.name,
        description: program.description,
        departmentId: departmentByCode.get(program.departmentCode),
        budgetCategoryId: categoryByCode.get(program.categoryCode),
        status: 'Active',
      },
      create: {
        code: program.code,
        name: program.name,
        description: program.description,
        departmentId: departmentByCode.get(program.departmentCode),
        budgetCategoryId: categoryByCode.get(program.categoryCode),
        status: 'Active',
      },
    });
    programs.push(record);
  }

  return { departments, fundSources, budgetCategories, programs };
}

async function seedAllocations({ active, users }) {
  const currentYear = new Date().getFullYear();
  const creator = users.find((user) => user.role === 'BudgetOfficer');
  const allocations = [];

  for (const allocation of ALLOCATIONS(currentYear)) {
    const department = await prisma.department.findUnique({
      where: { code: allocation.departmentCode },
    });
    const fundSource = await prisma.fundSource.findUnique({
      where: { code: allocation.fundSourceCode },
    });
    const category = await prisma.budgetCategory.findUnique({
      where: { code: allocation.categoryCode },
    });
    const program = await prisma.budgetProgram.findUnique({
      where: { code: allocation.programCode },
    });

    const record = await prisma.budgetAllocation.upsert({
      where: { allocationCode: allocation.allocationCode },
      update: {
        fiscalYearId: active.id,
        departmentId: department.id,
        fundSourceId: fundSource.id,
        categoryId: category.id,
        programId: program.id,
        allocatedAmount: allocation.allocatedAmount,
        description: allocation.description,
        status: allocation.status,
        createdBy: creator.id,
        deletedAt: null,
      },
      create: {
        allocationCode: allocation.allocationCode,
        fiscalYearId: active.id,
        departmentId: department.id,
        fundSourceId: fundSource.id,
        categoryId: category.id,
        programId: program.id,
        allocatedAmount: allocation.allocatedAmount,
        description: allocation.description,
        status: allocation.status,
        createdBy: creator.id,
      },
    });
    allocations.push(record);
  }

  return allocations;
}

async function main() {
  const users = await seedUsers();
  const { active } = await seedFiscalYears();
  const { departments, fundSources, budgetCategories, programs } = await seedMasterData();
  const allocations = await seedAllocations({ active, users });

  console.log('=======================================================');
  console.log('🌱 Prisma Seed Completed Successfully!');
  console.log('=======================================================');
  console.log(`👤 Users seeded: ${users.length}`);
  for (const user of users) {
    console.log(`   - ${user.role} (${user.email})`);
  }
  console.log(`📅 Active Fiscal Year: ${active.code} (₱${active.budgetAmount})`);
  console.log(`🏛️  Departments seeded: ${departments.length}`);
  console.log(`💰 Fund Sources seeded: ${fundSources.length}`);
  console.log(`🗂️  Budget Categories seeded: ${budgetCategories.length}`);
  console.log(`📋 Budget Programs seeded: ${programs.length}`);
  console.log(`📌 Allocations seeded: ${allocations.length}`);
  for (const allocation of allocations) {
    console.log(
      `   - ${allocation.allocationCode} (${allocation.status}) ₱${allocation.allocatedAmount}`
    );
  }
  console.log('=======================================================');
  console.log('🔑 Default credentials:');
  console.log('   Administrator: admin@university.edu / AdminPassword123!');
  console.log('   Budget Officer: budgetofficer@university.edu / BudgetOfficer123!');
  console.log('   Treasurer: treasurer@university.edu / Treasurer123!');
  console.log('   Auditor: auditor@university.edu / Auditor123!');
  console.log('=======================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error during Prisma seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
