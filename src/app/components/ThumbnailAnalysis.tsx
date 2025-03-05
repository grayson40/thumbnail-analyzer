'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AnalysisResult } from '../types';
import ScoreCard from './ScoreCard';
import RecommendationList from './RecommendationList';
import AnalysisDetails from './AnalysisDetails';

interface ThumbnailAnalysisProps {
  result: AnalysisResult;
}

export default function ThumbnailAnalysis({ result }: ThumbnailAnalysisProps) {
  const { thumbnail, scores, recommendations, analysis } = result;
  const [imageError, setImageError] = useState(false);

  // Function to handle image loading errors
  const handleImageError = () => {
    console.log("Image failed to load:", thumbnail.url);
    setImageError(true);
  };

  // Function to get a fallback URL if the original is from YouTube
  const getFallbackUrl = (url: string) => {
    // Check if it's a YouTube URL
    if (url.includes('img.youtube.com') && url.includes('maxresdefault.jpg')) {
      // Try a different resolution
      return url.replace('maxresdefault.jpg', 'hqdefault.jpg');
    }
    return url;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">Thumbnail Analysis Results</h1>
        
        {/* Thumbnail Image */}
        <div className="mb-8 animate-fadeIn">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Thumbnail</h2>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            {thumbnail.url && !imageError ? (
              <Image
                src={imageError ? getFallbackUrl(thumbnail.url) : thumbnail.url}
                alt="Thumbnail"
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={handleImageError}
                unoptimized={thumbnail.url.includes('youtube.com')} // Skip optimization for YouTube images
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">
                  {imageError ? "Failed to load image" : "No image available"}
                </p>
              </div>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <p>Dimensions: {thumbnail.width} x {thumbnail.height} pixels</p>
            {imageError && (
              <p className="text-yellow-600 mt-1">
                Note: The original image couldn&apos;t be loaded. This may be due to YouTube&apos;s thumbnail availability.
              </p>
            )}
          </div>
        </div>
        
        {/* Fallback message if image fails to load */}
        {imageError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Thumbnail Image Unavailable</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    We couldn&apos;t load the thumbnail image. This could be because the YouTube thumbnail isn&apos;t available at the requested quality.
                  </p>
                  <p className="mt-1">
                    <strong>Dimensions:</strong> {thumbnail.width} x {thumbnail.height}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Overall Score Section */}
        <div className="mb-8 animate-fadeIn animation-delay-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Overall Score</h2>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <svg className="w-32 h-32">
                  <circle
                    className="text-gray-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-blue-600"
                    strokeWidth="10"
                    strokeDasharray={352}
                    strokeDashoffset={352 - (352 * scores.overall) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                </svg>
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-blue-700">
                  {scores.overall}
                </span>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">
                  {scores.overall >= 90 ? 'Excellent!' : 
                   scores.overall >= 80 ? 'Very Good' : 
                   scores.overall >= 70 ? 'Good' : 
                   scores.overall >= 60 ? 'Average' : 
                   scores.overall >= 50 ? 'Needs Work' : 
                   'Needs Improvement'}
                </h3>
                <p className="text-gray-600">
                  {scores.overall >= 90 ? 'Your thumbnail follows best practices for YouTube thumbnails.' : 
                   scores.overall >= 80 ? 'Your thumbnail is effective with just a few areas for improvement.' : 
                   scores.overall >= 70 ? 'Your thumbnail is good, but has room for improvement.' : 
                   scores.overall >= 60 ? 'Your thumbnail is average. Consider implementing our recommendations.' : 
                   scores.overall >= 50 ? 'Your thumbnail needs work. Follow our recommendations to improve it.' : 
                   'Your thumbnail needs significant improvement. Consider a complete redesign.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Component Scores Section */}
        <div className="mb-8 animate-fadeIn animation-delay-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Component Scores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard 
              label="Text" 
              score={scores.text} 
              description="Quality of text elements"
            />
            <ScoreCard 
              label="Visual" 
              score={scores.visual} 
              description="Visual appeal and quality"
            />
            <ScoreCard 
              label="Faces" 
              score={scores.faces} 
              description="Effectiveness of facial expressions"
            />
            <ScoreCard 
              label="Composition" 
              score={scores.composition} 
              description="Layout and visual hierarchy"
            />
          </div>
        </div>
        
        {/* Recommendations Section */}
        <div className="mb-8 animate-fadeIn animation-delay-300">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Recommendations</h2>
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 sm:p-6 shadow-sm">
            <RecommendationList recommendations={recommendations} />
          </div>
        </div>
        
        {/* Analysis Details */}
        <div className="animate-fadeIn animation-delay-400">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Detailed Analysis</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <AnalysisDetails analysis={analysis} />
          </div>
        </div>
      </div>
    </div>
  );
} 