-- Schema for the user_analyses table
-- This tracks the number of analyses a user has performed on a given day

-- Create user_analyses table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_analyses (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  analysis_date DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Composite unique constraint to ensure one record per user per day
  UNIQUE(user_id, analysis_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analyses_date ON user_analyses(analysis_date);

-- Schema for the thumbnail_analyses table
-- This stores the actual analysis results for each thumbnail

CREATE TABLE IF NOT EXISTS thumbnail_analyses (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  thumbnail_url TEXT,
  thumbnail_title TEXT,
  thumbnail_width INTEGER,
  thumbnail_height INTEGER,
  scores JSONB NOT NULL, -- Store scores as JSON (text, visual, faces, composition, overall)
  analysis_data JSONB NOT NULL, -- Store detailed analysis results as JSON (text, colors, faces)
  recommendations JSONB, -- Store recommendations as JSON
  preview_image_url TEXT, -- URL to a preview image for the list view
  title TEXT, -- Optional title for the analysis (could be extracted from YouTube)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key reference to user_analyses to track daily usage
  analysis_date DATE NOT NULL,
  
  -- Indexes for querying
  CONSTRAINT fk_user_analysis FOREIGN KEY (user_id, analysis_date) 
    REFERENCES user_analyses(user_id, analysis_date) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_thumbnail_analyses_user_id ON thumbnail_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_analyses_created_at ON thumbnail_analyses(created_at); 