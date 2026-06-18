import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'Super Admin', description: 'Full system access' },
    { name: 'Executive Director', description: 'Executive oversight' },
    { name: 'Program Manager', description: 'Program planning and execution' },
    { name: 'Volunteer Coordinator', description: 'Volunteer management' },
    { name: 'Content Manager', description: 'Media and news publishing' }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role
    });
  }

  const passwordHash = await bcrypt.hash('P@ssword123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@brighterfuture.org' },
    update: {},
    create: {
      fullName: 'Umar Yahaya Tikau',
      email: 'admin@brighterfuture.org',
      phone: '+234000000000',
      passwordHash,
      status: 'active'
    }
  });

  const adminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: superAdmin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: superAdmin.id, roleId: adminRole.id }
    });
  }

  console.log('Seed completed. Super admin login: admin@brighterfuture.org / P@ssword123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
