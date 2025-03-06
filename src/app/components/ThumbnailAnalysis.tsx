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
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'details'>('overview');

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

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Top Section with Thumbnail and Overall Score */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          {/* Thumbnail Image */}
          <div className="lg:w-1/2 animate-fadeIn">
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

          {/* Overall Score Section */}
          <div className="lg:w-1/2 animate-fadeIn animation-delay-100">
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
        <div className="mb-8 animate-fadeIn animation-delay-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Performance Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard 
              label="Text" 
              score={scores.text} 
              description="Quality and readability of text elements"
            />
            <ScoreCard 
              label="Visual" 
              score={scores.visual} 
              description="Color usage and visual appeal"
            />
            <ScoreCard 
              label="Faces" 
              score={scores.faces} 
              description="Effectiveness of human elements"
            />
            <ScoreCard 
              label="Composition" 
              score={scores.composition} 
              description="Layout and visual hierarchy"
            />
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recommendations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recommendations
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Detailed Analysis
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold mb-3 text-blue-800">Key Findings</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-blue-800">
                      <strong>Text: </strong> 
                      {scores.text >= 80 ? 'Excellent text usage with clear readability.' : 
                       scores.text >= 60 ? 'Good text elements, but could be improved for better readability.' : 
                       'Text elements need significant improvement for better viewer engagement.'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-blue-800">
                      <strong>Visual: </strong> 
                      {scores.visual >= 80 ? 'Strong visual appeal with effective color usage.' : 
                       scores.visual >= 60 ? 'Decent visual elements, but color contrast could be improved.' : 
                       'Visual elements need significant enhancement for better viewer attraction.'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-blue-800">
                      <strong>Faces: </strong> 
                      {scores.faces >= 80 ? 'Excellent use of facial expressions to engage viewers.' : 
                       scores.faces >= 60 ? 'Faces present but could be more engaging or prominent.' : 
                       analysis.faces.count > 0 ? 'Facial expressions need improvement for better emotional connection.' : 
                       'No faces detected. Consider adding human elements for better engagement.'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-blue-800">
                      <strong>Composition: </strong> 
                      {scores.composition >= 80 ? 'Excellent layout with clear visual hierarchy.' : 
                       scores.composition >= 60 ? 'Good composition, but could be more balanced.' : 
                       'Composition needs significant improvement for better visual flow.'}
                    </span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-lg font-semibold mb-3 text-green-800">CTR Impact Potential</h3>
                <p className="text-green-800 mb-4">
                  Based on our analysis, implementing our recommendations could potentially increase your click-through rate by:
                </p>
                <div className="flex justify-center">
                  <div className={`text-center px-6 py-3 rounded-lg ${getScoreBgClass(scores.overall)} ${getScoreColorClass(scores.overall)} font-bold text-xl`}>
                    {scores.overall >= 90 ? '10-15%' : 
                     scores.overall >= 80 ? '15-25%' : 
                     scores.overall >= 70 ? '25-40%' : 
                     scores.overall >= 60 ? '40-60%' : 
                     scores.overall >= 50 ? '60-80%' : '80-100%+'}
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-4 text-center">
                  *Estimated improvement based on industry benchmarks and our analysis algorithm
                </p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                <h3 className="text-lg font-semibold mb-4 text-purple-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Top Priority Improvements
                </h3>
                <div className="space-y-4">
                  {recommendations.slice(0, 3).map((recommendation, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-700 font-semibold">{index + 1}</span>
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {recommendation.action}
                          </h4>
                          {recommendation.steps && recommendation.steps.length > 0 && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-600 space-y-1">
                                {recommendation.steps.map((step, stepIndex) => (
                                  <div key={stepIndex} className="flex items-start">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center mr-2 mt-0.5 text-xs font-medium text-purple-700">
                                      {stepIndex + 1}
                                    </span>
                                    <span>{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {recommendation.impact && (
                            <div className="bg-purple-50 rounded p-2 text-sm text-purple-700">
                              <strong>Impact:</strong> {recommendation.impact.metric}: {recommendation.impact.value}{recommendation.impact.unit}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setActiveTab('recommendations')} 
                    className="inline-flex items-center text-purple-700 font-medium hover:text-purple-900 transition-colors"
                  >
                    <span>View All Recommendations</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* New Premium Call-to-Action Section */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-2/3 mb-4 md:mb-0 md:pr-6">
                    <h3 className="text-xl font-bold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Boost Your YouTube Success
                    </h3>
                    <p className="mb-3 text-indigo-100">
                      Want to take your YouTube channel to the next level? Our premium services offer personalized thumbnail design, channel audits, and growth strategies.
                    </p>
                    <ul className="space-y-1 mb-4">
                      <li className="flex items-center text-indigo-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Professional thumbnail design by experts
                      </li>
                      <li className="flex items-center text-indigo-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Channel audit with actionable growth strategies
                      </li>
                      <li className="flex items-center text-indigo-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Personalized content strategy consultation
                      </li>
                    </ul>
                  </div>
                  <div className="md:w-1/3 flex justify-center">
                    <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 transform hover:scale-105">
                      Explore Premium Services
                    </button>
                  </div>
                </div>
              </div>

              {/* New Comparison Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Before & After Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <h4 className="font-medium text-red-800 mb-2">Before Optimization</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Lower click-through rates
                      </li>
                      <li className="flex items-center text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Fewer impressions lead to clicks
                      </li>
                      <li className="flex items-center text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Slower channel growth
                      </li>
                    </ul>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <h4 className="font-medium text-green-800 mb-2">After Optimization</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Increased CTR by {scores.overall >= 90 ? '10-15%' : 
                                          scores.overall >= 80 ? '15-25%' : 
                                          scores.overall >= 70 ? '25-40%' : 
                                          scores.overall >= 60 ? '40-60%' : 
                                          scores.overall >= 50 ? '60-80%' : '80-100%+'}
                      </li>
                      <li className="flex items-center text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        More views from the same impressions
                      </li>
                      <li className="flex items-center text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Accelerated channel growth and engagement
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'recommendations' && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 shadow-sm">
              <RecommendationList recommendations={recommendations} />
              <div className="mt-8 bg-white p-4 rounded-lg border border-amber-100">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Implementation Guide</h3>
                <p className="text-gray-600 mb-4">
                  Follow these steps to implement our recommendations effectively:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Prioritize recommendations based on your current score in each category</li>
                  <li>Use design tools like Canva or Photoshop to make the suggested changes</li>
                  <li>Test your new thumbnail with a small audience before publishing</li>
                  <li>Monitor performance after implementation and make further adjustments if needed</li>
                  <li>Return to analyze your updated thumbnail for further improvements</li>
                </ol>
              </div>
            </div>
          )}
          
          {activeTab === 'details' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <AnalysisDetails analysis={analysis} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 