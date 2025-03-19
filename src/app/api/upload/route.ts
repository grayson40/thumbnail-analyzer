import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';

// Disable the automatic body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', authRequired: true },
        { status: 401 }
      );
    }
    
    // Parse the FormData
    const formData = await req.formData();
    
    // Get the file from FormData
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided or invalid file' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }
    
    // Create a unique file name
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}-${timestamp}.${fileExtension}`;
    
    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
    });
    
    // Return the uploaded file URL
    return NextResponse.json({
      url: blob.url,
      success: true
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to upload file',
        success: false 
      },
      { status: 500 }
    );
  }
} 