/**
 * Extracts the video ID from a YouTube URL
 */
export function extractYoutubeVideoId(url: string): string | null {
  // Match YouTube URL patterns
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[7].length === 11) ? match[7] : null;
}

/**
 * Gets thumbnail URLs for a YouTube video
 */
export function getYoutubeThumbnailUrls(videoId: string) {
  return {
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
    medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  };
}

/**
 * Fetches the best available thumbnail for a YouTube video
 */
export async function getBestThumbnail(videoId: string): Promise<string> {
  const thumbnails = getYoutubeThumbnailUrls(videoId);
  
  // Try to get the highest quality thumbnail available
  // YouTube doesn't always have maxres or standard thumbnails for all videos
  try {
    // First try high quality which almost always exists
    // and is more reliable than trying maxres first
    return thumbnails.high;
    
    // Note: The following code is commented out because it can cause issues
    // with Next.js Image component and unnecessary HEAD requests
    /*
    // Check if maxres thumbnail exists
    const maxresResponse = await fetch(thumbnails.maxres, { method: 'HEAD' });
    if (maxresResponse.ok) return thumbnails.maxres;
    
    // Check if standard thumbnail exists
    const standardResponse = await fetch(thumbnails.standard, { method: 'HEAD' });
    if (standardResponse.ok) return thumbnails.standard;
    
    // Fall back to high quality which always exists
    return thumbnails.high;
    */
  } catch (error) {
    // If any error occurs, fall back to high quality
    console.error('Error fetching YouTube thumbnail:', error);
    return thumbnails.high;
  }
} 