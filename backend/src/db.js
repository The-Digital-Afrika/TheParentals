const { PrismaClient } = require('@prisma/client');

// Every route shares one pool. Creating a PrismaClient per route multiplies the
// number of PostgreSQL connections and is the most common cause of pool
// exhaustion when several requests arrive together.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__parentalsPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__parentalsPrisma = prisma;
}

module.exports = prisma;
