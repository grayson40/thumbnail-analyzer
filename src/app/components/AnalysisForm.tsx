'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import { useRef } from 'react';
import FileUpload from './FileUpload';

export default function AnalysisForm() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();

  // Handle file selection from FileUpload component
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    
    // Create a local preview
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!url && !file) {
      setError('Please enter a YouTube URL or upload a thumbnail image');
      return;
    }
    
    setIsLoading(true);

    try {
      let response;
      
      if (file) {
        // If we have a file, send it directly to the analyze endpoint
        const formData = new FormData();
        formData.append('file', file);
        
        response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
      } else if (url) {
        // If we have a URL, send it as JSON
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });
      }
      
      if (!response) {
        throw new Error('No file or URL provided');
      }
      
      const result = await response.json();
      
      // Check for specific errors first before proceeding
      if (!response.ok) {
        if (result.limitExceeded) {
          setError('Daily analysis limit reached. Please try again tomorrow.');
          setIsLoading(false);
          return; // Stop here - don't proceed to the success handling
        } else if (result.authRequired) {
          setError('Please sign in to analyze thumbnails');
          setIsLoading(false);
          return; // Stop here - don't proceed to the success handling
        } else {
          throw new Error(result.error || 'Analysis failed');
        }
      }
      
      // If we get here, the request was successful
      if (result.success) {
        // Store the result in localStorage for the results page
        localStorage.setItem('analysisResult', JSON.stringify(result));
        
        // Redirect to results page
        router.push('/results');
      } else {
        // Handle other errors
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      setError(error.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Analyze Your Thumbnail</h2>
      
      {/* YouTube URL Input */}
      <div className="mb-6">
        <label htmlFor="url" className="block text-sm font-medium mb-2 text-gray-700">
          YouTube URL (optional)
        </label>
        <input
          type="url"
          id="url"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setFile(null);
          }}
          disabled={isLoading}
        />
      </div>
      
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Or Upload Thumbnail Image
        </label>
        <FileUpload onFileSelect={handleFileSelect} />
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md bg-primary text-white font-medium transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            'Analyze Thumbnail'
          )}
        </button>
      </div>
    </form>
  );
} 