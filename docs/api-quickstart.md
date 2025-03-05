# API Quick Start Guide

This is a practical guide to quickly set up the APIs needed for the YouTube Thumbnail Analyzer.

## Google Cloud Vision API Setup

### Step 1: Create Google Cloud Account
1. Go to https://cloud.google.com/
2. Sign up or sign in
3. Create a new project for your thumbnail analyzer

### Step 2: Enable Vision API
1. Go to "APIs & Services" > "Library"
2. Search for "Vision API"
3. Click "Enable"

### Step 3: Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service account"
3. Fill in name and click "Create"
4. Grant "Vision API User" role
5. Click "Done"
6. Click on the service account you just created
7. Go to "Keys" tab > "Add Key" > "Create new key"
8. Choose JSON format and click "Create"
9. Save the downloaded JSON file securely

### Step 4: Set Up Environment Variable
Add to your `.env.local` file:
```
GOOGLE_APPLICATION_CREDENTIALS=path/to/your-service-account-file.json
```

### Step 5: Basic Usage in Next.js
Create `src/app/utils/vision.ts`:

```typescript
// This is the basic structure - you'll implement the actual code
async function analyzeImage(imageBuffer) {
  // Import the library
  // Initialize the client
  // Call the API with the image
  // Process and return results
}

export { analyzeImage };
```

## Anthropic API Setup

### Step 1: Create Anthropic Account
1. Go to https://console.anthropic.com/
2. Sign up or sign in

### Step 2: Get API Key
1. Click on your profile icon > "View API keys"
2. Click "Create new secret key"
3. Copy and save the key (you won't see it again)

### Step 3: Set Up Environment Variable
Add to your `.env.local` file:
```
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Step 4: Basic Usage in Next.js
Create `src/app/utils/anthropic.ts`:

```typescript
// This is the basic structure - you'll implement the actual code
async function generateRecommendations(analysisResults) {
  // Import the library
  // Initialize the client
  // Create the prompt based on analysis
  // Call the API
  // Process and return recommendations
}

export { generateRecommendations };
```

## Creating a Basic Next.js API Route

### Step 1: Create API Route for Analysis
Create `src/app/api/analyze.ts`:

```typescript
// This is the basic structure - you'll implement the actual code
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get image data from request
    // Call Vision API
    // Process results
    // Generate scores
    // Get recommendations
    // Return complete analysis
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
}
```

### Step 2: Create API Route for YouTube URL
Create `src/app/api/extract.ts`:

```typescript
// This is the basic structure - you'll implement the actual code
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get YouTube URL from request
    // Extract video ID using regex
    // Construct thumbnail URL
    // Return video info
  } catch (error) {
    console.error('Error extracting thumbnail:', error);
    res.status(500).json({ error: 'Failed to extract thumbnail' });
  }
}
```

## Testing Your API Setup

### Test Vision API
1. Create a simple test script or use Postman
2. Send a sample image to your API endpoint
3. Check that text detection, color analysis, and face detection work

### Test Anthropic API
1. Create a simple test with sample analysis data
2. Send it to your API endpoint
3. Verify recommendation quality

### Test YouTube URL Extraction
1. Test with different YouTube URL formats
2. Verify correct thumbnail extraction

## Tips for API Implementation

1. **Start Small**: Begin with one API feature at a time
2. **Log Everything**: Use console.log to track API responses
3. **Handle Errors**: Always include try/catch blocks
4. **Offline Testing**: Consider saving sample API responses for development
5. **Rate Limits**: Be aware of API usage limits (especially on free tiers)