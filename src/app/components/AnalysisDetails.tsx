'use client';

import React from 'react';

interface AnalysisDetailsProps {
  analysis: {
    text: {
      detected: string[];
      readability: string;
    };
    colors: {
      dominant: string[];
      contrast: string;
    };
    faces: {
      count: number;
      expressions: string[];
      prominence: string;
      explanation?: string;
    };
  };
}

export default function AnalysisDetails({ analysis }: AnalysisDetailsProps) {
  const { text, colors, faces } = analysis;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
      {/* Text Analysis */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">Text Analysis</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Detected Text</h4>
            {text.detected && text.detected.length > 0 ? (
              <div className="space-y-2">
                {text.detected.map((item, index) => (
                  <div key={index} className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 italic">No text detected</p>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Readability</h4>
            <p className="text-gray-700">{text.readability}</p>
          </div>
        </div>
      </div>

      {/* Colors Analysis */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">Color Analysis</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Dominant Colors</h4>
            <div className="flex flex-wrap gap-2">
              {colors.dominant.map((color, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-12 h-12 rounded-lg shadow-sm border border-gray-200" 
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs mt-1 font-mono">{color}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Contrast</h4>
            <p className="text-gray-700">{colors.contrast}</p>
          </div>
        </div>
      </div>

      {/* Faces Analysis */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">Face Analysis</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Face Count</h4>
            <div className="flex items-center">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {faces.count} {faces.count === 1 ? 'face' : 'faces'} detected
              </div>
            </div>
          </div>
          
          {faces.count > 0 && (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Expressions</h4>
                <div className="flex flex-wrap gap-2">
                  {faces.expressions.map((expression, index) => (
                    <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
                      {expression}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Prominence</h4>
                <p className="text-gray-700">{faces.prominence}</p>
              </div>
            </>
          )}
          
          {faces.explanation && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Analysis</h4>
              <p className="text-gray-700 italic">{faces.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 