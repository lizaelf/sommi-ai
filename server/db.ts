import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use HTTP-based connection instead of WebSocket to avoid connection issues
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// For backwards compatibility, export a mock pool
export const pool = {
  connect: () => Promise.resolve({
    query: sql,
    release: () => {},
  }),
};