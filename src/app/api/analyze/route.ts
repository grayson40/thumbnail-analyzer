import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '../../utils/vision';
import { recalculateScores } from '../../utils/scoring';
import { generateRecommendations } from '../../utils/anthropic';
import { AnalysisResult } from '../../types';

// Flag to use mock data instead of the actual Vision API
const USE_MOCK_DATA = false; // Changed from true to false to use the actual Vision API

export async function POST(request: NextRequest) {
  try {
    // Check if the request is a FormData (file upload) or JSON (URL)
    const contentType = request.headers.get('content-type') || '';
    
    let imageBuffer: Buffer;
    let imageUrl: string = '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      
      // For the response, we'll use a data URL
      const base64 = imageBuffer.toString('base64');
      const mimeType = file.type;
      imageUrl = `data:${mimeType};base64,${base64}`;
    } else {
      // Handle URL (from YouTube or other source)
      const { url } = await request.json();
      
      if (!url) {
        return NextResponse.json(
          { error: 'No URL provided' },
          { status: 400 }
        );
      }
      
      // Fetch the image from the URL
      try {
        const response = await fetch(url);
        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to fetch image from URL: ${response.statusText}` },
            { status: 400 }
          );
        }
        
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        imageUrl = url;
      } catch (error) {
        console.error('Error fetching image from URL:', error);
        return NextResponse.json(
          { error: `Failed to fetch image from URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 400 }
        );
      }
    }
    
    let analysisResult: AnalysisResult;
    
    if (USE_MOCK_DATA) {
      // Use mock data for testing
      analysisResult = getMockAnalysisResult();
    } else {
      try {
        // Analyze the image using Google Cloud Vision API
        analysisResult = await analyzeImage(imageBuffer);
      } catch (error) {
        console.error('Error analyzing image with Vision API:', error);
        return NextResponse.json(
          { error: `Failed to analyze image with Vision API: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }
    
    // Add the image URL to the result
    analysisResult.thumbnail.url = imageUrl;
    
    // Recalculate scores using our improved scoring algorithm
    analysisResult = recalculateScores(analysisResult);
    
    try {
      // Generate recommendations using Anthropic (or fallback to basic recommendations)
      const recommendations = await generateRecommendations(analysisResult);
      analysisResult.recommendations = recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Continue with the analysis result even if recommendations fail
    }
    
    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: `Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}` },
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