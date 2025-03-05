'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { ThumbnailData } from '../types';

interface ThumbnailUploadProps {
  onSubmit: (data: ThumbnailData) => void;
  isLoading?: boolean;
}

export default function ThumbnailUpload({ onSubmit, isLoading = false }: ThumbnailUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url' | 'youtube'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const youtubeInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      
      // Reset other fields
      setUrl('');
      setYoutubeId('');
    }
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
      
      setFile(droppedFile);
      setError(null);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(droppedFile);
      setPreviewUrl(objectUrl);
      
      // Reset other fields
      setUrl('');
      setYoutubeId('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: ThumbnailData = {};
    
    if (uploadMethod === 'file' && file) {
      data.file = file;
      data.previewUrl = previewUrl || undefined;
    } else if (uploadMethod === 'url' && url) {
      data.url = url;
    } else if (uploadMethod === 'youtube' && youtubeId) {
      if (!validateYoutubeId(youtubeId)) {
        setError('Please enter a valid YouTube video ID');
        return;
      }
      data.youtubeId = youtubeId;
      data.previewUrl = previewUrl || undefined;
    } else {
      // No valid data to submit
      setError('Please provide a thumbnail to analyze');
      return;
    }
    
    setError(null);
    onSubmit(data);
  };

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
          <div 
            className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center py-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600 mb-1">Drag & drop your thumbnail here</p>
              <p className="text-xs text-gray-500 mb-3">or</p>
              <button
                type="button"
                className="bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-gray-500 mt-2">Max file size: 5MB</p>
            </div>
          </div>
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
              Analyze Thumbnail
            </>
          )}
        </button>
      </div>
    </div>
  );
} 