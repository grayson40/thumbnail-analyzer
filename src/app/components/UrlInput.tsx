'use client';

import { useState, useRef, useEffect } from 'react';

interface UrlInputProps {
  onUrlSubmit: (url: string) => void;
}

export default function UrlInput({ onUrlSubmit }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateYoutubeUrl = (url: string): boolean => {
    // Simple validation for YouTube URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      inputRef.current?.focus();
      return;
    }
    
    if (!validateYoutubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      inputRef.current?.focus();
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Call our API endpoint to extract the thumbnail
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract thumbnail');
      }
      
      // Show success state briefly
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
      
      // Pass the URL to the parent component
      onUrlSubmit(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract thumbnail');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-focus the input field on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="animate-fadeIn">
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              id="youtube-url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              className={`w-full p-4 pl-12 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                error 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                  : isSuccess 
                    ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                    : 'border-gray-300 focus:ring-primary bg-white hover:border-primary'
              }`}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={isLoading}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${error ? 'text-red-500' : isSuccess ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            {isSuccess && (
              <div className="absolute right-14 top-1/2 transform -translate-y-1/2 animate-fadeIn">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className={`bg-primary hover:bg-primary-hover text-white font-medium py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting Thumbnail...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Extract Thumbnail
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="mt-3 text-sm text-red-600 flex items-center animate-fadeIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-500">
          <p>Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
        </div>
      </form>
    </div>
  );
} 