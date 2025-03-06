export interface ThumbnailData {
  file?: File;
  url?: string;
  youtubeId?: string;
  previewUrl?: string;
}

export interface AnalysisResult {
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  scores: {
    text: number;
    visual: number;
    faces: number;
    composition: number;
    overall: number;
  };
  analysis: {
    text: {
      detected: string[];
      readability: string;
      fontSizes?: number[];
      fontContrast?: number;
    };
    colors: {
      dominant: string[];
      contrast: string;
      brightnessFactor?: number;
      saturationLevel?: number;
    };
    faces: {
      count: number;
      expressions: string[];
      prominence: string;
      explanation: string;
      eyeContact?: boolean;
      position?: 'center' | 'left' | 'right' | 'other';
    };
    layoutType?: 'centered' | 'rule-of-thirds' | 'golden-ratio' | 'other';
    clutterFactor?: number;
  };
  recommendations: Recommendation[];
}

export interface Recommendation {
  category: 'text' | 'visual' | 'face' | 'composition' | 'color';
  action: string;
  steps: string[];
  impact: {
    metric: string;
    value: number;
    unit: '%' | 'x' | 'points';
  };
  priority: number;
  icon?: string;
  tools?: string[];
  examples?: string[];
} 