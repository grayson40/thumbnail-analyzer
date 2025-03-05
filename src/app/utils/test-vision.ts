'use server';

import fs from 'fs';
import { analyzeImage } from './vision';

/**
 * Test function for the Vision API
 * This is used for development and testing only
 */
export async function testVisionAPI(imagePath: string) {
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Analyze the image
    const result = await analyzeImage(imageBuffer);
    
    return result;
  } catch (error) {
    console.error('Error testing Vision API:', error);
    throw new Error('Failed to test Vision API');
  }
} 