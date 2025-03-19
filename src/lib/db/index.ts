import { getConnectionPool } from './connection';

export async function getUserDailyAnalysisCount(userId: string, date: Date = new Date()): Promise<number> {
  // Format date as YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0];
  
  try {
    const pool = getConnectionPool();
    const result = await pool!.query(
      'SELECT count FROM user_analyses WHERE user_id = $1 AND analysis_date = $2',
      [userId, formattedDate]
    );

    console.log('Result:', result);
    
    if (result.rows.length === 0) {
      return 0;
    }
    
    return result.rows[0].count;
  } catch (error) {
    console.error('Error getting user daily analysis count:', error);
    return 0;
  }
}

export async function incrementUserDailyAnalysisCount(userId: string, date: Date = new Date()): Promise<boolean> {
  // Format date as YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0];
  
  try {
    const pool = getConnectionPool();
    await pool!.query(
      `INSERT INTO user_analyses (user_id, analysis_date, count) 
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, analysis_date) 
       DO UPDATE SET count = user_analyses.count + 1, updated_at = CURRENT_TIMESTAMP`,
      [userId, formattedDate]
    );
    
    console.log(`Successfully incremented analysis count for user ${userId}`);
    return true;
  } catch (error: any) {
    console.error('Error incrementing user daily analysis count:', error);
    
    // If we get an error about the 'count' column not existing, attempt to create it
    if (error.message && error.message.includes("column \"count\" of relation \"user_analyses\" does not exist")) {
      try {
        // Try to alter the table to add the count column if it doesn't exist
        console.log('Attempting to add count column to user_analyses table...');
        const pool = getConnectionPool();
        await pool!.query(`
          ALTER TABLE user_analyses 
          ADD COLUMN IF NOT EXISTS count INTEGER NOT NULL DEFAULT 0
        `);
        
        // Try the insert again
        await pool!.query(
          `INSERT INTO user_analyses (user_id, analysis_date, count) 
           VALUES ($1, $2, 1)
           ON CONFLICT (user_id, analysis_date) 
           DO UPDATE SET count = user_analyses.count + 1, updated_at = CURRENT_TIMESTAMP`,
          [userId, formattedDate]
        );
        
        console.log(`Successfully added count column and incremented analysis count for user ${userId}`);
        return true;
      } catch (innerError) {
        console.error('Failed to add count column and increment count:', innerError);
        return false;
      }
    }
    
    return false;
  }
}

export async function hasUserExceededDailyLimit(userId: string, date: Date = new Date(), limit: number = 1): Promise<boolean> {
  const count = await getUserDailyAnalysisCount(userId, date);
  return count >= limit;
}

/**
 * Get the timestamp of when the user last analyzed a thumbnail
 */
export async function getLastAnalysisTimestamp(userId: string): Promise<string | null> {
  try {
    const pool = getConnectionPool();
    const result = await pool!.query(
      `SELECT MAX(updated_at) as last_analysis
       FROM user_analyses 
       WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].last_analysis) {
      return null;
    }
    
    return result.rows[0].last_analysis.toISOString();
  } catch (error) {
    console.error('Error getting last analysis timestamp:', error);
    return null;
  }
}

/**
 * Set the timestamp of when the user last analyzed a thumbnail
 * This is implicitly done when incrementing the analysis count,
 * but this function can be used to explicitly set it if needed
 */
export async function setLastAnalysisTimestamp(userId: string): Promise<boolean> {
  try {
    const pool = getConnectionPool();
    // The updated_at column gets automatically updated when incrementing the count
    // But we can call this explicitly if needed
    const today = new Date().toISOString().split('T')[0];
    
    await pool!.query(
      `INSERT INTO user_analyses (user_id, analysis_date, count, updated_at) 
       VALUES ($1, $2, 0, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, analysis_date) 
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
      [userId, today]
    );
    return true;
  } catch (error) {
    console.error('Error setting last analysis timestamp:', error);
    return false;
  }
}

/**
 * Save the thumbnail analysis results to the database
 * @param userId The ID of the user
 * @param analysisData The full analysis result object
 * @returns The ID of the saved analysis or null if the save failed
 */
export async function saveThumbnailAnalysis(
  userId: string, 
  analysisData: any
): Promise<number | null> {
  // Format date as YYYY-MM-DD for the foreign key reference
  const formattedDate = new Date().toISOString().split('T')[0];
  
  try {
    const pool = getConnectionPool();
    
    // Ensure the user has an entry in user_analyses for today to satisfy the foreign key
    await incrementUserDailyAnalysisCount(userId);
    
    // Extract data from the analysis object, ensuring it matches the structure from the results page
    const {
      thumbnail = {},
      scores = {},
      analysis = {}, // Updated to match the results page data structure
      recommendations = []
    } = analysisData;
    
    // Insert the analysis data
    const result = await pool!.query(
      `INSERT INTO thumbnail_analyses (
        user_id, 
        thumbnail_url, 
        thumbnail_title,
        thumbnail_width,
        thumbnail_height,
        scores,
        analysis_data,
        recommendations,
        preview_image_url,
        title,
        analysis_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        userId,
        thumbnail.url || '',
        thumbnail.title || '',
        thumbnail.width || 0,
        thumbnail.height || 0,
        JSON.stringify(scores),
        JSON.stringify(analysis), // Store the complete analysis structure
        JSON.stringify(recommendations),
        thumbnail.url || '', // Use the thumbnail URL as the preview image URL
        thumbnail.title || '', // Use the thumbnail title if available
        formattedDate
      ]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    console.log(`Successfully saved analysis for user ${userId}, analysis ID: ${result.rows[0].id}`);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error saving thumbnail analysis:', error);
    return null;
  }
}

/**
 * Get a single thumbnail analysis by ID
 * @param id The ID of the analysis to get
 * @param userId Optional user ID to verify ownership
 * @returns The analysis data or null if not found
 */
export async function getThumbnailAnalysisById(
  id: number,
  userId?: string
): Promise<any | null> {
  try {
    const pool = getConnectionPool();
    
    const query = userId
      ? 'SELECT * FROM thumbnail_analyses WHERE id = $1 AND user_id = $2'
      : 'SELECT * FROM thumbnail_analyses WHERE id = $1';
    
    const params = userId ? [id, userId] : [id];
    
    const result = await pool!.query(query, params);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Convert the row data to a more usable format that matches the results page structure
    const analysis = result.rows[0];
    
    return {
      id: analysis.id,
      userId: analysis.user_id,
      thumbnail: {
        url: analysis.thumbnail_url,
        title: analysis.thumbnail_title || analysis.title || '',
        width: analysis.thumbnail_width,
        height: analysis.thumbnail_height
      },
      scores: analysis.scores,
      analysis: analysis.analysis_data, // Return the complete analysis structure
      recommendations: analysis.recommendations,
      createdAt: analysis.created_at,
      // Include additional metadata that might be useful for the UI
      analysisCompleted: true,
      isFreeTier: true
    };
  } catch (error) {
    console.error('Error getting thumbnail analysis by ID:', error);
    return null;
  }
}

/**
 * Get all thumbnail analyses for a user
 * @param userId The ID of the user
 * @param limit The maximum number of results to return (default 10)
 * @param offset The offset for pagination (default 0)
 * @returns An array of analysis data or an empty array if none found
 */
export async function getUserThumbnailAnalyses(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<any[]> {
  try {
    const pool = getConnectionPool();
    
    const result = await pool!.query(
      'SELECT * FROM thumbnail_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    
    // Convert the row data to a more usable format for the history list view
    return result.rows.map(analysis => {
      const scores = analysis.scores || {};
      
      // Calculate overall score if it doesn't exist
      const overallScore = scores.overall || 
        Math.round(
          ((scores.text || 0) + (scores.visual || 0) + (scores.faces || 0) + (scores.composition || 0)) / 4
        );
      
      return {
        id: analysis.id,
        userId: analysis.user_id,
        thumbnail: {
          url: analysis.thumbnail_url,
          title: analysis.thumbnail_title || analysis.title || '',
          width: analysis.thumbnail_width,
          height: analysis.thumbnail_height
        },
        previewUrl: analysis.preview_image_url || analysis.thumbnail_url,
        scores: {
          ...scores,
          overall: overallScore
        },
        createdAt: analysis.created_at,
        // Format date as a readable string
        formattedDate: new Date(analysis.created_at).toLocaleString()
      };
    });
  } catch (error) {
    console.error('Error getting user thumbnail analyses:', error);
    return [];
  }
} 