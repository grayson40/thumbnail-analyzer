import scoringModelData from '../../../data/analysis/scoring_model.json';
import findingsData from '../../../data/analysis/findings.json';

export interface ScoringModel {
  weights: {
    textPresence: number;
    facePresence: number;
    faceCoverage: number;
    colorScore: number;
    textEntities: number;
    objectCount: number;
  };
  thresholds: {
    textPresence: boolean;
    facePresence: boolean;
    faceCoverage: number;
    colorScore: number;
    textEntities: number;
    objectCount: number;
  };
  categorySpecific: Record<string, CategoryThresholds>;
}

export interface CategoryThresholds {
  textPresence: boolean;
  facePresence: boolean;
  faceCoverage: number;
  colorScore: number;
  textEntities: number;
  objectCount: number;
  commonColors: Array<{ range: string; count: number; percentage: number }>;
  commonObjects: Array<{ name: string; count: number; percentage: number }>;
}

export interface FindingsData {
  overall: {
    count: number;
    textStats: {
      withText: number;
      withTextPercentage: number;
      avgTextEntities: number;
      avgCharCount: number;
      avgFontSize?: number;
    };
    faceStats: {
      withFaces: number;
      withFacesPercentage: number;
      avgFaceCount: number;
      avgFaceCoverage: number;
    };
    colorStats: {
      avgColorScore: number;
      mostCommonColorRanges: Array<{
        range: string;
        count: number;
        percentage: number;
      }>;
    };
  };
}

// Get the scoring weights for different aspects
export function getScoringWeights(): ScoringModel['weights'] {
  return scoringModelData.weights;
}

// Get the thresholds for different metrics
export function getThresholds(): ScoringModel['thresholds'] {
  return scoringModelData.thresholds;
}

// Get category-specific thresholds
export function getCategoryThresholds(category: string): CategoryThresholds | undefined {
  return scoringModelData.categorySpecific[category as keyof typeof scoringModelData.categorySpecific];
}

// Get overall findings statistics
export function getOverallFindings(): FindingsData['overall'] {
  return findingsData.overall;
}

// Calculate a normalized score based on a value and the findings data
export function calculateNormalizedScore(
  value: number,
  avgValue: number,
  maxBonus: number = 20
): number {
  const baseScore = 70; // Base score for average performance
  const difference = value - avgValue;
  const bonus = Math.min(Math.max((difference / avgValue) * maxBonus, -20), maxBonus);
  return Math.min(Math.max(baseScore + bonus, 0), 100);
}

// Get recommended color ranges based on findings
export function getRecommendedColors(): Array<{ range: string; percentage: number }> {
  return findingsData.overall.colorStats.mostCommonColorRanges
    .filter(color => color.percentage > 10) // Only include significant colors
    .sort((a, b) => b.percentage - a.percentage);
}

// Check if metrics are within successful thresholds
export function checkMetricsThresholds(metrics: {
  textEntities: number;
  colorScore: number;
  faceCount: number;
  faceCoverage: number;
}): Record<string, boolean> {
  const thresholds = getThresholds();
  return {
    text: metrics.textEntities >= thresholds.textEntities,
    color: metrics.colorScore >= thresholds.colorScore,
    face: metrics.faceCount > 0 === thresholds.facePresence,
    faceCoverage: metrics.faceCoverage >= thresholds.faceCoverage
  };
}

// Get performance insights based on metrics
export function getPerformanceInsights(metrics: {
  textEntities: number;
  colorScore: number;
  faceCount: number;
  faceCoverage: number;
}): string[] {
  const insights: string[] = [];
  const findings = getOverallFindings();
//   const thresholds = getThresholds();

  if (metrics.textEntities < findings.textStats.avgTextEntities) {
    insights.push('Text content is below average - consider adding more engaging text');
  }
  if (metrics.colorScore < findings.colorStats.avgColorScore) {
    insights.push('Color impact is lower than successful thumbnails - try using more vibrant colors');
  }
  if (metrics.faceCount === 0 && findings.faceStats.withFacesPercentage > 70) {
    insights.push('Most successful thumbnails include faces - consider adding human elements');
  }
  if (metrics.faceCoverage < findings.faceStats.avgFaceCoverage) {
    insights.push('Face prominence is lower than optimal - try making faces more prominent');
  }

  return insights;
} 