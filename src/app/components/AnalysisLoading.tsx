'use client';

import React, { useState, useEffect } from 'react';

interface AnalysisLoadingProps {
  progress?: number;
}

export default function AnalysisLoading({ progress }: AnalysisLoadingProps) {
  const showProgress = progress !== undefined && progress >= 0 && progress <= 100;
  const [activeStep, setActiveStep] = useState(0);
  
  // Simulate analysis steps
  useEffect(() => {
    const steps = ['text', 'colors', 'faces', 'composition'];
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-8 animate-fadeIn">
      <div className="flex flex-col items-center justify-center">
        <div className="mb-6 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            {showProgress && (
              <div className="text-lg font-bold text-primary">{progress}%</div>
            )}
          </div>
          <svg 
            className="animate-spin h-20 w-20 text-primary" 
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg" 
          >
            <circle 
              className="opacity-20" 
              cx="50" 
              cy="50" 
              r="45" 
              stroke="currentColor" 
              strokeWidth="10"
              fill="none"
            ></circle>
            <path 
              className="opacity-75" 
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              d={`M 50 5 A 45 45 0 0 1 ${
                50 + 45 * Math.cos((showProgress ? progress! / 100 : 0.25) * Math.PI * 2 - Math.PI / 2)
              } ${
                50 + 45 * Math.sin((showProgress ? progress! / 100 : 0.25) * Math.PI * 2 - Math.PI / 2)
              }`}
            ></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-3 text-center text-gray-800">Analyzing Your Thumbnail</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          Our AI is examining your thumbnail to provide detailed insights and recommendations to improve your click-through rate.
        </p>
        
        {showProgress && (
          <div className="w-full max-w-md mb-6 animate-fadeIn">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-blue-100">
                    Analysis Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-primary">
                    {progress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-blue-100">
                <div 
                  style={{ width: `${progress}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500 ease-in-out rounded-full"
                ></div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          <div className={`flex items-center p-4 border rounded-xl transition-all duration-300 ${activeStep === 0 ? 'border-primary bg-blue-50 shadow-md scale-105' : 'border-gray-200 hover:border-primary hover:bg-gray-50'}`}>
            <div className={`w-10 h-10 mr-4 flex items-center justify-center rounded-full transition-colors duration-300 ${activeStep === 0 ? 'bg-primary' : 'bg-blue-100'}`}>
              <svg className={`w-5 h-5 ${activeStep === 0 ? 'text-white' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">Text Analysis</p>
              <p className="text-sm text-gray-500">Detecting text and evaluating readability</p>
            </div>
          </div>
          
          <div className={`flex items-center p-4 border rounded-xl transition-all duration-300 ${activeStep === 1 ? 'border-primary bg-blue-50 shadow-md scale-105' : 'border-gray-200 hover:border-primary hover:bg-gray-50'}`}>
            <div className={`w-10 h-10 mr-4 flex items-center justify-center rounded-full transition-colors duration-300 ${activeStep === 1 ? 'bg-primary' : 'bg-blue-100'}`}>
              <svg className={`w-5 h-5 ${activeStep === 1 ? 'text-white' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">Color Analysis</p>
              <p className="text-sm text-gray-500">Identifying dominant colors and contrast</p>
            </div>
          </div>
          
          <div className={`flex items-center p-4 border rounded-xl transition-all duration-300 ${activeStep === 2 ? 'border-primary bg-blue-50 shadow-md scale-105' : 'border-gray-200 hover:border-primary hover:bg-gray-50'}`}>
            <div className={`w-10 h-10 mr-4 flex items-center justify-center rounded-full transition-colors duration-300 ${activeStep === 2 ? 'bg-primary' : 'bg-blue-100'}`}>
              <svg className={`w-5 h-5 ${activeStep === 2 ? 'text-white' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">Face Detection</p>
              <p className="text-sm text-gray-500">Detecting faces and expressions</p>
            </div>
          </div>
          
          <div className={`flex items-center p-4 border rounded-xl transition-all duration-300 ${activeStep === 3 ? 'border-primary bg-blue-50 shadow-md scale-105' : 'border-gray-200 hover:border-primary hover:bg-gray-50'}`}>
            <div className={`w-10 h-10 mr-4 flex items-center justify-center rounded-full transition-colors duration-300 ${activeStep === 3 ? 'bg-primary' : 'bg-blue-100'}`}>
              <svg className={`w-5 h-5 ${activeStep === 3 ? 'text-white' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">Composition</p>
              <p className="text-sm text-gray-500">Evaluating layout and visual balance</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500 animate-pulse">
          <p>This may take a few moments...</p>
        </div>
      </div>
    </div>
  );
} 