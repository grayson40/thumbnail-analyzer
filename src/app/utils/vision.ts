'use server';

import { ImageAnnotatorClient } from '@google-cloud/vision';
import { promises as fs } from 'fs';
import path from 'path';
import { AnalysisResult } from '../types';

// Initialize the Vision client
// Note: This assumes you have set GOOGLE_APPLICATION_CREDENTIALS in your environment
// or have the service account JSON file in the location specified in .env.local
let visionClient: ImageAnnotatorClient | null = null;

async function initVisionClient() {
  if (visionClient) return visionClient;
  
  try {
    // Check if we have a credentials file path or JSON in .env.local
    const credentialsEnv = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    if (credentialsEnv) {
      // If we have a path to a JSON file
      if (credentialsEnv.endsWith('.json')) {
        const fullPath = path.isAbsolute(credentialsEnv) 
          ? credentialsEnv 
          : path.join(process.cwd(), credentialsEnv);
        
        console.log(`Using credentials file at: ${fullPath}`);
        
        // Check if file exists
        try {
          await fs.access(fullPath);
          // Initialize with explicit credentials file
          visionClient = new ImageAnnotatorClient({
            keyFilename: fullPath
          });
        } catch (error) {
          console.error(`Credentials file not found at ${fullPath}:`, error);
          throw new Error('Google Cloud credentials file not found');
        }
      } 
      // If it's a Base64 encoded JSON (for Vercel deployment)
      else if (credentialsEnv.includes('eyJ')) {
        try {
          console.log('Using Base64 encoded credentials');
          // Decode the Base64 string to get the JSON content
          const credentialsJSON = Buffer.from(credentialsEnv, 'base64').toString();
          const credentials = JSON.parse(credentialsJSON);
          
          // Initialize with the parsed credentials
          visionClient = new ImageAnnotatorClient({
            credentials: credentials,
            projectId: credentials.project_id,
          });
        } catch (error) {
          console.error('Error parsing Base64 credentials:', error);
          throw new Error('Invalid Google Cloud credentials format');
        }
      } 
      // If it's an API key directly
      else {
        console.log('Using API key from environment variable');
        visionClient = new ImageAnnotatorClient({
          credentials: {
            client_email: 'dummy@example.com', // These won't be used with API key auth
            private_key: 'dummy_key',
          },
          projectId: 'thumbnail-analyzer',
        });
      }
    } else {
      // Try to use default credentials (for development)
      console.log('Attempting to use default credentials');
      visionClient = new ImageAnnotatorClient();
    }
    
    return visionClient;
  } catch (error) {
    console.error('Error initializing Vision client:', error);
    throw new Error('Failed to initialize Google Cloud Vision client');
  }
}

// Define a more compatible face type
interface FaceData {
  expressions: string[];
  boundingBox: any[]; // Using any for compatibility with Google Cloud Vision API
  size?: string;
  sizePercent?: number;
  confidence?: number;
}

/**
 * Analyzes an image using Google Cloud Vision API
 */
export async function analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
  try {
    // Initialize the client if not already done
    const client = await initVisionClient();
    
    // Detect text in the image
    const [textDetection] = await client.textDetection(imageBuffer);
    const textAnnotations = textDetection.textAnnotations || [];
    
    // Detect faces in the image
    const [faceDetection] = await client.faceDetection(imageBuffer);
    const faceAnnotations = faceDetection.faceAnnotations || [];
    
    // Detect properties (colors) in the image
    const [imageProperties] = await client.imageProperties(imageBuffer);
    const colors = imageProperties.imagePropertiesAnnotation?.dominantColors?.colors || [];
    
    // Get image dimensions (using a placeholder for now)
    // In a real implementation, you would get this from the image metadata
    const width = 1280;
    const height = 720;
    
    // Process text detection results
    const detectedText = textAnnotations.length > 0 
      ? textAnnotations[0].description?.split('\n').filter(Boolean) || []
      : [];
    
    // Process face detection results
    const faces = faceAnnotations.map(face => {
      // Map likelihood values to human-readable strings
      const joyLikelihood = face.joyLikelihood || 'UNKNOWN';
      const angerLikelihood = face.angerLikelihood || 'UNKNOWN';
      const sorrowLikelihood = face.sorrowLikelihood || 'UNKNOWN';
      const surpriseLikelihood = face.surpriseLikelihood || 'UNKNOWN';
      
      // Determine the most likely expression
      const expressions = [];
      if (joyLikelihood === 'VERY_LIKELY' || joyLikelihood === 'LIKELY') expressions.push('happy');
      if (angerLikelihood === 'VERY_LIKELY' || angerLikelihood === 'LIKELY') expressions.push('angry');
      if (sorrowLikelihood === 'VERY_LIKELY' || sorrowLikelihood === 'LIKELY') expressions.push('sad');
      if (surpriseLikelihood === 'VERY_LIKELY' || surpriseLikelihood === 'LIKELY') expressions.push('surprised');
      
      // Add more nuanced expression detection
      if (joyLikelihood === 'POSSIBLE') expressions.push('slightly happy');
      if (angerLikelihood === 'POSSIBLE') expressions.push('slightly angry');
      if (sorrowLikelihood === 'POSSIBLE') expressions.push('slightly sad');
      if (surpriseLikelihood === 'POSSIBLE') expressions.push('slightly surprised');
      
      if (expressions.length === 0) expressions.push('neutral');
      
      // Calculate face size relative to image
      let faceSize = 'unknown';
      let faceSizePercent = 0;
      
      if (face.boundingPoly?.vertices && face.boundingPoly.vertices.length >= 4) {
        const vertices = face.boundingPoly.vertices;
        const width = Math.max(...vertices.map(v => v.x || 0)) - Math.min(...vertices.map(v => v.x || 0));
        const height = Math.max(...vertices.map(v => v.y || 0)) - Math.min(...vertices.map(v => v.y || 0));
        
        // Calculate face area as percentage of image
        const faceArea = width * height;
        const imageArea = 1280 * 720; // Using placeholder dimensions
        faceSizePercent = Math.round((faceArea / imageArea) * 100);
        
        if (faceSizePercent > 30) faceSize = 'large';
        else if (faceSizePercent > 15) faceSize = 'medium';
        else faceSize = 'small';
      }
      
      // Calculate confidence score based on detection confidence
      const detectionConfidence = face.detectionConfidence || 0;
      
      return {
        expressions,
        boundingBox: face.boundingPoly?.vertices || [],
        size: faceSize,
        sizePercent: faceSizePercent,
        confidence: detectionConfidence
      };
    });
    
    // Process color detection results
    const dominantColors = colors
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3)
      .map(color => {
        const colorInfo = color.color || {};
        const red = colorInfo.red || 0;
        const green = colorInfo.green || 0;
        const blue = colorInfo.blue || 0;
        return rgbToHex(red, green, blue);
      });
    
    // Calculate contrast (simplified version)
    let contrast = 'Low';
    if (dominantColors.length >= 2) {
      const contrastValue = calculateContrastRatio(dominantColors[0], dominantColors[1]);
      if (contrastValue > 7) contrast = 'High';
      else if (contrastValue > 4.5) contrast = 'Medium';
    }
    
    // Update the face prominence calculation
    let faceProminence = 'None';
    let faceProminencePercent = 0;
    
    if (faces.length > 0) {
      // Find the largest face
      const largestFace = faces.reduce((prev, current) => 
        ((current.sizePercent || 0) > (prev.sizePercent || 0)) ? current : prev, faces[0]);
      
      faceProminencePercent = largestFace.sizePercent || 0;
      
      if (faceProminencePercent > 30) {
        faceProminence = `High - face takes up ${faceProminencePercent}% of the image`;
      } else if (faceProminencePercent > 15) {
        faceProminence = `Medium - face takes up ${faceProminencePercent}% of the image`;
      } else {
        faceProminence = `Low - face takes up ${faceProminencePercent}% of the image`;
      }
    }
    
    // Calculate text readability (simplified version)
    let textReadability = 'No text detected';
    if (detectedText.length > 0) {
      // Simple heuristic based on text length
      const totalTextLength = detectedText.join(' ').length;
      if (totalTextLength > 50) textReadability = 'Too much text, may be hard to read';
      else if (totalTextLength > 20) textReadability = 'Good amount of text';
      else textReadability = 'Minimal text, easy to read';
    }
    
    // Calculate scores (simplified version)
    const textScore = calculateTextScore(detectedText);
    const visualScore = calculateVisualScore(dominantColors, contrast);
    const faceScore = calculateFaceScore(faces, dominantColors);
    const compositionScore = calculateCompositionScore(textScore, visualScore, faceScore.score);
    const overallScore = Math.round((textScore + visualScore + faceScore.score + compositionScore) / 4);
    
    // Generate basic recommendations
    const recommendations = generateBasicRecommendations(
      detectedText, 
      dominantColors, 
      contrast, 
      faces, 
      faceProminence, 
      textReadability
    );
    
    return {
      thumbnail: {
        url: '', // This will be filled in by the caller
        width,
        height,
      },
      scores: {
        text: textScore,
        visual: visualScore,
        faces: faceScore.score,
        composition: compositionScore,
        overall: overallScore,
      },
      analysis: {
        text: {
          detected: detectedText,
          readability: textReadability,
        },
        colors: {
          dominant: dominantColors,
          contrast,
        },
        faces: {
          count: faces.length,
          expressions: faces.length > 0 ? faces[0].expressions : ['none'],
          prominence: faceProminence,
          explanation: faceScore.explanation,
        },
      },
      recommendations,
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image');
  }
}

// Helper functions

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  // Calculate luminance
  const luminance1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
  const luminance2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  // Calculate contrast ratio
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

function calculateLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function calculateTextScore(detectedText: string[]): number {
  if (detectedText.length === 0) return 30; // No text is not ideal but not terrible
  
  // Simple scoring based on text amount
  const totalText = detectedText.join(' ');
  const textLength = totalText.length;
  
  if (textLength > 100) return 50; // Too much text
  if (textLength > 50) return 70; // Moderate amount of text
  if (textLength > 10) return 90; // Good amount of text
  return 60; // Very little text
}

function calculateVisualScore(dominantColors: string[], contrast: string): number {
  // Simple scoring based on colors and contrast
  let score = 70; // Base score
  
  // More colors can be visually appealing
  score += Math.min(dominantColors.length * 5, 15);
  
  // High contrast is good for readability
  if (contrast === 'High') score += 15;
  else if (contrast === 'Medium') score += 10;
  
  return Math.min(score, 100);
}

/**
 * Calculate a score for face detection
 */
function calculateFaceScore(faces: FaceData[], labels: string[]): { score: number; explanation: string } {
  // Check if there are any faces detected
  if (faces.length === 0) {
    // Check if the image might contain artistic faces by looking for relevant labels
    const artisticFaceLabels = ['portrait', 'art', 'painting', 'illustration', 'cartoon', 'drawing', 'face', 'person'];
    const hasArtisticFace = labels.some(label => artisticFaceLabels.includes(label.toLowerCase()));
    
    if (hasArtisticFace) {
      return {
        score: 65,
        explanation: "No faces were detected by the AI, but the image appears to contain artistic representations of people or faces. Artistic faces can sometimes be harder for AI to detect but may still engage viewers."
      };
    }
    
    return {
      score: 50,
      explanation: "No faces were detected in the thumbnail. Thumbnails with human faces tend to perform better as they create a personal connection with viewers."
    };
  }

  // Base score for having faces
  let score = 70;
  let explanation = "";

  // Analyze face count
  if (faces.length === 1) {
    score += 10;
    explanation = "The thumbnail contains one face, which can create a personal connection with viewers. ";
  } else if (faces.length === 2) {
    score += 15;
    explanation = "The thumbnail contains two faces, suggesting interaction which can increase viewer engagement. ";
  } else if (faces.length === 3) {
    score += 12;
    explanation = "The thumbnail contains three faces, showing group dynamics which can be engaging. ";
  } else {
    score += 5;
    explanation = `The thumbnail contains ${faces.length} faces, which may be too crowded for optimal engagement. `;
  }

  // Analyze face size/prominence
  const largestFace = faces.reduce((prev, current) => 
    ((current.sizePercent || 0) > (prev.sizePercent || 0)) ? current : prev, faces[0]);
  
  const faceProminencePercent = largestFace.sizePercent || 0;
  
  if (faceProminencePercent > 30) {
    score += 10;
    explanation += "The face is prominently featured, which tends to create stronger viewer connection. ";
  } else if (faceProminencePercent > 15) {
    score += 5;
    explanation += "The face is moderately sized, providing some viewer connection. ";
  }

  // Analyze expressions
  const hasPositiveExpression = faces.some(face => 
    face.expressions.some((exp: string) => ['happy', 'slightly happy', 'surprised', 'slightly surprised'].includes(exp))
  );
  
  const hasNegativeExpression = faces.some(face => 
    face.expressions.some((exp: string) => ['angry', 'slightly angry', 'sad', 'slightly sad'].includes(exp))
  );

  if (hasPositiveExpression) {
    score += 10;
    explanation += "Positive facial expressions can increase viewer engagement and click-through rates. ";
  } else if (hasNegativeExpression) {
    score += 5;
    explanation += "Strong emotional expressions (even negative ones) can increase curiosity and engagement. ";
  }

  // Consider detection confidence
  const averageConfidence = faces.reduce((sum, face) => sum + (face.confidence || 0), 0) / faces.length;
  if (averageConfidence < 0.7) {
    score -= 5;
    explanation += "Note: The face detection confidence is lower, possibly due to artistic style, unusual angles, or partial visibility. ";
  }

  // Cap the score at 100
  score = Math.min(score, 100);

  return { score, explanation };
}

function calculateCompositionScore(textScore: number, visualScore: number, faceScore: number): number {
  // Composition is a balance of all elements
  return Math.round((textScore + visualScore + faceScore) / 3);
}

function generateBasicRecommendations(
  detectedText: string[], 
  dominantColors: string[], 
  contrast: string, 
  faces: FaceData[], 
  faceProminence: string, 
  textReadability: string
): string[] {
  const recommendations: string[] = [];
  
  // Text recommendations
  if (detectedText.length === 0) {
    recommendations.push('Consider adding some text to your thumbnail to explain the content');
  } else if (detectedText.join(' ').length > 50) {
    recommendations.push('Reduce the amount of text for better readability');
  }
  
  if (textReadability.includes('hard to read')) {
    recommendations.push('Simplify your text for better readability');
  }
  
  // Color recommendations
  if (contrast === 'Low') {
    recommendations.push('Increase the contrast between colors for better visibility');
  }
  
  if (dominantColors.length < 2) {
    recommendations.push('Add more color variety to make your thumbnail more eye-catching');
  }
  
  // Face recommendations
  if (faces.length === 0) {
    recommendations.push('Consider adding a human element (face) to create more engagement');
  } else {
    if (faceProminence.includes('Low')) {
      recommendations.push('Make the face more prominent for better engagement');
    }
    
    if (faces[0].expressions.includes('neutral')) {
      recommendations.push('Use a more expressive facial expression to create emotional connection');
    }
  }
  
  // If we don't have many recommendations, add some general ones
  if (recommendations.length < 3) {
    recommendations.push('Position important elements in the rule-of-thirds grid points');
    recommendations.push('Ensure your thumbnail stands out when viewed at small sizes');
  }
  
  return recommendations;
} 