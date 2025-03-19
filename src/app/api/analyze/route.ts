import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { incrementUserDailyAnalysisCount, hasUserExceededDailyLimit, saveThumbnailAnalysis } from '@/lib/db/index';
import { analyzeImage } from '../../utils/vision';
import { recalculateScores } from '../../utils/scoring';
import { generateRecommendations } from '../../utils/anthropic';
import { AnalysisResult } from '../../types';
import { put } from '@vercel/blob';

// Flag to use mock data for development/testing
const USE_MOCK_DATA = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true';

// Verify Blob token is configured
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not configured');
}

/**
 * Main function to analyze a thumbnail using our services
 * This uses the real APIs and algorithms we've built
 */
async function analyzeThumbnail(thumbnailUrl: string, thumbnailData?: File): Promise<AnalysisResult> {
  try {
    console.log(`Starting analysis for: ${thumbnailUrl}`);
    
    // Step 1: Convert File to Buffer if needed
    let imageBuffer: Buffer;
    
    if (thumbnailData) {
      // Convert File to Buffer
      const arrayBuffer = await thumbnailData.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else if (thumbnailUrl) {
      // Fetch the image from URL
      const response = await fetch(thumbnailUrl);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error('No image data provided');
    }
    
    // Step 2: Run image analysis with Vision API
    const visionResult = await analyzeImage(imageBuffer);
    console.log('Vision API analysis complete');
    
    // Step 3: Calculate scores based on the vision results
    const withScores = recalculateScores(visionResult);
    console.log('Score calculation complete:', withScores.scores);
    
    // Step 4: Generate recommendations using Anthropic API
    const recommendations = await generateRecommendations(withScores);
    
    // Add recommendations to the result
    const finalResult: AnalysisResult = {
      ...withScores,
      thumbnail: {
        ...withScores.thumbnail,
        url: thumbnailUrl  // Ensure the URL is explicitly set
      },
      recommendations: recommendations
    };
    
    console.log('Recommendations generated:', finalResult.recommendations.length);
    
    return finalResult;
  } catch (error) {
    console.error('Error in analyzeThumbnail:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', authRequired: true },
        { status: 401 }
      );
    }
    
    // Check if user has exceeded their daily limit
    const hasExceeded = await hasUserExceededDailyLimit(userId);
    
    if (hasExceeded) {
      console.log(`User ${userId} has exceeded daily analysis limit`);
      return NextResponse.json(
        { 
          error: 'Daily analysis limit reached', 
          limitExceeded: true, 
          success: false 
        },
        { status: 429 }
      );
    }
    
    // Parse request body - handle both FormData and JSON
    let url = '';
    let thumbnailData: File | undefined = undefined;
    
    // Check if the request is a FormData or JSON request
    const contentType = req.headers.get('content-type') || '';
    console.log('Content type:', contentType);
    
    if (contentType.includes('multipart/form-data')) {
      try {
        // Check if Blob token is properly configured
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          console.error('Missing BLOB_READ_WRITE_TOKEN in analyze route');
          return NextResponse.json(
            { error: 'Server configuration error: Blob storage not properly configured' },
            { status: 500 }
          );
        }
        
        // Handle FormData (file upload)
        const formData = await req.formData();
        const file = formData.get('file');
        
        if (!file || !(file instanceof File)) {
          return NextResponse.json(
            { error: 'No file provided or invalid file' },
            { status: 400 }
          );
        }
        
        console.log('Received file:', file.name, 'size:', file.size);
        
        // Upload the file to Vercel Blob
        const timestamp = Date.now();
        const fileName = `${userId}-${timestamp}-${file.name}`;
        
        console.log('Attempting to upload to Vercel Blob with token present:', !!process.env.BLOB_READ_WRITE_TOKEN);
        
        try {
          const blob = await put(fileName, file, {
            access: 'public',
          });
          
          // Set the URL to the uploaded blob URL
          url = blob.url;
          thumbnailData = file;
          
          console.log(`File uploaded to ${url}`);
        } catch (blobError: any) {
          console.error('Vercel Blob upload error:', blobError);
          return NextResponse.json(
            { error: `Blob storage error: ${blobError.message}`, success: false },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('Error processing FormData:', error);
        return NextResponse.json(
          { error: 'Failed to process uploaded file' },
          { status: 400 }
        );
      }
    } else {
      // Handle JSON (URL or YouTube ID)
      try {
        const body = await req.json();
        url = body.url;
        
        if (!url) {
          return NextResponse.json(
            { error: 'Thumbnail URL is required' },
            { status: 400 }
          );
        }
        
        console.log('Received URL:', url);
        
        // Check if this is a Blob URL - if so, we don't need to re-upload
        if (url.includes('blob.vercel-storage.com')) {
          console.log('URL is already a Vercel Blob URL, skipping upload');
        }
      } catch (error) {
        console.error('Error parsing JSON body:', error);
        return NextResponse.json(
          { error: 'Invalid JSON request body' },
          { status: 400 }
        );
      }
    }
    
    // Analyze the thumbnail
    console.log(`Analyzing thumbnail for user ${userId}:`, url);
    
    // Determine whether to use mock data or real analysis
    let analysis: AnalysisResult;
    
    if (USE_MOCK_DATA) {
      console.log('Using mock data for analysis (development mode)');
      analysis = getMockAnalysisResult();
      
      // Make sure the thumbnail URL is set correctly in the result
      if (analysis && analysis.thumbnail) {
        analysis.thumbnail.url = url;
      }
    } else {
      // Use our real analysis services
      console.log('Using production analysis services');
      try {
        analysis = await analyzeThumbnail(url, thumbnailData);
        
        // Double-check that the URL is set correctly
        if (analysis && analysis.thumbnail) {
          analysis.thumbnail.url = url;
        }
      } catch (error) {
        console.error('Analysis failed:', error);
        return NextResponse.json(
          { error: 'Analysis failed. Please try again with a different image.', success: false },
          { status: 500 }
        );
      }
    }
    
    // Increment the user's daily analysis count
    const success = await incrementUserDailyAnalysisCount(userId);
    
    if (!success) {
      console.warn(`Failed to increment analysis count for user ${userId}`);
    } else {
      console.log(`Successfully incremented analysis count for user ${userId}`);
    }
    
    // Save the analysis result to the database
    console.log(`Saving analysis with thumbnail URL: ${analysis.thumbnail.url}`);
    const analysisId = await saveThumbnailAnalysis(userId, analysis);
    
    if (!analysisId) {
      console.warn(`Failed to save analysis result for user ${userId}`);
    } else {
      console.log(`Successfully saved analysis result for user ${userId}, ID: ${analysisId}`);
    }
    
    return NextResponse.json({
      ...analysis,
      isFreeTier: true,
      analysisCompleted: true,
      success: true,
      analysisId // Include the ID in the response so we can use it for loading results later
    });
  } catch (error: any) {
    console.error('Error processing analysis request:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to analyze thumbnail',
        success: false 
      },
      { status: 500 }
    );
  }
}

// Mock data for testing without the Vision API
function getMockAnalysisResult(): AnalysisResult {
  return {
    thumbnail: {
      url: "", // Will be filled in by the caller
      width: 1280,
      height: 720,
    },
    scores: {
      text: 75,
      visual: 82,
      faces: 60,
      composition: 70,
      overall: 72,
    },
    analysis: {
      text: {
        detected: ["AMAZING TIPS", "MUST SEE"],
        readability: "Good amount of text",
      },
      colors: {
        dominant: ["#e63946", "#f1faee", "#1d3557"],
        contrast: "High",
      },
      faces: {
        count: 1,
        expressions: ["neutral"],
        prominence: "Medium - face takes up 20% of the image",
        explanation: "The thumbnail contains one face, which can create a personal connection with viewers. The face is moderately sized, providing some viewer connection."
      },
    },
    recommendations: [
      {
        category: 'text',
        action: 'Increase text size for better readability on mobile',
        steps: ['Adjust font size for mobile viewing', 'Ensure text contrast is sufficient'],
        impact: { metric: 'CTR', value: 15, unit: '%' },
        priority: 1,
        icon: '🔤'
      },
      {
        category: 'face',
        action: 'Consider adding more emotion to the facial expression',
        steps: ['Use more expressive facial poses', 'Capture authentic reactions'],
        impact: { metric: 'CTR', value: 20, unit: '%' },
        priority: 2,
        icon: '😀'
      },
      {
        category: 'color',
        action: 'The red color is eye-catching but could be more vibrant',
        steps: ['Increase color saturation', 'Test different shades of red'],
        impact: { metric: 'CTR', value: 10, unit: '%' },
        priority: 3,
        icon: '🎨'
      },
      {
        category: 'composition',
        action: 'Try positioning the text in the upper third of the image',
        steps: ['Apply rule of thirds', 'Leave space for text overlay'],
        impact: { metric: 'CTR', value: 12, unit: '%' },
        priority: 2,
        icon: '📐'
      }
    ],
  };
} 