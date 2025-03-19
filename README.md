# YouTube Thumbnail Analyzer

An AI-powered tool to analyze YouTube thumbnails and provide optimization recommendations.

## Features

- Upload a thumbnail image, paste a URL, or enter a YouTube video ID
- AI analysis of text content, colors, faces, and composition
- Detailed scores and recommendations to improve CTR
- 1 free analysis per day with user account

## Database Setup

Before running the application, you need to set up the database:

1. Make sure your PostgreSQL database connection is properly configured in your `.env` file:

```bash
POSTGRES_URL="your-postgres-connection-string"
```

2. Build the application:

```bash
npm run build
```

3. Initialize the database schema:

```bash
npm run init-db
```

This will create the necessary tables to track user analysis usage.

## Getting Started

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your environment variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
POSTGRES_URL="your-postgres-connection-string"
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- Next.js
- Clerk for authentication
- Vercel Postgres for database
- Tailwind CSS for styling

## Deployment

This project is configured for easy deployment on Vercel. For Google Cloud credentials, convert your JSON key file to a Base64 string and add it as an environment variable in Vercel.

## How It Works

1. User uploads a thumbnail or provides a YouTube URL
2. The app extracts and analyzes the image using Google Cloud Vision API
3. The analysis results are scored based on best practices for YouTube thumbnails
4. Recommendations are generated to help improve the thumbnail
5. Results are displayed with visual indicators and actionable advice

## Image Upload Storage Configuration

This application uses Vercel Blob Storage for handling image uploads. To set it up:

1. Install the Vercel CLI if you haven't already:
   ```
   npm i -g vercel
   ```

2. Link your project to Vercel:
   ```
   vercel link
   ```

3. Add the Blob Storage to your project:
   ```
   vercel integrations add vercel-blob
   ```

4. Get your Blob Storage token:
   ```
   vercel env pull .env.local
   ```

5. Or manually create a `.env.local` file with the following:
   ```
   BLOB_READ_WRITE_TOKEN=your_token_from_vercel_dashboard
   ```

6. You can get this token from the Vercel dashboard:
   - Go to your project
   - Navigate to Storage
   - Select Blob
   - Copy the read-write token

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

The easiest way to deploy this app is using Vercel:

```
vercel --prod
```

Make sure to configure the `BLOB_READ_WRITE_TOKEN` environment variable in your production environment as well.

## License

MIT
