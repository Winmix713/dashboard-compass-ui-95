
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Handle missing DATABASE_URL gracefully for development
let pool: Pool;
let db: ReturnType<typeof drizzle>;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  console.warn("DATABASE_URL not set. Using mock data for development.");
  
  // Create a mock pool that throws errors to trigger fallback behavior
  pool = {
    query: () => Promise.reject(new Error("Database not configured")),
    connect: () => Promise.reject(new Error("Database not configured")),
    end: () => Promise.resolve(),
  } as any;
  
  // Create a mock db that will trigger the fallback behavior in storage
  db = drizzle({ client: pool, schema });
}

export { pool, db };
