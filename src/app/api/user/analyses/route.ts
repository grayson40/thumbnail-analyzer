import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserThumbnailAnalyses } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get pagination parameters from URL
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Validate parameters
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 50.' },
        { status: 400 }
      );
    }
    
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter. Must be a positive number.' },
        { status: 400 }
      );
    }
    
    // Get the user's analysis history
    const analyses = await getUserThumbnailAnalyses(userId, limit, offset);
    
    return NextResponse.json({
      success: true,
      analyses,
      pagination: {
        limit,
        offset,
        total: analyses.length // This is not the total count, just the number of items returned
      }
    });
  } catch (error: any) {
    console.error('Error fetching user analyses:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch user analyses',
        success: false 
      },
      { status: 500 }
    );
  }
} 