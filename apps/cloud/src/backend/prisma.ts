import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  console.warn('Creating prisma client!');

  return new PrismaClient({
    log: process.env.PRISMA_LOG_LEVEL === 'dev' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });
};

export const prisma = global.prisma || createPrismaClient();

if (!global.prisma) {
  global.prisma = prisma;
}
