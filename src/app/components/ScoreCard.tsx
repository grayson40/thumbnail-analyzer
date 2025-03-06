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
    if (score >= 90) return 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200';
    if (score >= 80) return 'bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200';
    if (score >= 70) return 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200';
    if (score >= 60) return 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200';
    if (score >= 50) return 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200';
    return 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200';
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

  // Get score emoji
  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🔥';
    if (score >= 80) return '✨';
    if (score >= 70) return '👍';
    if (score >= 60) return '😐';
    if (score >= 50) return '⚠️';
    return '❗';
  };

  // Calculate the progress ring values
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`rounded-xl p-4 border transition-all duration-300 hover:shadow-lg ${getCardBackground(score)}`}>
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-2">
          {/* Background glow effect */}
          <div className={`absolute inset-0 rounded-full blur-md opacity-20 ${getScoreColor(score)}`}></div>
          
          <svg className="w-24 h-24 transform -rotate-90 drop-shadow-sm">
            {/* Background circle */}
            <circle
              className="text-gray-200 opacity-50"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="48"
              cy="48"
            />
            
            {/* Progress circle with gradient */}
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
            >
              {/* Add subtle animation */}
              <animate 
                attributeName="stroke-dashoffset" 
                from={circumference} 
                to={strokeDashoffset} 
                dur="1s" 
                begin="0s" 
                fill="freeze" 
                calcMode="spline"
                keyTimes="0; 1"
                keySplines="0.42, 0, 0.58, 1"
              />
            </circle>
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-xs">{getScoreEmoji(score)}</span>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
        
        <div className="mt-1 text-center">
          <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
            score >= 90 ? 'bg-green-100 text-green-800' :
            score >= 80 ? 'bg-emerald-100 text-emerald-800' :
            score >= 70 ? 'bg-blue-100 text-blue-800' :
            score >= 60 ? 'bg-yellow-100 text-yellow-800' :
            score >= 50 ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {getScoreDescription(score)}
          </span>
        </div>
        
        {description && (
          <p className="mt-2 text-sm text-gray-600 text-center">{description}</p>
        )}
        
        {/* Add a tooltip with improvement potential */}
        <div className="mt-3 w-full">
          <div className="text-xs text-gray-500 flex justify-between items-center">
            <span>Current</span>
            <span>Potential</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className={`h-1.5 rounded-full ${
                score >= 90 ? 'bg-green-600' :
                score >= 80 ? 'bg-emerald-600' :
                score >= 70 ? 'bg-blue-600' :
                score >= 60 ? 'bg-yellow-600' :
                score >= 50 ? 'bg-orange-600' :
                'bg-red-600'
              }`} 
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
} 