import { AnalysisResult, Recommendation } from '../types';
import { Anthropic } from '@anthropic-ai/sdk';
import {
  getOverallFindings,
  getRecommendedColors,
} from './scoringModel';

const COMPONENT_ICONS = {
  text: '🔤',
  visual: '🎨',
  face: '😀',
  composition: '📐',
  color: '🎯'
};

/**
 * Generate recommendations for a thumbnail based on analysis results
 */
export async function generateRecommendations(analysisResult: AnalysisResult): Promise<Recommendation[]> {
  try {
    // Try to use Anthropic API for smart recommendations
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });

      const findings = getOverallFindings();
      // const metrics = checkMetricsThresholds({
      //   textEntities: analysisResult.analysis.text.detected.length,
      //   colorScore: analysisResult.scores.visual,
      //   faceCount: analysisResult.analysis.faces.count,
      //   faceCoverage: parseFloat(analysisResult.analysis.faces.prominence) || 0
      // });

      // Sort components by score to prioritize recommendations
      const componentScores = [
        { component: 'text', score: analysisResult.scores.text },
        { component: 'visual', score: analysisResult.scores.visual },
        { component: 'face', score: analysisResult.scores.faces },
        { component: 'composition', score: analysisResult.scores.composition }
      ].sort((a, b) => a.score - b.score);

      const prompt = `You are a YouTube thumbnail optimization expert. Based on analysis of thousands of successful thumbnails, provide specific recommendations to improve this thumbnail.

Current Analysis:
- Text Score: ${analysisResult.scores.text}/100 (${analysisResult.analysis.text.detected.length} text elements)
- Visual Score: ${analysisResult.scores.visual}/100 (Colors: ${analysisResult.analysis.colors.dominant.join(', ')})
- Face Score: ${analysisResult.scores.faces}/100 (${analysisResult.analysis.faces.count} faces, ${analysisResult.analysis.faces.expressions.join(', ')})
- Overall Score: ${analysisResult.scores.overall}/100

Successful Thumbnail Patterns:
- Text: ${findings.textStats.withTextPercentage}% use text, avg ${findings.textStats.avgTextEntities} elements
- Faces: ${findings.faceStats.withFacesPercentage}% include faces, avg coverage ${findings.faceStats.avgFaceCoverage}%
- Colors: Most effective are ${getRecommendedColors().map(c => c.range).join(', ')}

Priority Areas (Lowest to Highest Score):
${componentScores.map(c => `- ${c.component.toUpperCase()}: ${c.score}/100`).join('\n')}

Provide 5 specific recommendations to improve this thumbnail, focusing on the lowest scoring components first. Format each recommendation exactly as follows:

CATEGORY: [One of: text, visual, face, composition, color]
ACTION: [Brief, specific action statement under 10 words]
STEPS:
• [Simple, clear step with specific details]
• [Simple, clear step with specific details]
• [Optional third step or visual reference]
IMPACT:
- Metric: [What this improves, e.g. "Click-through rate", "Engagement"]
- Value: [Numerical improvement, e.g. 75]
- Unit: [One of: %, x, points]
TOOLS: [Optional: Comma-separated list of helpful tools]
EXAMPLES: [Optional: Comma-separated list of example implementations]

Keep each recommendation under 100 words total. Be specific, practical, and data-driven.`;

      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Parse recommendations from the response
      const content = message.content[0];
      if (!content || content.type !== 'text') {
        return generateBasicRecommendations(analysisResult);
      }
      
      const recommendations = parseRecommendations(content.text, componentScores);
      return recommendations.length > 0 ? recommendations : generateBasicRecommendations(analysisResult);
    }

    // Fallback to basic recommendations if no API key
    return generateBasicRecommendations(analysisResult);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return generateBasicRecommendations(analysisResult);
  }
}

/**
 * Parse AI generated recommendations into structured format
 */
function parseRecommendations(text: string, componentScores: Array<{ component: string; score: number }>): Recommendation[] {
  // Split by category marker
  const parts = text.split('CATEGORY:').slice(1);
  
  return parts
    .map((part, index) => {
      const lines = part.trim().split('\n');
      
      // Extract category
      const category = lines[0].trim().toLowerCase() as Recommendation['category'];
      
      // Find action
      const actionLine = lines.find(line => line.trim().startsWith('ACTION:'));
      const action = actionLine ? actionLine.replace('ACTION:', '').trim() : '';
      
      // Find steps
      const stepsStartIndex = lines.findIndex(line => line.trim() === 'STEPS:');
      const stepsEndIndex = lines.findIndex(line => line.trim() === 'IMPACT:');
      const steps = stepsStartIndex !== -1 && stepsEndIndex !== -1
        ? lines
            .slice(stepsStartIndex + 1, stepsEndIndex)
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
        : [];
      
      // Find impact details
      const impactLines = lines
        .slice(stepsEndIndex + 1)
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace('-', '').trim());
      
      const impact: Recommendation['impact'] = {
        metric: '',
        value: 0,
        unit: '%'
      };
      
      impactLines.forEach(line => {
        if (line.startsWith('Metric:')) {
          impact.metric = line.replace('Metric:', '').trim();
        } else if (line.startsWith('Value:')) {
          impact.value = parseInt(line.replace('Value:', '').trim(), 10) || 0;
        } else if (line.startsWith('Unit:')) {
          const unitValue = line.replace('Unit:', '').trim();
          if (unitValue === '%' || unitValue === 'x' || unitValue === 'points') {
            impact.unit = unitValue;
          }
        }
      });
      
      // Find tools and examples
      const toolsLine = lines.find(line => line.trim().startsWith('TOOLS:'));
      const tools = toolsLine 
        ? toolsLine.replace('TOOLS:', '').trim().split(',').map(t => t.trim())
        : undefined;
      
      const examplesLine = lines.find(line => line.trim().startsWith('EXAMPLES:'));
      const examples = examplesLine
        ? examplesLine.replace('EXAMPLES:', '').trim().split(',').map(e => e.trim())
        : undefined;
      
      // Calculate priority based on component score
      const componentIndex = componentScores.findIndex(c => c.component === category);
      const priority = componentIndex !== -1 ? componentIndex + 1 : index + 1;
      
      return {
        category,
        action,
        steps,
        impact,
        priority,
        icon: COMPONENT_ICONS[category],
        tools,
        examples
      };
    })
    .filter(rec => rec.action && rec.steps.length > 0)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
}

/**
 * Generate data-driven recommendations based on analysis results
 * Used as a fallback when Anthropic API is not available
 */
function generateBasicRecommendations(analysisResult: AnalysisResult): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const findings = getOverallFindings();
  const recommendedColors = getRecommendedColors();
  
  // Text recommendations based on findings
  const textLength = analysisResult.analysis.text.detected.length;
  if (textLength < findings.textStats.avgTextEntities) {
    recommendations.push({
      category: 'text',
      action: `Add ${findings.textStats.avgTextEntities - textLength} text elements`,
      steps: [
        'Create short, impactful text overlays using a bold font',
        'Place primary text in the top third of the thumbnail',
        'Use contrasting colors for better readability'
      ],
      impact: {
        metric: 'Click-through rate',
        value: findings.textStats.withTextPercentage,
        unit: '%'
      },
      priority: 1,
      icon: COMPONENT_ICONS.text,
      tools: ['Canva', 'Adobe Express', 'Photoshop']
    });
  }

  // Color recommendations based on findings
  const currentColors = new Set(analysisResult.analysis.colors.dominant.map(c => c.toLowerCase()));
  const recommendedColorSet = new Set(recommendedColors.slice(0, 3).map(c => c.range.toLowerCase()));
  const missingTopColors = [...recommendedColorSet].filter(c => !currentColors.has(c));
  
  if (missingTopColors.length > 0) {
    recommendations.push({
      category: 'color',
      action: `Incorporate ${missingTopColors[0]} color elements`,
      steps: [
        `Add ${missingTopColors[0]} elements through text, overlays, or backgrounds`,
        'Ensure color contrast ratio is at least 4.5:1',
        'Use the color for important visual elements or text'
      ],
      impact: {
        metric: 'Visual appeal score',
        value: Math.round(recommendedColors[0].percentage),
        unit: '%'
      },
      priority: 2,
      icon: COMPONENT_ICONS.color,
      tools: ['Adobe Color', 'Coolors', 'Contrast Checker']
    });
  }

  // Face recommendations based on findings
  if (analysisResult.analysis.faces.count === 0 && findings.faceStats.withFacesPercentage > 70) {
    recommendations.push({
      category: 'face',
      action: 'Add a human face to the thumbnail',
      steps: [
        'Position face in the center-right area',
        `Ensure face covers ${Math.round(findings.faceStats.avgFaceCoverage)}% of thumbnail`,
        'Use clear, well-lit photo with good resolution'
      ],
      impact: {
        metric: 'Engagement rate',
        value: findings.faceStats.withFacesPercentage,
        unit: '%'
      },
      priority: 3,
      icon: COMPONENT_ICONS.face
    });
  } else if (analysisResult.analysis.faces.count > 0) {
    const currentCoverage = parseFloat(analysisResult.analysis.faces.prominence) || 0;
    if (currentCoverage < findings.faceStats.avgFaceCoverage) {
      recommendations.push({
        category: 'face',
        action: 'Optimize face size and placement',
        steps: [
          `Increase face size to cover ${Math.round(findings.faceStats.avgFaceCoverage)}% of thumbnail`,
          'Position face in the center-right third',
          'Ensure face is well-lit and in focus'
        ],
        impact: {
          metric: 'Viewer attention',
          value: findings.faceStats.withFacesPercentage,
          unit: '%'
        },
        priority: 3,
        icon: COMPONENT_ICONS.face
      });
    }
  }

  // Composition recommendations
  if (analysisResult.scores.composition < 70) {
    recommendations.push({
      category: 'composition',
      action: 'Improve visual hierarchy and composition',
      steps: [
        'Place text in top third of thumbnail',
        'Position faces in center-right area',
        'Use rule of thirds for main elements'
      ],
      impact: {
        metric: 'Click-through rate',
        value: 65,
        unit: '%'
      },
      priority: 4,
      icon: COMPONENT_ICONS.composition,
      tools: ['Grid overlay tool', 'Rule of thirds guide']
    });
  }

  return recommendations.slice(0, 5);
} 