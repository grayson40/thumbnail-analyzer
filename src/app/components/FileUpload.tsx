'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Only accept image files
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      // Simulate upload process
      setIsUploading(true);
      
      setTimeout(() => {
        // Create a preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setIsUploading(false);
        setUploadSuccess(true);
        
        // Reset success state after animation
        setTimeout(() => {
          setUploadSuccess(false);
        }, 2000);
        
        // Pass the file to the parent component
        onFileSelect(file);
      }, 800);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Determine border and background color based on drag state
  const getBorderColor = () => {
    if (isDragAccept) return 'border-green-500 bg-green-50';
    if (isDragReject) return 'border-red-500 bg-red-50';
    if (isDragActive) return 'border-primary bg-blue-50';
    return 'border-gray-300 hover:border-primary hover:bg-gray-50';
  };

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`w-full p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${getBorderColor()} ${isDragActive ? 'scale-102' : ''}`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Uploading...</p>
          </div>
        ) : preview ? (
          <div className={`flex flex-col items-center ${uploadSuccess ? 'animate-scale' : 'animate-fadeIn'}`}>
            <div className="relative w-full max-w-md h-48 mb-4 group">
              <Image 
                src={preview} 
                alt="Thumbnail preview" 
                fill
                style={{ objectFit: 'contain' }}
                className="rounded shadow-md transition-transform group-hover:scale-105"
              />
              {uploadSuccess && (
                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full animate-fadeIn">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">Click or drag to replace</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <svg 
                className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-2 text-center">
              {isDragActive ? 'Drop the file here' : 'Drag & drop your thumbnail image here'}
            </p>
            <p className="text-sm text-gray-500 mb-2 text-center">or click to browse</p>
            <p className="text-xs text-gray-400 text-center">Supports JPG, PNG, GIF, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
} 