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
    };
    colors: {
      dominant: string[];
      contrast: string;
    };
    faces: {
      count: number;
      expressions: string[];
      prominence: string;
      explanation: string;
    };
  };
  recommendations: string[];
} 