const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@sah.co.za';
  const plainPassword = 'Admin2026!';

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('✅ Admin already exists:', email);
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Admin',
      accountType: 'admin',
    },
  });

  console.log('✅ Admin created successfully:', admin.email);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });