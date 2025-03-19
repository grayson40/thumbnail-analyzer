import { createPool } from '@vercel/postgres';

// Create a connection pool that will be reused across requests
let pool: ReturnType<typeof createPool> | null = null;

/**
 * Get a connection pool to the database
 * This will reuse the connection pool if it already exists
 */
export function getConnectionPool() {
  if (!pool) {
    // Check if we have a connection string
    if (!process.env.POSTGRES_URL) {
      console.warn('Missing POSTGRES_URL environment variable. Using mock database functions.');
      // We'll return a mock pool that does nothing but return empty results
      // This allows the app to run without a database in development
      pool = {
        query: async () => ({ rows: [] }),
        end: async () => {},
      } as any;
    } else {
      // Create a new pool if one doesn't exist
      pool = createPool({
        connectionString: process.env.POSTGRES_URL,
        connectionTimeoutMillis: 5000,
        max: 10, // Maximum number of connections in the pool
      });
      
      console.log('Created new PostgreSQL connection pool');
    }
  }
  
  return pool;
}

/**
 * Initialize the database connection
 * This should be called at app startup
 */
export async function initConnection() {
  try {
    const pool = getConnectionPool();
    // Only test the connection if it's a real pool
    if (process.env.POSTGRES_URL) {
      // Test the connection by querying the current time
      const result = await pool!.query('SELECT NOW()');
      console.log('Database connection successful:', result.rows[0]);
    } else {
      console.log('Using mock database connection');
    }
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Close the database connection
 * This should be called when shutting down the app
 */
export async function closeConnection() {
  if (pool) {
    // If we have a real pool with an end method, close it
    if (typeof (pool as any).end === 'function') {
      await pool.end();
    }
    pool = null;
    console.log('Database connection closed');
  }
} 