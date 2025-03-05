'use client';

import React from 'react';

interface RecommendationListProps {
  recommendations: string[];
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Recommendations</h2>
        <p className="text-gray-500">No recommendations available.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-amber-800">How to Improve Your Thumbnail</h3>
      <ul className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <li key={index} className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
              <span className="text-amber-700 font-semibold">{index + 1}</span>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-amber-100 flex-grow">
              <p className="text-gray-700">{recommendation}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-sm text-gray-600">
        <p>Implementing these changes could significantly improve your click-through rate.</p>
      </div>
    </div>
  );
} 