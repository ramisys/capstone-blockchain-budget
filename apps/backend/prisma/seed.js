import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@university.edu';
  const rawPassword = 'AdminPassword123!';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      status: 'Active',
    },
    create: {
      fullName: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'Administrator',
      status: 'Active',
    },
  });

  console.log('=======================================================');
  console.log('🌱 Prisma Seed Completed Successfully!');
  console.log(`👤 Administrator Account: ${admin.email}`);
  console.log(`🔑 Role: ${admin.role}`);
  console.log(`🔒 Status: ${admin.status}`);
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
