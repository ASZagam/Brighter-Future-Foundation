const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

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
    const existingRole = await prisma.role.findUnique({ where: { name: role.name } });
    if (!existingRole) {
      await prisma.role.create({ data: role });
    }
  }

  const passwordHash = await bcrypt.hash('P@ssword123', 10);
  let superAdmin = await prisma.user.findUnique({ where: { email: 'admin@brighterfuture.org' } });

  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        fullName: 'Umar Yahaya Tikau',
        email: 'admin@brighterfuture.org',
        phone: '+234000000000',
        passwordHash,
        status: 'active'
      }
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });

  if (adminRole) {
    const existingAssignment = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId: superAdmin.id, roleId: adminRole.id } }
    });
    if (!existingAssignment) {
      await prisma.userRole.create({ data: { userId: superAdmin.id, roleId: adminRole.id } });
    }
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
