'use client';

import React, { useState } from 'react';
import { Recommendation } from '../types';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Recommendations</h2>
        <p className="text-gray-500">No recommendations available.</p>
      </div>
    );
  }

  // Toggle expanded state for a recommendation
  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Function to get background color for category
  const getCategoryBgColor = (category: Recommendation['category']) => {
    switch (category) {
      case 'text':
        return 'bg-blue-50 border-blue-100';
      case 'visual':
        return 'bg-purple-50 border-purple-100';
      case 'face':
        return 'bg-green-50 border-green-100';
      case 'composition':
        return 'bg-amber-50 border-amber-100';
      case 'color':
        return 'bg-rose-50 border-rose-100';
    }
  };

  // Function to get text color for category
  const getCategoryTextColor = (category: Recommendation['category']) => {
    switch (category) {
      case 'text':
        return 'text-blue-800';
      case 'visual':
        return 'text-purple-800';
      case 'face':
        return 'text-green-800';
      case 'composition':
        return 'text-amber-800';
      case 'color':
        return 'text-rose-800';
    }
  };

  // Function to get accent color for category
  const getCategoryAccentColor = (category: Recommendation['category']) => {
    switch (category) {
      case 'text':
        return 'bg-blue-600';
      case 'visual':
        return 'bg-purple-600';
      case 'face':
        return 'bg-green-600';
      case 'composition':
        return 'bg-amber-600';
      case 'color':
        return 'bg-rose-600';
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-amber-800 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Premium Recommendations
      </h3>
      <p className="text-gray-600 mb-6">
        Based on our AI-powered analysis, here are actionable recommendations to improve your thumbnail&apos;s performance:
      </p>
      <ul className="space-y-4">
        {recommendations.map((recommendation, index) => {
          const isExpanded = expandedIndex === index;
          
          return (
            <li key={index} className={`border rounded-lg overflow-hidden transition-all duration-300 ${getCategoryBgColor(recommendation.category)}`}>
              <div className="flex items-start p-4 cursor-pointer"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm">
                  {recommendation.icon && (
                    <span className="text-xl">{recommendation.icon}</span>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-medium ${getCategoryTextColor(recommendation.category)}`}>
                        {recommendation.action}
                      </p>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          getCategoryBgColor(recommendation.category)
                        }`}>
                          {recommendation.category}
                        </span>
                      </div>
                    </div>
                    <button className="ml-2 flex-shrink-0 text-gray-500 hover:text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 bg-white/80 border-t border-gray-100">
                  <div className="space-y-4">
                    {/* Steps Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Implementation Steps
                      </h4>
                      <ul className="space-y-2">
                        {recommendation.steps.map((step, i) => (
                          <li key={i} className="flex items-start">
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full ${getCategoryBgColor(recommendation.category)} flex items-center justify-center mr-2 mt-0.5 text-xs font-medium`}>
                              {i + 1}
                            </span>
                            <span className="text-sm text-gray-600">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Impact Section */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        Expected Impact
                      </h4>
                      <p className="text-sm text-gray-600">
                        {recommendation.impact.metric}: {recommendation.impact.value}{recommendation.impact.unit}
                      </p>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${getCategoryAccentColor(recommendation.category)}`} 
                            style={{ width: `${Math.min(100, recommendation.impact.value)}%` }}>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tools Section */}
                    {recommendation.tools && recommendation.tools.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          Helpful Tools
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {recommendation.tools.map((tool, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Examples Section */}
                    {recommendation.examples && recommendation.examples.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                          </svg>
                          Examples
                        </h4>
                        <div className="text-sm text-gray-600">
                          {recommendation.examples.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
} 