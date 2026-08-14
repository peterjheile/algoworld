import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client.js';

export function createDatabaseClient(databaseUrl: string): PrismaClient {
  const connectionString = databaseUrl.trim();

  if (!connectionString) {
    throw new Error('A database connection URL is required.');
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({
    adapter,
  });
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
