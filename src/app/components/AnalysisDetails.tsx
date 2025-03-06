'use client';

import React, { useState } from 'react';

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
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Function to toggle section expansion
  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Function to get contrast rating description
  const getContrastRating = (contrast: string): { text: string; color: string } => {
    if (contrast.includes('High') || contrast.includes('Excellent')) {
      return { text: 'Excellent', color: 'text-green-600' };
    } else if (contrast.includes('Good')) {
      return { text: 'Good', color: 'text-blue-600' };
    } else if (contrast.includes('Moderate')) {
      return { text: 'Moderate', color: 'text-amber-600' };
    } else {
      return { text: 'Low', color: 'text-red-600' };
    }
  };

  // Function to get readability rating description
  const getReadabilityRating = (readability: string): { text: string; color: string } => {
    if (readability.includes('Excellent') || readability.includes('High')) {
      return { text: 'Excellent', color: 'text-green-600' };
    } else if (readability.includes('Good')) {
      return { text: 'Good', color: 'text-blue-600' };
    } else if (readability.includes('Moderate') || readability.includes('Average')) {
      return { text: 'Moderate', color: 'text-amber-600' };
    } else {
      return { text: 'Poor', color: 'text-red-600' };
    }
  };

  // Function to get prominence rating description
  const getProminenceRating = (prominence: string): { text: string; color: string } => {
    if (prominence.includes('High') || prominence.includes('Excellent')) {
      return { text: 'Excellent', color: 'text-green-600' };
    } else if (prominence.includes('Good')) {
      return { text: 'Good', color: 'text-blue-600' };
    } else if (prominence.includes('Moderate') || prominence.includes('Average')) {
      return { text: 'Moderate', color: 'text-amber-600' };
    } else {
      return { text: 'Poor', color: 'text-red-600' };
    }
  };

  // Function to get color for expression
  const getExpressionColor = (expression: string): string => {
    const positive = ['happy', 'joy', 'smile', 'excited', 'surprise', 'positive'];
    const neutral = ['neutral', 'calm', 'serious', 'focused'];
    const negative = ['sad', 'angry', 'fear', 'disgust', 'negative'];
    
    const lowerExp = expression.toLowerCase();
    
    if (positive.some(p => lowerExp.includes(p))) {
      return 'bg-green-100 text-green-800';
    } else if (negative.some(n => lowerExp.includes(n))) {
      return 'bg-red-100 text-red-800';
    } else if (neutral.some(n => lowerExp.includes(n))) {
      return 'bg-blue-100 text-blue-800';
    }
    
    return 'bg-purple-100 text-purple-800';
  };

  // Function to get best practices for text
  const getTextBestPractices = () => {
    return [
      'Use 1-2 text elements for optimal readability',
      'Ensure high contrast between text and background',
      'Use bold, easy-to-read fonts',
      'Keep text concise and impactful',
      'Position text strategically (typically top or bottom)'
    ];
  };

  // Function to get best practices for colors
  const getColorBestPractices = () => {
    return [
      'Use contrasting colors to make elements stand out',
      'Incorporate brand colors for recognition',
      'Bright colors typically perform better than muted ones',
      'Avoid overly busy backgrounds that compete with foreground elements',
      'Consider color psychology (e.g., red for urgency, blue for trust)'
    ];
  };

  // Function to get best practices for faces
  const getFaceBestPractices = () => {
    return [
      'Include at least one human face when possible',
      'Ensure faces are clearly visible and well-lit',
      'Use expressive emotions that match content',
      'Position faces in the left or center of the thumbnail',
      'Close-ups typically perform better than distant shots'
    ];
  };

  return (
    <div className="p-6">
      {/* Text Analysis Section */}
      <div className="mb-8">
        <button 
          onClick={() => toggleSection('text')}
          className="w-full flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center">
            <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Text Analysis</h3>
          </div>
          <svg 
            className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${activeSection === 'text' ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {activeSection === 'text' && (
          <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Detected Text Elements</h4>
                {text.detected && text.detected.length > 0 ? (
                  <div className="space-y-2">
                    {text.detected.map((item, index) => (
                      <div key={index} className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                        &quot;{item}&quot;
                      </div>
                    ))}
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Count:</span> {text.detected.length} text element(s)
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 text-amber-800 px-3 py-2 rounded-lg text-sm">
                    <p className="font-medium">No text detected</p>
                    <p className="text-xs mt-1">Adding 1-2 text elements could improve your CTR by up to 25%</p>
                  </div>
                )}
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Readability Assessment</h4>
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getReadabilityRating(text.readability).color} bg-opacity-20`}>
                      {getReadabilityRating(text.readability).text}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">{text.readability}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Text Best Practices</h4>
                <ul className="space-y-2">
                  {getTextBestPractices().map((practice, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-sm text-gray-700">{practice}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-800 mb-1">Pro Tip</h5>
                  <p className="text-xs text-blue-700">
                    Thumbnails with clear, concise text that complements the visual elements typically see 20-30% higher CTR than those with no text or unclear text.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Colors Analysis Section */}
      <div className="mb-8">
        <button 
          onClick={() => toggleSection('colors')}
          className="w-full flex items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center">
            <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Color Analysis</h3>
          </div>
          <svg 
            className={`w-5 h-5 text-purple-600 transition-transform duration-200 ${activeSection === 'colors' ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {activeSection === 'colors' && (
          <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Dominant Colors</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  {colors.dominant.map((color, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-14 h-14 rounded-lg shadow-sm border border-gray-200" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs mt-1 font-mono">{color}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Color Contrast</h4>
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getContrastRating(colors.contrast).color} bg-opacity-20`}>
                      {getContrastRating(colors.contrast).text}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">{colors.contrast}</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <h5 className="text-sm font-medium text-purple-800 mb-1">Color Psychology</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                      <span className="text-gray-700">Red: Excitement, Urgency</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                      <span className="text-gray-700">Blue: Trust, Calm</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                      <span className="text-gray-700">Yellow: Optimism</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                      <span className="text-gray-700">Green: Growth, Success</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Color Best Practices</h4>
                <ul className="space-y-2">
                  {getColorBestPractices().map((practice, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-sm text-gray-700">{practice}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Color Impact on CTR</h4>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                          High Contrast
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-purple-600">
                          +35% CTR
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                      <div style={{ width: "75%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Faces Analysis Section */}
      <div className="mb-8">
        <button 
          onClick={() => toggleSection('faces')}
          className="w-full flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Face Analysis</h3>
          </div>
          <svg 
            className={`w-5 h-5 text-green-600 transition-transform duration-200 ${activeSection === 'faces' ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {activeSection === 'faces' && (
          <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-lg font-bold mr-3">
                    {faces.count}
                  </div>
                  <span className="text-gray-700 font-medium">
                    {faces.count === 1 ? 'Face' : 'Faces'} Detected
                  </span>
                </div>
                
                {faces.count > 0 ? (
                  <>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Detected Expressions</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {faces.expressions.map((expression, index) => (
                        <span key={index} className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getExpressionColor(expression)}`}>
                          {expression}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Face Prominence</h4>
                      <div className="flex items-center">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getProminenceRating(faces.prominence).color} bg-opacity-20`}>
                          {getProminenceRating(faces.prominence).text}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">{faces.prominence}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-lg">
                    <p className="font-medium">No faces detected in this thumbnail</p>
                    <p className="text-sm mt-1">
                      Thumbnails with human faces typically get 38% more clicks than those without. Consider adding a human element to your thumbnail.
                    </p>
                  </div>
                )}
                
                {faces.explanation && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <h5 className="text-sm font-medium text-green-800 mb-1">Analysis</h5>
                    <p className="text-sm text-green-700">{faces.explanation}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Face Best Practices</h4>
                <ul className="space-y-2">
                  {getFaceBestPractices().map((practice, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-sm text-gray-700">{practice}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Impact of Facial Expressions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Positive expressions (happy, excited)</span>
                      <span className="font-medium text-green-600">+42% CTR</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Surprised expressions</span>
                      <span className="font-medium text-blue-600">+38% CTR</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Negative expressions (angry, sad)</span>
                      <span className="font-medium text-amber-600">+25% CTR</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Neutral expressions</span>
                      <span className="font-medium text-gray-600">+15% CTR</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <h5 className="text-sm font-medium text-green-800 mb-1">Pro Tip</h5>
                  <p className="text-xs text-green-700">
                    Close-up shots of faces showing clear emotions create stronger viewer connections. Position faces on the left side of the thumbnail for maximum impact, as viewers typically scan from left to right.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Additional Resources Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="https://blog.hootsuite.com/youtube-thumbnail/" target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <h4 className="font-medium text-indigo-700 mb-1">Hootsuite Guide</h4>
            <p className="text-sm text-gray-600">How to Create YouTube Thumbnails That Get Clicks</p>
          </a>
          <a href="https://www.canva.com/learn/youtube-thumbnails/" target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <h4 className="font-medium text-indigo-700 mb-1">Canva Tutorial</h4>
            <p className="text-sm text-gray-600">50 YouTube Thumbnail Examples to Inspire You</p>
          </a>
          <a href="https://www.vidiq.com/blog/post/youtube-thumbnail-best-practices" target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <h4 className="font-medium text-indigo-700 mb-1">vidIQ Best Practices</h4>
            <p className="text-sm text-gray-600">YouTube Thumbnail Best Practices for 2024</p>
          </a>
        </div>
      </div>
    </div>
  );
} 