import { AnalysisResult } from '../types';

/**
 * Calculate text effectiveness score
 * Evaluates text based on readability, amount, and placement
 */
export function calculateTextScore(
  detectedText: string[],
  textReadability: string
): number {
  if (detectedText.length === 0) return 30; // No text is not ideal but not terrible
  
  // Base score
  let score = 60;
  
  // Text amount scoring
  const totalText = detectedText.join(' ');
  const textLength = totalText.length;
  
  if (textLength > 100) score -= 20; // Too much text
  else if (textLength > 50) score += 10; // Moderate amount of text
  else if (textLength > 10) score += 25; // Good amount of text
  else score -= 10; // Very little text
  
  // Readability scoring
  if (textReadability.includes('easy to read')) score += 15;
  else if (textReadability.includes('Good amount')) score += 10;
  else if (textReadability.includes('hard to read')) score -= 15;
  
  // Text variety scoring
  if (detectedText.length >= 2 && detectedText.length <= 4) score += 10; // Ideal number of text elements
  
  // Cap the score
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate visual impact score
 * Evaluates colors, contrast, and visual appeal
 */
export function calculateVisualScore(
  dominantColors: string[],
  contrast: string
): number {
  // Base score
  let score = 70;
  
  // Color variety scoring
  if (dominantColors.length >= 3) score += 15;
  else if (dominantColors.length === 2) score += 10;
  else score -= 5; // Only one dominant color
  
  // Contrast scoring
  if (contrast === 'High') score += 15;
  else if (contrast === 'Medium') score += 10;
  else score -= 10; // Low contrast
  
  // Cap the score
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate human element score
 * Evaluates faces, expressions, and emotional connection
 */
export function calculateFaceScore(
  faceCount: number,
  expressions: string[],
  prominence: string
): number {
  // Base score
  let score = 60;
  
  // Face presence scoring
  if (faceCount === 0) {
    score = 50; // No faces is average
  } else if (faceCount > 3) {
    score = 60; // Too many faces can be distracting
  } else {
    // One or two faces is ideal
    score += 15;
  }
  
  // Expression scoring
  if (expressions.includes('happy')) score += 15;
  else if (expressions.includes('surprised')) score += 10;
  else if (expressions.includes('neutral')) score += 5;
  
  // Prominence scoring
  if (prominence.includes('High')) score += 15;
  else if (prominence.includes('Medium')) score += 10;
  else if (prominence.includes('Low')) score -= 5;
  
  // Cap the score
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate composition score
 * Evaluates overall layout and balance of elements
 */
export function calculateCompositionScore(
  textScore: number,
  visualScore: number,
  faceScore: number
): number {
  // Base composition score is the average of other scores
  const baseScore = Math.round((textScore + visualScore + faceScore) / 3);
  
  // Adjust based on balance between scores
  const scores = [textScore, visualScore, faceScore];
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreRange = maxScore - minScore;
  
  // If scores are well-balanced (small range), give a bonus
  let balanceAdjustment = 0;
  if (scoreRange < 10) balanceAdjustment = 10;
  else if (scoreRange < 20) balanceAdjustment = 5;
  else if (scoreRange > 40) balanceAdjustment = -10; // Penalize very unbalanced thumbnails
  
  return Math.min(Math.max(baseScore + balanceAdjustment, 0), 100);
}

/**
 * Calculate overall score
 * Weighted average of all component scores
 */
export function calculateOverallScore(
  textScore: number,
  visualScore: number,
  faceScore: number,
  compositionScore: number
): number {
  // Weighted average (visual and composition are slightly more important)
  const weightedScore = (
    textScore * 0.25 +
    visualScore * 0.3 +
    faceScore * 0.2 +
    compositionScore * 0.25
  );
  
  return Math.round(weightedScore);
}

/**
 * Recalculate all scores for an analysis result
 */
export function recalculateScores(analysisResult: AnalysisResult): AnalysisResult {
  const { analysis } = analysisResult;
  
  // Calculate component scores
  const textScore = calculateTextScore(
    analysis.text.detected,
    analysis.text.readability
  );
  
  const visualScore = calculateVisualScore(
    analysis.colors.dominant,
    analysis.colors.contrast
  );
  
  const faceScore = calculateFaceScore(
    analysis.faces.count,
    analysis.faces.expressions,
    analysis.faces.prominence
  );
  
  const compositionScore = calculateCompositionScore(
    textScore,
    visualScore,
    faceScore
  );
  
  const overallScore = calculateOverallScore(
    textScore,
    visualScore,
    faceScore,
    compositionScore
  );
  
  // Return updated analysis result with new scores
  return {
    ...analysisResult,
    scores: {
      text: textScore,
      visual: visualScore,
      faces: faceScore,
      composition: compositionScore,
      overall: overallScore,
    }
  };
} 