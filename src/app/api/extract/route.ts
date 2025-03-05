import { NextRequest, NextResponse } from 'next/server';
import { extractYoutubeVideoId, getYoutubeThumbnailUrls } from '../../utils/youtube';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }
    
    const videoId = extractYoutubeVideoId(url);
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }
    
    const thumbnails = getYoutubeThumbnailUrls(videoId);
    
    // Check which thumbnails are available
    const thumbnailAvailability = await Promise.all(
      Object.entries(thumbnails).map(async ([quality, url]) => {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          return { quality, url, available: response.ok };
        } catch (error) {
          console.error('Error checking thumbnail availability:', error);
          return { quality, url, available: false };
        }
      })
    );
    
    // Get the best available thumbnail
    const availableThumbnails = thumbnailAvailability.filter(t => t.available);
    const bestThumbnail = availableThumbnails.find(t => t.quality === 'maxres') || 
                          availableThumbnails.find(t => t.quality === 'standard') || 
                          availableThumbnails.find(t => t.quality === 'high') ||
                          availableThumbnails[0];
    
    return NextResponse.json({
      videoId,
      thumbnails,
      bestThumbnail: bestThumbnail?.url || thumbnails.high,
    });
  } catch (error) {
    console.error('Error extracting YouTube thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to extract thumbnail' },
      { status: 500 }
    );
  }
} 