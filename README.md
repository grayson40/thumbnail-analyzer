# YouTube Thumbnail Analyzer

A web application that analyzes YouTube thumbnails and provides actionable recommendations to improve click-through rates.

## Features

- Upload thumbnail images or paste YouTube URLs
- Analyze thumbnails for text, colors, faces, and composition
- Score thumbnails based on best practices
- Generate actionable recommendations for improvement
- Display results in a clean, intuitive interface

## Tech Stack

- **Frontend & Backend**: Next.js
- **Styling**: Tailwind CSS
- **Image Analysis**: Google Cloud Vision API
- **Recommendations**: Anthropic API
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Vision API key
- Anthropic API key (for recommendations)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/thumbnail-analyzer.git
   cd thumbnail-analyzer
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env.local` file with your API keys
   ```
   GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key_or_path_to_credentials.json
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

4. Run the development server
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This project is configured for easy deployment on Vercel. For Google Cloud credentials, convert your JSON key file to a Base64 string and add it as an environment variable in Vercel.

## How It Works

1. User uploads a thumbnail or provides a YouTube URL
2. The app extracts and analyzes the image using Google Cloud Vision API
3. The analysis results are scored based on best practices for YouTube thumbnails
4. Recommendations are generated to help improve the thumbnail
5. Results are displayed with visual indicators and actionable advice

## License

MIT
