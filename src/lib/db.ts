import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/storage/database/shared/schema';

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let cachedPool: Pool | null = null;

interface Config {
  connectionString: string;
  ssl?: { rejectUnauthorized: boolean };
}

function parseDatabaseConfig(): Config {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const hasSsl = rawUrl.includes('sslmode=');
  const cleanUrl = rawUrl
    .replace(/[?&]sslmode=[^&]*/, '')
    .replace(/[?&]channel_binding=[^&]*/, '')
    .replace(/&$/, '')
    .replace(/\?$/, '');

  return {
    connectionString: cleanUrl,
    ssl: hasSsl ? { rejectUnauthorized: false } : undefined,
  };
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (cachedDb && cachedPool) {
    return cachedDb;
  }

  const config = parseDatabaseConfig();

  cachedPool = new Pool({
    connectionString: config.connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: config.ssl,
  });

  cachedDb = drizzle(cachedPool, { schema });
  return cachedDb;
}

export { schema };
