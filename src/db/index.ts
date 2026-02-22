import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set — database queries will fail at runtime.');
}

const client = postgres(connectionString || 'postgresql://placeholder:placeholder@localhost:5432/placeholder', {
  ssl: connectionString?.includes('railway.app') ? 'require' : undefined,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
