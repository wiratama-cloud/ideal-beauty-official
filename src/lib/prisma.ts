import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dmmfHash: string | undefined;
};

const currentDmmfHash = JSON.stringify(
  Prisma.dmmf?.datamodel?.models?.map((m) => ({
    name: m.name,
    fields: m.fields.map((f) => f.name),
  })) ?? []
);

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/idealbeauty?schema=public';

  const pool = new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  if (globalForPrisma.dmmfHash !== currentDmmfHash) {
    globalForPrisma.prisma = undefined;
    globalForPrisma.dmmfHash = undefined;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.dmmfHash = currentDmmfHash;
}
