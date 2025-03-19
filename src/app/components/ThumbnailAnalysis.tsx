'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AnalysisResult } from '../types';
import ScoreCard from './ScoreCard';
import RecommendationList from './RecommendationList';
import AnalysisDetails from './AnalysisDetails';

interface ThumbnailAnalysisProps {
  result: AnalysisResult;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function ThumbnailAnalysis({ result, activeTab, onTabChange }: ThumbnailAnalysisProps) {
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

  // Function to get color class based on score
  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  // Function to get background color class based on score
  const getScoreBgClass = (score: number) => {
    if (score >= 90) return 'bg-emerald-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 60) return 'bg-amber-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // Determine which content to display based on active tab
  const showOverview = activeTab === 'overview';
  const showDetails = activeTab === 'details';
  const showRecommendations = activeTab === 'recommendations';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      {(showOverview || showDetails || showRecommendations) && (
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Overview Content */}
          {showOverview && (
            <div className="animate-fadeIn">
              <div className="flex flex-col lg:flex-row gap-8 mb-8">
                {/* Thumbnail Image */}
                <div className="lg:w-1/2">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Your Thumbnail
                  </h2>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    {thumbnail.url && !imageError ? (
                      <Image
                        src={imageError ? getFallbackUrl(thumbnail.url) : thumbnail.url}
                        alt="Thumbnail"
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={handleImageError}
                        unoptimized={thumbnail.url.includes('youtube.com') || thumbnail.url.includes('blob.vercel-storage.com')} // Skip optimization for YouTube and Vercel Blob images
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

                {/* Overall Score Section */}
                <div className="lg:w-1/2 animation-delay-100">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Overall Performance
                  </h2>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm">
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
                            className={scores.overall >= 90 ? 'text-emerald-600' : 
                                      scores.overall >= 80 ? 'text-green-600' : 
                                      scores.overall >= 70 ? 'text-yellow-600' : 
                                      scores.overall >= 60 ? 'text-amber-600' : 
                                      scores.overall >= 50 ? 'text-orange-600' : 'text-red-600'}
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
                        <span className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold ${getScoreColorClass(scores.overall)}`}>
                          {scores.overall}
                        </span>
                      </div>
                      <div className="text-center sm:text-left">
                        <h3 className={`text-lg font-semibold mb-2 ${getScoreColorClass(scores.overall)}`}>
                          {scores.overall >= 90 ? 'Excellent!' : 
                           scores.overall >= 80 ? 'Very Good' : 
                           scores.overall >= 70 ? 'Good' : 
                           scores.overall >= 60 ? 'Average' : 
                           scores.overall >= 50 ? 'Needs Work' : 
                           'Needs Improvement'}
                        </h3>
                        <p className="text-gray-600">
                          {scores.overall >= 90 ? 'Your thumbnail follows best practices for YouTube thumbnails and should perform well.' : 
                           scores.overall >= 80 ? 'Your thumbnail is effective with just a few areas for improvement.' : 
                           scores.overall >= 70 ? 'Your thumbnail is good, but has room for improvement in key areas.' : 
                           scores.overall >= 60 ? 'Your thumbnail is average. Implementing our recommendations could significantly improve performance.' : 
                           scores.overall >= 50 ? 'Your thumbnail needs work. Following our recommendations is essential for better performance.' : 
                           'Your thumbnail needs significant improvement. Consider a complete redesign using our recommendations.'}
                        </p>
                        <div className="mt-4 text-sm">
                          <p className="font-medium text-gray-700">Potential CTR Impact:</p>
                          <p className="text-gray-600">
                            {scores.overall >= 80 ? 'High potential to outperform similar videos' : 
                             scores.overall >= 60 ? 'Moderate potential with recommended improvements' : 
                             'Low without significant changes'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Component Scores Section */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Component Scores
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animation-delay-200">
                  <ScoreCard label="Text" score={scores.text} description="Text clarity and readability" />
                  <ScoreCard label="Visual" score={scores.visual} description="Colors and visual elements" />
                  <ScoreCard label="Faces" score={scores.faces} description="Face presence and expressions" />
                  <ScoreCard label="Composition" score={scores.composition} description="Layout and design elements" />
                </div>
              </div>
              
              {/* Key Findings Summary */}
              <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Key Findings
                </h2>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-medium text-primary mb-2">Text Analysis</h3>
                    <p className="text-gray-700 mb-2">{analysis.text.readability}</p>
                    {analysis.text.detected && analysis.text.detected.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-600">Detected Text:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {analysis.text.detected.map((text, index) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              {text}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-medium text-primary mb-2">Color Analysis</h3>
                    <p className="text-gray-700 mb-2">{analysis.colors.contrast}</p>
                    {analysis.colors.dominant && analysis.colors.dominant.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-600">Dominant Colors:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {analysis.colors.dominant.map((color, index) => (
                            <div key={index} className="flex items-center">
                              <div 
                                className="w-6 h-6 rounded-full border border-gray-200 mr-1" 
                                style={{ backgroundColor: color }}
                              ></div>
                              <span className="text-xs text-gray-600">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-medium text-primary mb-2">Face Analysis</h3>
                    <p className="text-gray-700 mb-2">{analysis.faces.explanation}</p>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-600">Details:</p>
                      <ul className="mt-1 text-sm text-gray-600 space-y-1">
                        <li>Faces detected: {analysis.faces.count}</li>
                        <li>Prominence: {analysis.faces.prominence}</li>
                        {analysis.faces.expressions && analysis.faces.expressions.length > 0 && (
                          <li>Expressions: {analysis.faces.expressions.join(', ')}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Details Content */}
          {showDetails && (
            <div className="animate-fadeIn">
              <AnalysisDetails analysis={analysis} />
            </div>
          )}

          {/* Recommendations Content */}
          {showRecommendations && (
            <div className="animate-fadeIn">
              <RecommendationList recommendations={recommendations} />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 