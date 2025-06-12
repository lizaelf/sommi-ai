import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use HTTP-based connection with optimized settings
const sql = neon(process.env.DATABASE_URL, {
  fullResults: false,
});
export const db = drizzle(sql, { schema });

// For backwards compatibility, export a mock pool
export const pool = {
  connect: () => Promise.resolve({
    query: sql,
    release: () => {},
  }),
};