import { Anthropic } from '@anthropic-ai/sdk';
import { AnalysisResult } from '../types';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Generate recommendations for a thumbnail based on analysis results
 */
export async function generateRecommendations(analysisResult: AnalysisResult): Promise<string[]> {
  try {
    // If no API key is set, use basic recommendations
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('No Anthropic API key found, using basic recommendations');
      return generateBasicRecommendations(analysisResult);
    }
    
    // Extract relevant information from the analysis result
    const { analysis, scores } = analysisResult;
    
    // Create a prompt for Claude
    const prompt = `
You are a YouTube thumbnail optimization expert. Based on the following analysis of a YouTube thumbnail, provide 3-5 specific, actionable recommendations to improve its click-through rate.

THUMBNAIL ANALYSIS:
- Text detected: ${analysis.text.detected.join(', ') || 'None'}
- Text readability: ${analysis.text.readability}
- Dominant colors: ${analysis.colors.dominant.join(', ')}
- Color contrast: ${analysis.colors.contrast}
- Faces detected: ${analysis.faces.count}
- Face expressions: ${analysis.faces.expressions.join(', ')}
- Face prominence: ${analysis.faces.prominence}

SCORES (out of 100):
- Text effectiveness: ${scores.text}
- Visual impact: ${scores.visual}
- Human element: ${scores.faces}
- Composition: ${scores.composition}
- Overall: ${scores.overall}

Focus your recommendations on the weakest areas. Each recommendation should be specific, actionable, and explain why it would improve the thumbnail.

RECOMMENDATIONS:`;

    // Call the Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.7,
      system: "You are a YouTube thumbnail optimization expert who provides specific, actionable recommendations to improve thumbnails. Your advice should be concise, practical, and focused on improving click-through rates.",
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract and process the recommendations
    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    // Split the response into individual recommendations
    const recommendations = content
      .split(/\d+\.\s+/) // Split by numbered list items
      .filter((item: string) => item.trim().length > 0) // Remove empty items
      .map((item: string) => item.trim()) // Trim whitespace
      .slice(0, 5); // Limit to 5 recommendations
    
    return recommendations.length > 0 ? recommendations : generateBasicRecommendations(analysisResult);
  } catch (error) {
    console.error('Error generating recommendations with Anthropic:', error);
    // Fall back to basic recommendations
    return generateBasicRecommendations(analysisResult);
  }
}

/**
 * Generate basic recommendations based on analysis results
 * Used as a fallback when Anthropic API is not available
 */
function generateBasicRecommendations(analysisResult: AnalysisResult): string[] {
  const { analysis, scores } = analysisResult;
  const recommendations: string[] = [];
  
  // Text recommendations
  if (scores.text < 60) {
    if (analysis.text.detected.length === 0) {
      recommendations.push('Add clear, concise text to explain your video content');
    } else if (analysis.text.readability.includes('hard to read')) {
      recommendations.push('Improve text readability by using larger fonts or better contrast');
    } else if (analysis.text.detected.join(' ').length > 50) {
      recommendations.push('Reduce the amount of text for better readability');
    }
  }
  
  // Visual recommendations
  if (scores.visual < 70) {
    if (analysis.colors.contrast === 'Low') {
      recommendations.push('Increase the contrast between colors for better visibility');
    }
    
    if (analysis.colors.dominant.length < 2) {
      recommendations.push('Use more vibrant and contrasting colors to make your thumbnail eye-catching');
    }
  }
  
  // Face recommendations
  if (scores.faces < 70) {
    if (analysis.faces.count === 0) {
      recommendations.push('Consider adding a human element (face) to create more engagement');
    } else {
      if (analysis.faces.prominence.includes('Low')) {
        recommendations.push('Make the face more prominent for better engagement');
      }
      
      if (analysis.faces.expressions.includes('neutral')) {
        recommendations.push('Use a more expressive facial expression to create emotional connection');
      }
    }
  }
  
  // Composition recommendations
  if (scores.composition < 70) {
    recommendations.push('Improve the overall composition by following the rule of thirds');
  }
  
  // General recommendations if we don't have enough specific ones
  if (recommendations.length < 3) {
    if (!recommendations.includes('Use a more expressive facial expression to create emotional connection')) {
      recommendations.push('Use emotional expressions or reactions to create curiosity');
    }
    
    if (!recommendations.includes('Improve the overall composition by following the rule of thirds')) {
      recommendations.push('Position important elements at the intersection points of a rule-of-thirds grid');
    }
    
    recommendations.push('Ensure your thumbnail stands out when viewed at small sizes on mobile devices');
  }
  
  // Limit to 5 recommendations
  return recommendations.slice(0, 5);
} 