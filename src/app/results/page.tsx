'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ThumbnailAnalysis from '../components/ThumbnailAnalysis';
import { AnalysisResult } from '../types';
import Header from '../components/Header';
import { SignedIn, SignedOut, useAuth } from '@clerk/nextjs';

export default function Results() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded: isAuthLoaded, userId } = useAuth();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const resultRef = useRef<HTMLDivElement>(null);
  
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
    // Only proceed when auth is loaded
    if (!isAuthLoaded) return;
    
    // Check if we have an analysis ID in the URL
    const analysisId = searchParams.get('id');
    
    if (analysisId) {
      // If we have an ID, fetch the analysis from the API
      fetchAnalysisById(analysisId);
    } else {
      // Otherwise, try to get it from localStorage (legacy method)
      loadFromLocalStorage();
    }
  }, [searchParams, isAuthLoaded, userId]);
  
  const fetchAnalysisById = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analysis/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analysis');
      }
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        setIsLoading(false);
        
        // Add a slight delay before showing content for a smooth animation
        const timer = setTimeout(() => {
          setShowContent(true);
        }, 300);
        
        return () => clearTimeout(timer);
      } else {
        throw new Error('Invalid analysis data received');
      }
    } catch (error: any) {
      console.error('Failed to fetch analysis:', error);
      setError(error.message || 'Failed to fetch analysis. Please try again.');
      setIsLoading(false);
      
      // If we can't fetch the analysis, redirect to home after a delay
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  };
  
  const loadFromLocalStorage = () => {
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
  };

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

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Generate a downloadable report in HTML format
  const generateReport = () => {
    if (!analysisResult) return;
    
    const result = analysisResult;
    const scoreEmojis = {
      excellent: '🔥',
      veryGood: '✨',
      good: '👍',
      average: '😐',
      needsWork: '⚠️',
      poor: '❗'
    };

    const getScoreEmoji = (score: number) => {
      if (score >= 90) return scoreEmojis.excellent;
      if (score >= 80) return scoreEmojis.veryGood;
      if (score >= 70) return scoreEmojis.good;
      if (score >= 60) return scoreEmojis.average;
      if (score >= 50) return scoreEmojis.needsWork;
      return scoreEmojis.poor;
    };

    const getScoreText = (score: number) => {
      if (score >= 90) return 'Excellent';
      if (score >= 80) return 'Very Good';
      if (score >= 70) return 'Good';
      if (score >= 60) return 'Average';
      if (score >= 50) return 'Needs Work';
      return 'Poor';
    };

    // Create report HTML
    const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BetterThumbnails.com Analysis Report</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #1d4ed8; }
        .thumbnail { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; }
        .score-container { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
        .score-card { background: #f9fafb; border: 1px solid #ddd; border-radius: 8px; padding: 15px; width: calc(33% - 15px); box-sizing: border-box; }
        .score { font-size: 24px; font-weight: bold; }
        .recommendation { background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
        .analysis-section { margin-bottom: 30px; }
        @media print { body { font-size: 12pt; } }
      </style>
    </head>
    <body>
      <h1>Thumbnail Analysis Report</h1>
      <p>Date: ${new Date().toLocaleDateString()}</p>
      
      <div class="analysis-section">
        <h2>Thumbnail</h2>
        <img class="thumbnail" src="${result.thumbnail.url}" alt="Analyzed Thumbnail">
        <p>Dimensions: ${result.thumbnail.width} x ${result.thumbnail.height} pixels</p>
      </div>
      
      <div class="analysis-section">
        <h2>Overall Score: ${result.scores.overall}% ${getScoreEmoji(result.scores.overall)} - ${getScoreText(result.scores.overall)}</h2>
        
        <div class="score-container">
          <div class="score-card">
            <h3>Text Score</h3>
            <div class="score">${result.scores.text}% ${getScoreEmoji(result.scores.text)}</div>
          </div>
          <div class="score-card">
            <h3>Visual Score</h3>
            <div class="score">${result.scores.visual}% ${getScoreEmoji(result.scores.visual)}</div>
          </div>
          <div class="score-card">
            <h3>Face Score</h3>
            <div class="score">${result.scores.faces}% ${getScoreEmoji(result.scores.faces)}</div>
          </div>
          <div class="score-card">
            <h3>Composition Score</h3>
            <div class="score">${result.scores.composition}% ${getScoreEmoji(result.scores.composition)}</div>
          </div>
        </div>
      </div>
      
      <div class="analysis-section">
        <h2>Key Findings</h2>
        <p><strong>Text:</strong> ${result.analysis.text.readability}</p>
        <p><strong>Colors:</strong> ${result.analysis.colors.contrast}</p>
        <p><strong>Faces:</strong> ${result.analysis.faces.explanation}</p>
        <p><strong>Detected Text:</strong> ${result.analysis.text.detected.join(', ') || 'None detected'}</p>
      </div>
      
      <div class="analysis-section">
        <h2>Recommendations</h2>
        ${result.recommendations.map((rec, i) => `
          <div class="recommendation">
            <h3>${i+1}. ${rec.action} ${rec.icon || ''}</h3>
            <p><strong>Category:</strong> ${rec.category.charAt(0).toUpperCase() + rec.category.slice(1)}</p>
            <p><strong>Priority:</strong> ${rec.priority}/3</p>
            <p><strong>Impact:</strong> +${rec.impact.value}${rec.impact.unit} ${rec.impact.metric}</p>
            <p><strong>Steps:</strong></p>
            <ul>
              ${rec.steps.map(step => `<li>${step}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      
      <div class="analysis-section">
        <h2>About This Report</h2>
        <p>This report was generated by BetterThumbnails.com, a tool that helps creators improve their thumbnail effectiveness through AI-powered analysis.</p>
      </div>
    </body>
    </html>
    `;

    // Create a blob and download link
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thumbnail-analysis-report.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <Header navItems={[]} />

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
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleAnalyzeAnother}
                      className="inline-flex items-center bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Analyze Another
                    </button>
                    <button
                      onClick={generateReport}
                      className="inline-flex items-center bg-white border border-primary text-primary hover:bg-primary/5 font-medium py-2 px-4 rounded-lg transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results Content */}
            <div ref={resultRef} className="container mx-auto px-4 py-8 max-w-6xl">
              {/* Mobile Navigation (shows on smaller screens) */}
              <div className="md:hidden bg-white border-b border-gray-200 mb-6 rounded-lg shadow-sm">
                <div className="container mx-auto px-2">
                  <select
                    value={activeSection}
                    onChange={(e) => scrollToSection(e.target.value)}
                    className="w-full py-3 px-4 border-0 bg-transparent text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary rounded-md"
                    aria-label="Select section"
                  >
                    <option value="overview">Overview & Scores</option>
                    <option value="details">Detailed Analysis</option>
                    <option value="recommendations">Recommendations</option>
                    <option value="nextSteps">Next Steps</option>
                  </select>
                </div>
              </div>

              {/* Desktop Navigation Tabs */}
              <div className="hidden md:block sticky top-0 z-10 bg-white shadow-sm mb-6 rounded-lg">
                <div className="container mx-auto px-4 max-w-6xl">
                  <div className="flex overflow-x-auto scrollbar-hide">
                    {[
                      { id: 'overview', label: 'Overview & Scores', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
                      { id: 'details', label: 'Detailed Analysis', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                      { id: 'recommendations', label: 'Recommendations', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
                      { id: 'nextSteps', label: 'Next Steps', icon: 'M13 5l7 7-7 7M5 5l7 7-7 7' }
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => scrollToSection(tab.id)} 
                        className={`flex items-center px-4 py-4 font-medium whitespace-nowrap mr-2 border-b-2 transition-colors duration-300 ${
                          activeSection === tab.id 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                        </svg>
                        <span className="text-sm">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              {activeSection !== 'nextSteps' && (
                <ThumbnailAnalysis result={results} activeTab={activeSection} onTabChange={setActiveSection} />
              )}
              
              {/* Next Steps Section */}
              {activeSection === 'nextSteps' && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 animate-fadeIn">
                  <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Next Steps to Improve Your Thumbnail</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                      <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Apply the Recommendations
                      </h3>
                      <p className="text-blue-700">
                        Use the specific recommendations we&apos;ve provided to improve your thumbnail. Focus on the high-priority items first for the biggest impact.
                      </p>
                      <ul className="mt-3 space-y-2">
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-blue-800">Edit your thumbnail using tools like Canva or Photoshop</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-blue-800">Implement changes one at a time to see their individual impact</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
                      <h3 className="text-lg font-medium text-purple-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                        </svg>
                        Test Multiple Versions
                      </h3>
                      <p className="text-purple-700">
                        Create A/B tests with different thumbnail variations to see which performs best with your audience.
                      </p>
                      <ul className="mt-3 space-y-2">
                        <li className="flex items-start">
                          <span className="text-purple-500 mr-2">•</span>
                          <span className="text-purple-800">Create 2-3 different versions based on our recommendations</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-500 mr-2">•</span>
                          <span className="text-purple-800">Use YouTube Studio to track click-through rates</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-5 border border-green-100">
                      <h3 className="text-lg font-medium text-green-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        Track Performance
                      </h3>
                      <p className="text-green-700">
                        Monitor how your updated thumbnail performs in terms of CTR (Click-Through Rate) and audience retention.
                      </p>
                      <ul className="mt-3 space-y-2">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          <span className="text-green-800">Compare before and after metrics in YouTube Analytics</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          <span className="text-green-800">Look for improvements in impressions click-through rate</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-amber-50 rounded-lg p-5 border border-amber-100">
                      <h3 className="text-lg font-medium text-amber-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Develop a Consistent Style
                      </h3>
                      <p className="text-amber-700">
                        Use what you&apos;ve learned to develop a consistent thumbnail style that works for your channel.
                      </p>
                      <ul className="mt-3 space-y-2">
                        <li className="flex items-start">
                          <span className="text-amber-500 mr-2">•</span>
                          <span className="text-amber-800">Create a template based on your best-performing designs</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-amber-500 mr-2">•</span>
                          <span className="text-amber-800">Maintain consistent branding elements across thumbnails</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <h3 className="text-lg font-medium text-primary mb-2">Want Expert Help?</h3>
                    <p className="text-gray-700 mb-4">
                      Need professional assistance implementing these recommendations? Our team of thumbnail design experts can help.
                    </p>
                    <a 
                      href="/contact"
                      className="inline-flex items-center bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Contact Our Design Team
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer CTA */}
            <div className="bg-gradient-to-r from-primary to-accent py-10 text-white">
              <div className="container mx-auto px-4 text-center max-w-4xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to improve your thumbnails?</h2>
                <p className="text-lg mb-6 text-white/90">
                  Apply our recommendations and analyze more thumbnails to boost your click-through rates.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={handleAnalyzeAnother}
                    className="bg-white text-primary hover:bg-white/90 font-medium py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Analyze Another Thumbnail
                  </button>
                  
                  {isAuthLoaded && userId && (
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="inline-flex items-center bg-primary/20 text-primary hover:bg-primary/30 font-medium py-3 px-6 rounded-lg transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                        <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                      View Analysis History
                    </button>
                  )}
                  
                  <a
                    href="/contact"
                    className="bg-white/20 text-white hover:bg-white/30 font-medium py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Get Expert Help
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

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