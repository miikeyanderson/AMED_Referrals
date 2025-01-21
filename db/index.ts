import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the connection pool with optimal settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  maxSize: 20, // Maximum number of connections
  idleTimeout: 30, // Idle connection timeout in seconds
  connectionTimeoutMillis: 10000, // Connection timeout
  maxUses: 7500, // Maximum number of times a connection can be used before being recycled
});

// Create a Drizzle instance with the connection pool
export const db = drizzle(pool, { schema });

// Export the pool for direct access if needed
export const dbPool = pool;