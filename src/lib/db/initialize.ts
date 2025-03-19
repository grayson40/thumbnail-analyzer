import { getConnectionPool } from './connection';

/**
 * Initialize the database schema
 * This function ensures all necessary tables exist with the correct columns
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('Initializing database schema...');
    const pool = getConnectionPool();
    
    // Create user_analyses table if it doesn't exist
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS user_analyses (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        analysis_date DATE NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Composite unique constraint to ensure one record per user per day
        UNIQUE(user_id, analysis_date)
      )
    `);
    
    // Create indexes for performance
    await pool!.query(`
      CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_analyses_date ON user_analyses(analysis_date);
    `);
    
    // Ensure count column exists (to fix the error we saw)
    try {
      await pool!.query(`
        ALTER TABLE user_analyses 
        ADD COLUMN IF NOT EXISTS count INTEGER NOT NULL DEFAULT 0
      `);
    } catch (error) {
      console.warn('Error adding count column (may already exist):', error);
    }
    
    // Create thumbnail_analyses table if it doesn't exist
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS thumbnail_analyses (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        thumbnail_url TEXT,
        thumbnail_title TEXT,
        thumbnail_width INTEGER,
        thumbnail_height INTEGER,
        scores JSONB NOT NULL,
        analysis_data JSONB NOT NULL,
        recommendations JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        analysis_date DATE NOT NULL
      )
    `);
    
    // Create indexes for thumbnail_analyses
    await pool!.query(`
      CREATE INDEX IF NOT EXISTS idx_thumbnail_analyses_user_id ON thumbnail_analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_thumbnail_analyses_created_at ON thumbnail_analyses(created_at);
    `);
    
    // Add foreign key constraint if it doesn't exist - using a function to avoid errors
    await pool!.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_analysis'
        ) THEN
          ALTER TABLE thumbnail_analyses
          ADD CONSTRAINT fk_user_analysis 
          FOREIGN KEY (user_id, analysis_date) 
          REFERENCES user_analyses(user_id, analysis_date) 
          ON DELETE CASCADE;
        END IF;
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'Error creating foreign key constraint: %', SQLERRM;
      END $$;
    `);
    
    console.log('Database schema initialization complete');
    return true;
  } catch (error) {
    console.error('Error initializing database schema:', error);
    return false;
  }
}

/**
 * Run this function to reset all user analysis counts
 * This is useful for testing or administrative purposes
 */
export async function resetAllUserAnalysisCounts(): Promise<boolean> {
  try {
    console.log('Resetting all user analysis counts...');
    const pool = getConnectionPool();
    
    await pool!.query(`
      UPDATE user_analyses
      SET count = 0, updated_at = CURRENT_TIMESTAMP
    `);
    
    console.log('All user analysis counts have been reset');
    return true;
  } catch (error) {
    console.error('Error resetting user analysis counts:', error);
    return false;
  }
} 