const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.featuredSlot.deleteMany();
  await prisma.review.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@sahomeschooling.co.za',
      password: '$2b$10$examplehashedpassword',  // Use bcrypt.hashSync('admin123', 10)
      role: 'ADMIN',
      name: 'Admin User',
    },
  });

  // Create providers (mock data from your constants.js)
  // Example for one; repeat for others
  const user = await prisma.user.create({
    data: {
      email: 'contact@khanacademy.org.za',
      password: '$2b$10$examplehashedpassword',  // bcrypt.hashSync('password', 10)
      role: 'PROVIDER',
      name: 'Khan Academy SA',
    },
  });

  await prisma.providerProfile.create({
    data: {
      userId: user.id,
      fullName: 'Khan Academy SA',
      accountType: 'Organisation / Company',
      // Add all other fields from your mock data...
      status: 'PENDING',
    },
  });

  // Add reviews, featured slots similarly...
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
