'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { ThumbnailData } from '../types';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { getUserDailyAnalysisCount } from '@/lib/db/index';
import AuthModal from './AuthModal';
import FileUpload from './FileUpload';

interface ThumbnailUploadProps {
  onSubmit: (data: ThumbnailData) => void;
  isLoading?: boolean;
  buttonText?: string;
}

export default function ThumbnailUpload({ onSubmit, isLoading = false, buttonText = "Analyze Thumbnail" }: ThumbnailUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url' | 'youtube'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisWarning, setAnalysisWarning] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingData, setPendingData] = useState<ThumbnailData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const youtubeInputRef = useRef<HTMLInputElement>(null);
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();

  // Check if user has already used their daily analysis
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      const checkAnalysisCount = async () => {
        try {
          const count = await getUserDailyAnalysisCount(userId);
          if (count >= 1) {
            setAnalysisWarning('You have already used your 1 free analysis for today.');
          } else {
            setAnalysisWarning(null);
          }
        } catch (error) {
          console.error('Error checking analysis count:', error);
        }
      };
      
      checkAnalysisCount();
    }
  }, [isLoaded, isSignedIn, userId]);

  // Store pending data in sessionStorage to persist across page refreshes
  useEffect(() => {
    // Store pending data in sessionStorage if available
    if (pendingData) {
      try {
        // We can't directly store File objects, so we'll only store URL data
        const storableData: Record<string, string> = {};
        if (pendingData.url) storableData.url = pendingData.url;
        if (pendingData.youtubeId) storableData.youtubeId = pendingData.youtubeId;
        if (pendingData.previewUrl) storableData.previewUrl = pendingData.previewUrl;
        
        sessionStorage.setItem('pendingAnalysisData', JSON.stringify(storableData));
        console.log('Stored pending data in sessionStorage:', storableData);
      } catch (error) {
        console.error('Error storing pending data:', error);
      }
    }
  }, [pendingData]);

  // Load pending data from sessionStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined' && !pendingData) {
      try {
        const storedData = sessionStorage.getItem('pendingAnalysisData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log('Retrieved pending data from sessionStorage:', parsedData);
          
          if (Object.keys(parsedData).length > 0) {
            setPendingData(parsedData);
          }
        }
      } catch (error) {
        console.error('Error retrieving pending data:', error);
      }
    }
  }, []);

  // Submit analysis when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn && pendingData) {
      console.log('User is signed in and has pending data, submitting analysis');
      
      // Close the auth modal
      setShowAuthModal(false);
      
      // Clear the stored pending data
      sessionStorage.removeItem('pendingAnalysisData');
      
      // Submit the analysis data
      onSubmit(pendingData);
      setPendingData(null);
      
      // Show a welcome toast for new sign-ins
      const isNewSignIn = sessionStorage.getItem('isNewSignIn') === 'true';
      if (isNewSignIn) {
        // Clear the flag
        sessionStorage.removeItem('isNewSignIn');
        // We'll let the parent component handle the welcome toast
      }
    }
  }, [isLoaded, isSignedIn, pendingData, onSubmit]);

  // Listen for Clerk auth state changes via URL hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleHashChange = () => {
        // Check if the hash contains Clerk's status indicator
        const hash = window.location.hash;
        console.log('Hash changed:', hash);
        
        if (hash.includes('__clerk_status=')) {
          // Set flag to show welcome message for new sign-in
          sessionStorage.setItem('isNewSignIn', 'true');
          
          // Clean up URL by removing the hash
          history.replaceState(null, '', window.location.pathname);
          
          // Force a check for auth status after a small delay
          // This ensures Clerk has had time to update the auth state
          setTimeout(() => {
            console.log('Checking auth status after hash change, isSignedIn:', isSignedIn);
            if (isSignedIn && pendingData) {
              console.log('User authenticated, submitting pending analysis:', pendingData);
              setShowAuthModal(false);
              onSubmit(pendingData);
              setPendingData(null);
            } else if (isSignedIn) {
              console.log('User authenticated but no pending data');
              setShowAuthModal(false);
            } else {
              console.log('Auth state changed but user not signed in yet, will check again in 1 second');
              // Try again after a delay to give Clerk more time
              setTimeout(() => {
                if (isSignedIn && pendingData) {
                  console.log('User authenticated on second check, submitting analysis');
                  setShowAuthModal(false);
                  onSubmit(pendingData);
                  setPendingData(null);
                }
              }, 1000);
            }
          }, 100);
        }
      };
      
      // Check on initial load
      handleHashChange();
      
      // Add listener for hash changes
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [isSignedIn, pendingData, onSubmit]);

  // Focus the appropriate input when switching methods
  useEffect(() => {
    setTimeout(() => {
      if (uploadMethod === 'url' && urlInputRef.current) {
        urlInputRef.current.focus();
      } else if (uploadMethod === 'youtube' && youtubeInputRef.current) {
        youtubeInputRef.current.focus();
      }
    }, 100);
  }, [uploadMethod]);

  const resetForm = () => {
    setFile(null);
    setUrl('');
    setYoutubeId('');
    setPreviewUrl(null);
    setError(null);
  };

  const handleMethodChange = (method: 'file' | 'url' | 'youtube') => {
    setUploadMethod(method);
    resetForm();
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    
    // Create a local preview
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    
    // Reset other fields
    setUrl('');
    setYoutubeId('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Check if it's an image
      if (!droppedFile.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      // Check file size (5MB limit)
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      
      handleFileSelect(droppedFile);
    }
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (e.target.value) {
      setPreviewUrl(e.target.value);
      setError(null);
    } else {
      setPreviewUrl(null);
    }
    setFile(null);
    setYoutubeId('');
  };

  const validateYoutubeId = (id: string): boolean => {
    // YouTube IDs are typically 11 characters
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  };

  const handleYoutubeIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value.trim();
    setYoutubeId(id);
    
    if (id && validateYoutubeId(id)) {
      // Set a preview URL for the YouTube thumbnail
      const previewUrl = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      setPreviewUrl(previewUrl);
    } else {
      setPreviewUrl(null);
    }
    
    setFile(null);
    setUrl('');
  };

  // Add validateUrl function near the other validation functions
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Add this helper function to handle analysis submission with proper error handling
  const submitAnalysis = async (data: ThumbnailData) => {
    try {
      // Prepare the request based on the data we have
      let response;
      
      if (data.file) {
        // If we have a file, send it as form data
        const formData = new FormData();
        formData.append('file', data.file);
        
        response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
      } else if (data.url) {
        // If we have a URL, send it as JSON
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: data.url }),
        });
      } else if (data.youtubeId) {
        // If we have a YouTube ID, construct a URL and send as JSON
        const youtubeUrl = `https://img.youtube.com/vi/${data.youtubeId}/maxresdefault.jpg`;
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: youtubeUrl }),
        });
      } else {
        throw new Error('No valid data for analysis');
      }
      
      if (!response) {
        throw new Error('Failed to send analysis request');
      }
      
      const result = await response.json();
      
      // Handle the response
      if (response.ok) {
        return { success: true, data: result };
      } else {
        // Handle specific error types
        if (result.limitExceeded) {
          return { 
            success: false, 
            error: 'Daily analysis limit reached. Please try again tomorrow.',
            limitExceeded: true 
          };
        } else if (result.authRequired) {
          return { 
            success: false, 
            error: 'Authentication required',
            authRequired: true 
          };
        } else {
          return { 
            success: false, 
            error: result.error || 'Analysis failed' 
          };
        }
      }
    } catch (error: any) {
      console.error('Error submitting analysis:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to analyze thumbnail' 
      };
    }
  };

  // Update the handleSubmit function to use the new helper
  const handleSubmit = async () => {
    console.log('ThumbnailUpload - handleSubmit called with method:', uploadMethod);
    
    // Prepare data based on upload method
    let data: ThumbnailData = {};
    let isValid = true;
    let validationError = '';

    if (uploadMethod === 'file' && file) {
      console.log('ThumbnailUpload - Submitting file:', file.name);
      data = { file, previewUrl: previewUrl || undefined };
    } else if (uploadMethod === 'url' && url) {
      console.log('ThumbnailUpload - Submitting URL:', url);
      data = { url, previewUrl: previewUrl || undefined };
    } else if (uploadMethod === 'youtube' && youtubeId) {
      console.log('ThumbnailUpload - Submitting YouTube ID:', youtubeId);
      
      // Basic YouTube ID validation
      const youtubeIdRegex = /^[a-zA-Z0-9_-]{11}$/;
      if (youtubeIdRegex.test(youtubeId)) {
        data = { youtubeId, previewUrl: previewUrl || undefined };
      } else {
        isValid = false;
        validationError = 'Please enter a valid YouTube video ID (11 characters)';
      }
    } else {
      isValid = false;
      validationError = 'Please select a thumbnail to analyze';
    }

    if (!isValid) {
      setError(validationError);
      if (typeof window !== 'undefined') {
        const errorElement = document.getElementById('thumbnail-error');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setError(null);
    
    // Check if user is authenticated
    if (!isSignedIn) {
      // Store pending data and show auth modal
      console.log('User not signed in - storing data and showing auth modal');
      
      // Store data in sessionStorage for persistence
      try {
        const storableData: Record<string, string> = {};
        if (data.url) storableData.url = data.url;
        if (data.youtubeId) storableData.youtubeId = data.youtubeId;
        if (data.previewUrl) storableData.previewUrl = data.previewUrl;
        storableData.uploadMethod = uploadMethod;
        
        sessionStorage.setItem('pendingAnalysisData', JSON.stringify(storableData));
      } catch (error) {
        console.error('Error storing pending data:', error);
      }
      
      setPendingData(data);
      setShowAuthModal(true);
      return;
    }
    
    // If the user is already signed in, submit directly
    console.log('User signed in - submitting analysis directly');
    onSubmit(data);
  };

  // Check for pending uploads on initial render
  useEffect(() => {
    // This will leverage the session storage from the Home component
    // The data will be processed there based on authentication state
    try {
      const storedData = sessionStorage.getItem('pendingAnalysisData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('ThumbnailUpload - Found stored data:', parsedData);
        
        if (parsedData.uploadMethod) {
          console.log('ThumbnailUpload - Setting upload method to:', parsedData.uploadMethod);
          setUploadMethod(parsedData.uploadMethod);
          
          if (parsedData.url) {
            setUrl(parsedData.url);
            if (validateUrl(parsedData.url)) {
              // Set preview directly if we already have it
              if (parsedData.previewUrl) {
                setPreviewUrl(parsedData.previewUrl);
              } else {
                // Otherwise try to generate a preview
                setPreviewUrl(parsedData.url);
              }
            }
          }
          
          if (parsedData.youtubeId) {
            setYoutubeId(parsedData.youtubeId);
            
            if (parsedData.previewUrl) {
              setPreviewUrl(parsedData.previewUrl);
            } else {
              // Generate YouTube preview URL
              const youtubePreviewUrl = `https://img.youtube.com/vi/${parsedData.youtubeId}/hqdefault.jpg`;
              setPreviewUrl(youtubePreviewUrl);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error retrieving pending data in ThumbnailUpload:', error);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row">
      {/* Left side - Upload methods */}
      <div className="md:w-1/2 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-200">
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              uploadMethod === 'file'
                ? 'bg-white shadow-sm text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleMethodChange('file')}
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              File
            </div>
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              uploadMethod === 'url'
                ? 'bg-white shadow-sm text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleMethodChange('url')}
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              URL
            </div>
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              uploadMethod === 'youtube'
                ? 'bg-white shadow-sm text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleMethodChange('youtube')}
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              YouTube
            </div>
          </button>
        </div>

        {/* File Upload */}
        {uploadMethod === 'file' && (
          <FileUpload onFileSelect={handleFileSelect} />
        )}

        {/* URL Input */}
        {uploadMethod === 'url' && (
          <div className="space-y-3">
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700">
              Enter image URL:
            </label>
            <input
              id="url-input"
              ref={urlInputRef}
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-gray-800"
              value={url}
              onChange={handleUrlChange}
            />
            <p className="text-xs text-gray-500">
              Enter a direct link to an image file (JPG, PNG, etc.)
            </p>
          </div>
        )}

        {/* YouTube ID Input */}
        {uploadMethod === 'youtube' && (
          <div className="space-y-3">
            <label htmlFor="youtube-input" className="block text-sm font-medium text-gray-700">
              Enter YouTube Video ID:
            </label>
            <input
              id="youtube-input"
              ref={youtubeInputRef}
              type="text"
              placeholder="dQw4w9WgXcQ"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-gray-800"
              value={youtubeId}
              onChange={handleYoutubeIdChange}
            />
            <p className="text-xs text-gray-500">
              Enter the YouTube video ID (e.g., dQw4w9WgXcQ from https://www.youtube.com/watch?v=dQw4w9WgXcQ)
            </p>
            <p className="text-xs text-yellow-600">
              Note: YouTube thumbnails may not always be available at the highest quality.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Right side - Preview and Analyze button */}
      <div className="md:w-1/2 p-4 md:p-6 flex flex-col">
        <div className="flex-grow">
          {previewUrl ? (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={previewUrl} 
                  alt="Thumbnail preview" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <p className="text-sm text-gray-500">Thumbnail preview will appear here</p>
            </div>
          )}
        </div>

        {/* Analysis Warning */}
        {analysisWarning && isSignedIn && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {analysisWarning}
          </div>
        )}

        {/* Analyze Button - Always visible */}
        <button 
          className={`w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          onClick={handleSubmit}
          disabled={isLoading || (!file && !url && !youtubeId)}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
              {buttonText}
            </>
          )}
        </button>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultView="signUp"
          onAuthSuccess={() => {
            console.log('Auth success in ThumbnailUpload, proceeding with submission');
            setShowAuthModal(false);
            // The Home component will handle processing the analysis after auth
          }}
        />
      )}
    </div>
  );
} 