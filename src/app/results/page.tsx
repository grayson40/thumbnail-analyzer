'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThumbnailAnalysis from '../components/ThumbnailAnalysis';
import { AnalysisResult } from '../types';
import Header from '../components/Header';

export default function Results() {
  const router = useRouter();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data for fallback if no analysis results are available
  const mockResults: AnalysisResult = {
    thumbnail: {
      url: "https://via.placeholder.com/1280x720",
      width: 1280,
      height: 720,
    },
    scores: {
      text: 75,
      visual: 82,
      faces: 60,
      composition: 70,
      overall: 72,
    },
    analysis: {
      text: {
        detected: ["AMAZING TIPS", "MUST SEE"],
        readability: "Good contrast, but text could be larger",
      },
      colors: {
        dominant: ["#e63946", "#f1faee", "#1d3557"],
        contrast: "High contrast between text and background",
      },
      faces: {
        count: 1,
        expressions: ["neutral"],
        prominence: "Medium - face takes up 20% of the image",
        explanation: "The face is well-positioned and visible, but could be more prominent for better engagement.",
      },
    },
    recommendations: [
      {
        category: 'text',
        action: 'Increase text size for better readability on mobile',
        steps: ['Adjust font size for mobile viewing', 'Ensure text contrast is sufficient'],
        impact: { metric: 'CTR', value: 15, unit: '%' },
        priority: 1,
        icon: '🔤'
      },
      {
        category: 'face',
        action: 'Consider adding more emotion to the facial expression',
        steps: ['Use more expressive facial poses', 'Capture authentic reactions'],
        impact: { metric: 'CTR', value: 20, unit: '%' },
        priority: 2,
        icon: '😀'
      },
      {
        category: 'color',
        action: 'The red color is eye-catching but could be more vibrant',
        steps: ['Increase color saturation', 'Test different shades of red'],
        impact: { metric: 'CTR', value: 10, unit: '%' },
        priority: 3,
        icon: '🎨'
      },
      {
        category: 'composition',
        action: 'Try positioning the text in the upper third of the image',
        steps: ['Apply rule of thirds', 'Leave space for text overlay'],
        impact: { metric: 'CTR', value: 12, unit: '%' },
        priority: 2,
        icon: '📐'
      }
    ],
  };

  useEffect(() => {
    // Get the analysis result from localStorage
    const storedResult = localStorage.getItem('analysisResult');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        setAnalysisResult(parsedResult);
        setIsLoading(false);
        
        // Add a slight delay before showing content for a smooth animation
        const timer = setTimeout(() => {
          setShowContent(true);
        }, 300);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Failed to parse analysis result:', error);
        setError('Failed to parse analysis result. Please try again.');
        setIsLoading(false);
      }
    } else {
      // No result found, redirect to home page after a short delay
      setError('No analysis result found. Please analyze a thumbnail first.');
      setIsLoading(false);
      
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [router]);

  const handleBackToHome = () => {
    setShowContent(false);
    setTimeout(() => {
      router.push('/');
    }, 300);
  };

  const handleAnalyzeAnother = () => {
    setShowContent(false);
    setTimeout(() => {
      router.push('/#analyze');
    }, 300);
  };

  const results = analysisResult || mockResults;
  
  // Calculate the overall score class
  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const navItems = [
    { 
      label: 'Home', 
      href: '/',
      onClick: handleBackToHome
    },
    { 
      label: 'Analyze Another', 
      href: '/',
      onClick: handleAnalyzeAnother
    },
    { 
      label: 'Contact', 
      href: '/contact' 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <Header navItems={navItems} />

      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 py-20 animate-fadeIn">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-gray-600">Analyzing your thumbnail...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-lg text-gray-600 mb-6 text-center max-w-md">{error}</p>
            <p className="text-gray-500 text-sm">Redirecting to home page...</p>
            <button
              onClick={handleBackToHome}
              className="mt-6 bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-all duration-300"
            >
              Go to Home Page Now
            </button>
          </div>
        ) : analysisResult ? (
          <div className={`transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
            {/* Results Header */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 py-8 border-b border-primary/10">
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800">Analysis Results</h1>
                    <p className="text-lg text-gray-700">
                      Here&apos;s how your thumbnail performs based on our analysis
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleAnalyzeAnother}
                      className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Analyze Another
                    </button>
                    <button
                      onClick={handleBackToHome}
                      className="bg-white hover:bg-gray-50 text-primary border border-primary font-medium py-2 px-6 rounded-lg transition-all duration-300"
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Score Summary */}
            <div className="py-8 bg-white border-b border-gray-200">
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="md:w-2/3">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Overall Score: <span className={getScoreColorClass(results.scores.overall)}>{results.scores.overall}/100</span></h2>
                    <p className="text-lg text-gray-700 mb-4">{getScoreDescription(results.scores.overall)}</p>
                    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-700 italic">
                        &quot;Thumbnails are the first impression viewers have of your video. A strong thumbnail can increase your click-through rate by up to 30%&quot;
                      </p>
                    </div>
                  </div>
                  <div className="md:w-1/3 flex justify-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="45" 
                          fill="none" 
                          stroke="#e5e7eb" 
                          strokeWidth="10" 
                        />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="45" 
                          fill="none" 
                          stroke={results.scores.overall >= 90 ? '#10b981' : 
                                  results.scores.overall >= 80 ? '#22c55e' : 
                                  results.scores.overall >= 70 ? '#eab308' : 
                                  results.scores.overall >= 60 ? '#ca8a04' : 
                                  results.scores.overall >= 50 ? '#f97316' : '#ef4444'} 
                          strokeWidth="10" 
                          strokeDasharray={`${2 * Math.PI * 45 * results.scores.overall / 100} ${2 * Math.PI * 45 * (1 - results.scores.overall / 100)}`}
                          strokeDashoffset={2 * Math.PI * 45 * 0.25}
                          strokeLinecap="round"
                        />
                        <text 
                          x="50" 
                          y="50" 
                          textAnchor="middle" 
                          dominantBaseline="middle" 
                          className="text-3xl font-bold"
                          fill={results.scores.overall >= 90 ? '#10b981' : 
                                results.scores.overall >= 80 ? '#22c55e' : 
                                results.scores.overall >= 70 ? '#eab308' : 
                                results.scores.overall >= 60 ? '#ca8a04' : 
                                results.scores.overall >= 50 ? '#f97316' : '#ef4444'}
                        >
                          {results.scores.overall}
                        </text>
                        <text 
                          x="50" 
                          y="65" 
                          textAnchor="middle" 
                          dominantBaseline="middle" 
                          className="text-xs"
                          fill="#6b7280"
                        >
                          out of 100
                        </text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="py-8 bg-gray-50">
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Analysis</h2>
                  <p className="text-gray-600 mb-6">
                    We&apos;ve analyzed your thumbnail across multiple dimensions to provide comprehensive feedback.
                  </p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  <ThumbnailAnalysis result={results} />
                </div>
                
                {/* Next Steps */}
                <div className="mt-12 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Next Steps
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Based on our analysis, here are some actions you can take to improve your thumbnail:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2">Implement Recommendations</h4>
                      <p className="text-gray-600 text-sm">
                        Apply the specific recommendations we&apos;ve provided to enhance your thumbnail&apos;s effectiveness.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2">Create Variations</h4>
                      <p className="text-gray-600 text-sm">
                        Create multiple versions of your thumbnail and analyze each one to find the best performer.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2">A/B Testing</h4>
                      <p className="text-gray-600 text-sm">
                        Use YouTube Studio to A/B test different thumbnails and see which one gets more clicks.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2">Analyze Competitors</h4>
                      <p className="text-gray-600 text-sm">
                        Look at successful thumbnails in your niche and analyze what makes them effective.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Analysis Result</h2>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find any analysis results. This could be because you haven&apos;t analyzed a thumbnail yet, or your session has expired.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              &quot;A good thumbnail can increase your click-through rate by up to 154%&quot; - YouTube Creator Academy
            </p>
            <button
              onClick={handleBackToHome}
              className="mt-2 bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-all duration-300"
            >
              Go to Home Page
            </button>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-lg font-bold">YouTube Thumbnail Analyzer</span>
              </div>
              <p className="text-gray-400 text-sm">
                Improve your YouTube thumbnails with AI-powered analysis.
              </p>
            </div>
            
            <div className="flex space-x-6">
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700 text-center md:text-left text-sm text-gray-400">
            <p>© {new Date().getFullYear()} YouTube Thumbnail Analyzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper function to get a description based on the score
function getScoreDescription(score: number): React.ReactNode {
  if (score >= 90) {
    return <span>Your thumbnail is <strong>excellent</strong>! It follows best practices for YouTube thumbnails and is likely to perform very well.</span>;
  } else if (score >= 80) {
    return <span>Your thumbnail is <strong>very good</strong>, with just a few areas for improvement. Making these small changes could boost your click-through rate.</span>;
  } else if (score >= 70) {
    return <span>Your thumbnail is <strong>good</strong>, but has several areas for improvement. Implementing our recommendations will help increase your click-through rate.</span>;
  } else if (score >= 60) {
    return <span>Your thumbnail is <strong>average</strong>. Consider implementing our recommendations to stand out from the competition and improve your click-through rate.</span>;
  } else if (score >= 50) {
    return <span>Your thumbnail <strong>needs work</strong>. Follow our recommendations to significantly improve its effectiveness and increase your click-through rate.</span>;
  } else {
    return <span>Your thumbnail <strong>needs significant improvement</strong>. Consider a complete redesign following our recommendations to maximize your click-through rate.</span>;
  }
} 