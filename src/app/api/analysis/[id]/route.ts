import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getThumbnailAnalysisById } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
    // Get the analysis ID from the URL params
    const paramValues = await params;
    const analysisId = parseInt(paramValues.id, 10);
    
    if (isNaN(analysisId) || analysisId <= 0) {
      return NextResponse.json(
        { error: 'Invalid analysis ID' },
        { status: 400 }
      );
    }
    
    // Get the analysis
    // If userId is provided, it will only return the analysis if it belongs to that user
    const analysis = await getThumbnailAnalysisById(analysisId, userId || undefined);
    
    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch analysis',
        success: false 
      },
      { status: 500 }
    );
  }
} 