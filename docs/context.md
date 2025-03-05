# YouTube Thumbnail Analyzer - Solo Dev Guide

## Project Overview
A simple web app that analyzes YouTube thumbnails and gives creators suggestions to improve them for better click-through rates.

## Tech Stack
- **Frontend & Backend**: Next.js
- **Styling**: Tailwind CSS
- **Image Analysis**: Google Cloud Vision API
- **Recommendations**: Anthropic API
- **Hosting**: Vercel (free tier)

## Core Features
1. Upload thumbnail image or paste YouTube URL
2. Analyze image for key elements (text, colors, faces)
3. Score the thumbnail based on best practices
4. Generate actionable recommendations
5. Display results in a clean, simple interface

## Simplified File Structure
```
thumbnail-analyzer/
├── pages/
│   ├── index.js (homepage with upload form)
│   ├── results.js (analysis results page)
│   └── api/
│       ├── analyze.js (Vision API integration)
│       └── extract.js (YouTube URL handling)
├── components/
│   ├── FileUpload.js (drag-and-drop uploader)
│   ├── UrlInput.js (YouTube URL input)
│   ├── ScoreCard.js (displays individual scores)
│   ├── AnalysisResults.js (main results container)
│   └── Recommendation.js (displays suggestions)
├── utils/
│   ├── vision.js (Google Cloud functions)
│   ├── anthropic.js (Anthropic functions)
│   ├── scoring.js (scoring algorithm)
│   └── youtube.js (YouTube URL parsing)
├── styles/
│   └── globals.css (Tailwind imports)
└── public/
    └── images/ (example thumbnails, icons)
```

## Main Data Objects

### Thumbnail Data
- Image file or YouTube URL
- Extracted image data

### Analysis Results
- Text detected (content, position)
- Colors (dominant colors, contrast)
- Faces (presence, expressions)
- Component scores (text, visual, composition)
- Overall score
- Recommendations for improvement

## API Keys Needed
1. Google Cloud Vision API key
2. Anthropic API key

## User Flow
1. User uploads thumbnail or pastes YouTube URL
2. System analyzes the image
3. Results page shows scores and recommendations
4. User can implement changes based on suggestions

## MVP Focus
- Keep it simple and functional
- Focus on accurate analysis and helpful recommendations
- Minimal styling but clean interface
- Quick to implement (1-2 weeks for solo dev)