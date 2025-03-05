'use client';

import React from 'react';

interface ScoreCardProps {
  label: string;
  score: number;
  description?: string;
  isOverall?: boolean;
}

export default function ScoreCard({ label, score, description }: ScoreCardProps) {
  // Determine score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  // Determine card background color based on score
  const getCardBackground = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 80) return 'bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // Get score description
  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    if (score >= 50) return 'Needs Work';
    return 'Poor';
  };

  // Calculate the progress ring values
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`rounded-xl p-4 border transition-all duration-300 hover:shadow-md ${getCardBackground(score)}`}>
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-2">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              className="text-gray-200"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="48"
              cy="48"
            />
            <circle
              className={getScoreColor(score)}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="48"
              cy="48"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
        
        <div className="mt-1 text-center">
          <span className={`text-sm font-medium ${getScoreColor(score)}`}>
            {getScoreDescription(score)}
          </span>
        </div>
        
        {description && (
          <p className="mt-2 text-sm text-gray-600 text-center">{description}</p>
        )}
      </div>
    </div>
  );
} 