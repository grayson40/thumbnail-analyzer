import { AnalysisResult } from '../types';
import {
  getScoringWeights,
  getOverallFindings,
  calculateNormalizedScore,
} from './scoringModel';

/**
 * Calculate text effectiveness score
 * Evaluates text based on readability, amount, and placement
 */
export function calculateTextScore(
  detectedText: string[],
  textReadability: string,
  fontSizes?: number[],
  fontContrast?: number
): number {
  // Add null/undefined checks
  if (!detectedText) return 0;
  
  const weights = getScoringWeights();
  const findings = getOverallFindings();
  
  // More sophisticated text presence scoring
  const hasText = detectedText.length > 0;
  const textPresenceScore = hasText ? 100 : 0;
  
  // Improved text entities scoring with capping for excessive text
  const textCount = detectedText.length;
  const optimalTextCount = findings.textStats.avgTextEntities;
  let textEntitiesScore = 0;
  
  if (textCount > 0) {
    // Penalize excessive text more aggressively
    if (textCount > optimalTextCount * 1.5) {
      textEntitiesScore = Math.max(70 - ((textCount - optimalTextCount * 1.5) / optimalTextCount) * 40, 30);
    } else if (textCount < optimalTextCount * 0.5) {
      textEntitiesScore = Math.max(70 - ((optimalTextCount * 0.5 - textCount) / optimalTextCount) * 40, 30);
    } else {
      // Optimal range
      const deviation = Math.abs(textCount - optimalTextCount) / optimalTextCount;
      textEntitiesScore = 100 - (deviation * 30);
    }
  }
  
  // More nuanced readability scoring
  let readabilityScore = 0;
  switch (textReadability) {
    case 'Good amount of text':
      readabilityScore = 100;
      break;
    case 'Too much text':
      readabilityScore = Math.max(60 - ((textCount - optimalTextCount) / optimalTextCount) * 20, 30);
      break;
    case 'Too little text':
      readabilityScore = Math.max(70 - ((optimalTextCount - textCount) / optimalTextCount) * 20, 40);
      break;
    default:
      readabilityScore = 80;
  }
  
  // Add font size and contrast scoring if available
  let fontScore = 80; // Default
  if (fontSizes && fontContrast) {
    const avgFontSize = fontSizes.reduce((sum, size) => sum + size, 0) / fontSizes.length;
    const fontSizeScore = calculateNormalizedScore(avgFontSize, findings.textStats.avgFontSize || 24, 15);
    const fontContrastScore = fontContrast > 4.5 ? 100 : (fontContrast / 4.5) * 100;
    fontScore = (fontSizeScore * 0.5) + (fontContrastScore * 0.5);
  }
  
  // Weighted combination with enhanced weights
  const finalScore = (
    textPresenceScore * weights.textPresence +
    textEntitiesScore * weights.textEntities +
    readabilityScore * 0.3 +
    fontScore * 0.2
  ) / (weights.textPresence + weights.textEntities + 0.3 + 0.2);
  
  return Math.round(Math.max(0, Math.min(100, finalScore)));
}

/**
 * Calculate visual impact score
 * Evaluates colors, contrast, and visual appeal
 */
export function calculateVisualScore(
  dominantColors: string[],
  contrast: string,
  brightnessFactor?: number,
  saturationLevel?: number
): number {
  if (!dominantColors || dominantColors.length === 0) return 50; // Default score for no color data
  
  // const weights = getScoringWeights();
  const findings = getOverallFindings();
  
  // Enhanced color variety scoring with diminishing returns
  const optimalColorCount = 3; // Most successful thumbnails have 3-4 colors
  let colorVarietyScore = 0;
  
  if (dominantColors.length < optimalColorCount) {
    // Too few colors
    colorVarietyScore = 70 + (dominantColors.length / optimalColorCount) * 30;
  } else if (dominantColors.length > optimalColorCount * 2) {
    // Too many colors (cluttered)
    colorVarietyScore = Math.max(80 - ((dominantColors.length - (optimalColorCount * 2)) / optimalColorCount) * 30, 40);
  } else {
    // Optimal range
    colorVarietyScore = 100 - Math.abs(dominantColors.length - optimalColorCount) * 5;
  }
  
  // More nuanced contrast scoring
  let contrastScore = 0;
  switch (contrast) {
    case 'High':
      contrastScore = 100;
      break;
    case 'Medium':
      contrastScore = 75;
      break;
    case 'Low':
      contrastScore = 50;
      break;
    default:
      contrastScore = (brightnessFactor && brightnessFactor > 0.5) ? 70 : 40;
  }
  
  // Enhanced color impact scoring with weighted matching
  const recommendedColors = findings.colorStats.mostCommonColorRanges;
  let colorMatchScore = 0;
  
  if (recommendedColors && recommendedColors.length > 0) {
    const matchScores = dominantColors.map(color => {
      const matchingColor = recommendedColors.find(rc => 
        rc.range.toLowerCase() === color.toLowerCase()
      );
      return matchingColor ? (matchingColor.percentage / 100) * 100 : 20; // Base score for non-matching colors
    });
    
    // Weight earlier colors (more dominant) higher
    const totalWeight = matchScores.reduce((sum, _, i) => sum + (matchScores.length - i), 0);
    colorMatchScore = matchScores.reduce((score, matchScore, i) => 
      score + matchScore * ((matchScores.length - i) / totalWeight), 0
    );
  } else {
    colorMatchScore = 50; // Default when no recommendation data
  }
  
  // Add saturation analysis if available
  let saturationScore = 75; // Default
  if (saturationLevel !== undefined) {
    // Optimal saturation is moderate to high but not excessive
    if (saturationLevel > 0.8) {
      saturationScore = 90 - ((saturationLevel - 0.8) * 100); // Penalty for oversaturation
    } else if (saturationLevel < 0.3) {
      saturationScore = 70 * (saturationLevel / 0.3); // Lower score for undersaturation
    } else {
      saturationScore = 70 + ((saturationLevel - 0.3) / 0.5) * 30; // Optimal range
    }
  }
  
  // Combine scores with adjusted weights
  const finalScore = (
    colorVarietyScore * 0.25 +
    contrastScore * 0.35 +
    colorMatchScore * 0.25 +
    saturationScore * 0.15
  );
  
  return Math.round(Math.max(0, Math.min(100, finalScore)));
}

/**
 * Calculate human element score
 * Evaluates faces, expressions, and emotional connection
 */
export function calculateFaceScore(
  faceCount: number,
  expressions: string[],
  prominence: string,
  eyeContact?: boolean,
  facePosition?: 'center' | 'left' | 'right' | 'other'
): number {
  const weights = getScoringWeights();
  const findings = getOverallFindings();
  
  // Handle no faces separately based on content category
  // Some content types don't need faces (e.g., product reviews)
  const contentRequiresFaces = true; // This should come from category data
  const facePresenceScore = faceCount > 0 ? 100 : (contentRequiresFaces ? 0 : 70);
  
  // Improved face count scoring with optimal range
  let faceCountScore = 0;
  if (faceCount === 0) {
    faceCountScore = contentRequiresFaces ? 0 : 70;
  } else {
    // For most thumbnails, 1-2 faces is optimal
    const optimalFaceCount = findings.faceStats.avgFaceCount;
    if (optimalFaceCount <= 2) {
      faceCountScore = 90 + (faceCount / 2) * 10;
    } else {
      // Diminishing returns for more faces
      faceCountScore = Math.max(100 - ((faceCount - 2) * 15), 40);
    }
  }
  
  // Enhanced prominence scoring
  let prominenceScore = 0;
  if (faceCount === 0) {
    prominenceScore = contentRequiresFaces ? 0 : 60;
  } else {
    switch (prominence) {
      case 'High':
        prominenceScore = 100;
        break;
      case 'Medium':
        prominenceScore = 80;
        break;
      case 'Low':
        prominenceScore = 60;
        break;
      default:
        prominenceScore = 50;
    }
  }
  
  // Enhanced expression impact scoring with emotion weighting
  let expressionScore = 0;
  if (faceCount > 0 && expressions.length > 0) {
    // Weight different expressions by their impact
    const expressionWeights: Record<string, number> = {
      'joy': 1.0,
      'surprise': 0.9,
      'excited': 0.9,
      'happy': 0.9,
      'neutral': 0.5,
      'confused': 0.7,
      'angry': 0.6,
      'sad': 0.4
    };
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    expressions.forEach(exp => {
      const normalizedExp = exp.toLowerCase();
      const weight = expressionWeights[normalizedExp] || 0.5;
      totalWeight += weight;
      weightedSum += weight * 100; // Each expression contributes based on its weight
    });
    
    expressionScore = totalWeight > 0 ? weightedSum / totalWeight : 50;
  } else {
    expressionScore = contentRequiresFaces ? 0 : 60;
  }
  
  // Add eye contact and position bonuses
  let positionScore = 75; // Default
  if (faceCount > 0) {
    // Eye contact bonus
    if (eyeContact === true) {
      positionScore += 15;
    } else if (eyeContact === false) {
      positionScore -= 10;
    }
    
    // Face position adjustment
    if (facePosition === 'center') {
      positionScore += 10;
    } else if (facePosition === 'right' || facePosition === 'left') {
      positionScore += 5;
    }
  }
  
  // Combine scores with adjusted weights
  let finalScore = 0;
  if (faceCount === 0 && !contentRequiresFaces) {
    // Special case for content that doesn't need faces
    finalScore = 70;
  } else {
    finalScore = (
      facePresenceScore * weights.facePresence +
      faceCountScore * 0.15 +
      prominenceScore * weights.faceCoverage +
      expressionScore * 0.25 +
      positionScore * 0.15
    ) / (weights.facePresence + 0.15 + weights.faceCoverage + 0.25 + 0.15);
  }
  
  return Math.round(Math.max(0, Math.min(100, finalScore)));
}

/**
 * Calculate composition score
 * Evaluates overall layout and balance of elements
 */
export function calculateCompositionScore(
  textScore: number,
  visualScore: number,
  faceScore: number,
  layoutType?: 'centered' | 'rule-of-thirds' | 'golden-ratio' | 'other',
  clutterFactor?: number
): number {
  // const weights = getScoringWeights();
  
  // Enhanced balance calculation with weighted variance
  const componentScores = [
    { score: textScore, weight: 0.3 },
    { score: visualScore, weight: 0.4 },
    { score: faceScore, weight: 0.3 }
  ];
  
  const weightedSum = componentScores.reduce((sum, item) => sum + item.score * item.weight, 0);
  const totalWeight = componentScores.reduce((sum, item) => sum + item.weight, 0);
  const weightedAvg = weightedSum / totalWeight;
  
  // Calculate weighted variance
  const weightedVariance = componentScores.reduce(
    (variance, item) => variance + item.weight * Math.pow(item.score - weightedAvg, 2),
    0
  ) / totalWeight;
  
  // More sophisticated balance score with diminishing penalties
  const balanceScore = Math.max(0, 100 - Math.sqrt(weightedVariance) * 0.8);
  
  // Add layout score if available
  let layoutScore = 75; // Default
  if (layoutType) {
    switch (layoutType) {
      case 'rule-of-thirds':
        layoutScore = 100;
        break;
      case 'golden-ratio':
        layoutScore = 95;
        break;
      case 'centered':
        layoutScore = 85;
        break;
      default:
        layoutScore = 70;
    }
  }
  
  // Add clutter factor if available
  let clutterScore = 80; // Default
  if (clutterFactor !== undefined) {
    // Lower is better (less cluttered)
    clutterScore = Math.max(0, 100 - (clutterFactor * 100));
  }
  
  // Enhanced composition formula with more factors
  const compositionScore = (
    textScore * 0.25 +
    visualScore * 0.30 +
    faceScore * 0.25 +
    balanceScore * 0.25 +
    layoutScore * 0.15 +
    clutterScore * 0.15
  ) / 1.35; // Normalize by total weights
  
  return Math.round(Math.max(0, Math.min(100, compositionScore)));
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
  const weights = getScoringWeights();
  
  // Calculate weighted average of all scores
  const finalScore = (
    textScore * (weights.textPresence + weights.textEntities) / 2 +
    visualScore * weights.colorScore +
    faceScore * (weights.facePresence + weights.faceCoverage) / 2 +
    compositionScore * 0.3  // 30% weight for composition
  ) / (
    (weights.textPresence + weights.textEntities) / 2 +
    weights.colorScore +
    (weights.facePresence + weights.faceCoverage) / 2 +
    0.3
  );

  return Math.round(finalScore);
}

/**
 * Recalculate all scores for an analysis result
 */
export function recalculateScores(analysisResult: AnalysisResult): AnalysisResult {
  // Calculate individual scores
  const textScore = calculateTextScore(
    analysisResult.analysis.text.detected,
    analysisResult.analysis.text.readability,
    analysisResult.analysis.text.fontSizes,
    analysisResult.analysis.text.fontContrast
  );

  const visualScore = calculateVisualScore(
    analysisResult.analysis.colors.dominant,
    analysisResult.analysis.colors.contrast,
    analysisResult.analysis.colors.brightnessFactor,
    analysisResult.analysis.colors.saturationLevel
  );

  const faceScore = calculateFaceScore(
    analysisResult.analysis.faces.count,
    analysisResult.analysis.faces.expressions,
    analysisResult.analysis.faces.prominence,
    analysisResult.analysis.faces.eyeContact,
    analysisResult.analysis.faces.position
  );

  const compositionScore = calculateCompositionScore(
    textScore,
    visualScore,
    faceScore,
    analysisResult.analysis.layoutType,
    analysisResult.analysis.clutterFactor
  );

  const overallScore = calculateOverallScore(
    textScore,
    visualScore,
    faceScore,
    compositionScore
  );

  // Get performance insights
  // const insights = getPerformanceInsights({
  //   textEntities: analysisResult.analysis.text.detected.length,
  //   colorScore: visualScore,
  //   faceCount: analysisResult.analysis.faces.count,
  //   faceCoverage: parseFloat(analysisResult.analysis.faces.prominence) || 0
  // });

  // Update the analysis result with new scores and insights
  return {
    ...analysisResult,
    scores: {
      text: textScore,
      visual: visualScore,
      faces: faceScore,
      composition: compositionScore,
      overall: overallScore
    }
  };
} 