'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThumbnailUpload from './components/ThumbnailUpload';
import { ThumbnailData } from './types';
import AnalysisLoading from './components/AnalysisLoading';
import Header from './components/Header';
import { useAuth } from '@clerk/nextjs';
import { getUserDailyAnalysisCount } from '@/lib/db/index';
import AuthModal from './components/AuthModal';
import { SignUp, SignIn } from '@clerk/nextjs';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [analysisCount, setAnalysisCount] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingData, setPendingData] = useState<ThumbnailData | null>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [isNewSignIn, setIsNewSignIn] = useState(false);
  const [showAuthInAnalyze, setShowAuthInAnalyze] = useState(false);
  const [authView, setAuthView] = useState<'signUp' | 'signIn'>('signUp');

  useEffect(() => {
    // Add a slight delay before showing content for a smooth animation
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch user's remaining analysis count if they're authenticated
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      // Use the db utility to get the user's analysis count
      const fetchAnalysisCount = async () => {
        try {
          const usedCount = await getUserDailyAnalysisCount(userId);
          console.log('Used count:', usedCount);
          // The free tier allows 1 analysis per day, so remaining is 1 - used
          const remainingCount = Math.max(0, 1 - usedCount);
          setAnalysisCount(remainingCount);
        } catch (error) {
          console.error('Error fetching analysis count:', error);
          // Default to 1 if there's an error
          setAnalysisCount(1);
        }
      };
      
      fetchAnalysisCount();
    }
  }, [isLoaded, isSignedIn, userId]);

  // Add a function that properly handles quota exceeded errors
  async function handleThumbnailSubmit(data: ThumbnailData) {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting thumbnail submission:', data);
      
      // If user is not authenticated, store the thumbnail data and show auth modal
      if (!isSignedIn) {
        console.log('User not signed in, showing auth modal');
        setPendingData(data);
        
        // Store data in sessionStorage for persistence
        try {
          // We can't directly store File objects, so we'll only store URL data
          const storableData: any = {};
          if (data.url) storableData.url = data.url;
          if (data.youtubeId) storableData.youtubeId = data.youtubeId;
          if (data.previewUrl) storableData.previewUrl = data.previewUrl;
          
          sessionStorage.setItem('pendingAnalysisData', JSON.stringify(storableData));
          console.log('Stored pending data in sessionStorage (Home):', storableData);
        } catch (error) {
          console.error('Error storing pending data:', error);
        }
        
        setShowAuthModal(true);
        setIsLoading(false);
        return;
      }
      
      // Check for daily limit first before proceeding
      if (isSignedIn && userId) {
        try {
          const count = await getUserDailyAnalysisCount(userId);
          console.log('Current analysis count:', count);
          
          if (count >= 1) {
            setError('Daily analysis limit reached. You have used your 1 free analysis for today. Please try again tomorrow.');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error checking analysis count:', error);
        }
      }
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      // Prepare the data for submission
      let response;
      
      if (data.file) {
        // If we have a file, send it as FormData
        const formData = new FormData();
        formData.append('file', data.file);
        
        response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData
        });
      } else if (data.url) {
        // If we have a URL, send it as JSON
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: data.url })
        });
      } else if (data.youtubeId) {
        // If we have a YouTube ID, construct the URL
        const url = `https://img.youtube.com/vi/${data.youtubeId}/maxresdefault.jpg`;
        
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url })
        });
      } else {
        throw new Error('No thumbnail data provided');
      }
      
      // Clear the progress interval
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const result = await response.json();
        
        // Handle specific error types
        if (result.limitExceeded) {
          setError('Daily analysis limit reached. You have used your 1 free analysis for today. Please try again tomorrow.');
          setIsLoading(false);
          return;
        } else if (result.authRequired) {
          setError('Please sign in to analyze thumbnails');
          setShowAuthModal(true);
          setIsLoading(false);
          return;
        } else {
          throw new Error(result.error || 'Failed to analyze thumbnail');
        }
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Store the result in localStorage for the results page
        console.log('Analysis successful, redirecting to results page');
        localStorage.setItem('analysisResult', JSON.stringify(result));
        router.push('/results');
      } else {
        throw new Error(result.error || 'Failed to analyze thumbnail');
      }
    } catch (error: any) {
      console.error('Error in thumbnail submission:', error);
      setError(error.message || 'An error occurred while analyzing the thumbnail');
      setIsLoading(false);
    }
  }

  // Check for pending analysis data (e.g., if user just signed in)
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log('User is signed in, checking for pending data');
      
      const processPendingData = () => {
        // First check local state
        if (pendingData) {
          console.log('Found pending data in state, processing analysis');
          setShowAuthModal(false);
          setShowAuthInAnalyze(false);
          handleThumbnailSubmit(pendingData);
          setPendingData(null);
          return true;
        }
        
        // Then check sessionStorage as fallback
        try {
          const storedData = sessionStorage.getItem('pendingAnalysisData');
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            console.log('Retrieved pending data from sessionStorage in Home:', parsedData);
            
            if (Object.keys(parsedData).length > 0) {
              console.log('Found pending data in sessionStorage, processing analysis');
              setShowAuthModal(false);
              setShowAuthInAnalyze(false);
              handleThumbnailSubmit(parsedData);
              sessionStorage.removeItem('pendingAnalysisData');
              return true;
            }
          }
        } catch (error) {
          console.error('Error retrieving pending data in Home:', error);
        }
        
        return false;
      };
      
      processPendingData();
    }
  }, [isLoaded, isSignedIn]);

  // Listen for Clerk auth state changes via URL hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleHashChange = () => {
        const hash = window.location.hash;
        console.log('Hash changed in Home component:', hash);
        
        if (hash.includes('__clerk_cb=') || hash.includes('__clerk_status=')) {
          // Flag that this is a new sign-in
          sessionStorage.setItem('isNewSignIn', 'true');
          
          // Remove the hash to clean up the URL
          history.replaceState(null, '', window.location.pathname);
          
          // Set welcome message to true immediately for better UX
          setShowWelcomeMessage(true);
          
          // Poll for auth state changes with increasing timeouts
          const checkIntervals = [100, 500, 1000, 2000, 4000];
          
          const checkAuthStatus = (index = 0) => {
            if (index >= checkIntervals.length) return;
            
            console.log(`Checking auth status attempt ${index + 1}`);
            
            setTimeout(() => {
              if (isLoaded && isSignedIn) {
                console.log(`User authenticated on attempt ${index + 1}`);
                setShowAuthModal(false);
                setShowAuthInAnalyze(false);
                
                // Process any pending data
                const foundPendingData = (() => {
                  // Check local state first
                  if (pendingData) {
                    console.log('Processing pending data from state');
                    handleThumbnailSubmit(pendingData);
                    setPendingData(null);
                    return true;
                  }
                  
                  // Check sessionStorage as fallback
                  try {
                    const storedData = sessionStorage.getItem('pendingAnalysisData');
                    if (storedData) {
                      const parsedData = JSON.parse(storedData);
                      if (Object.keys(parsedData).length > 0) {
                        console.log('Processing pending data from sessionStorage');
                        handleThumbnailSubmit(parsedData);
                        sessionStorage.removeItem('pendingAnalysisData');
                        return true;
                      }
                    }
                  } catch (error) {
                    console.error('Error retrieving pending data:', error);
                  }
                  
                  return false;
                })();
                
                if (!foundPendingData) {
                  console.log('No pending data found after auth');
                }
              } else if (index < checkIntervals.length - 1) {
                checkAuthStatus(index + 1);
              }
            }, checkIntervals[index]);
          };
          
          checkAuthStatus();
        }
      };
      
      // Check on initial load
      handleHashChange();
      
      // Add listener for hash changes
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [isLoaded, isSignedIn, pendingData]);

  // Check for auth status changes
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Get previous auth state from sessionStorage
      const wasSignedIn = sessionStorage.getItem('wasSignedIn') === 'true';
      const isNewSignIn = sessionStorage.getItem('isNewSignIn') === 'true';
      
      // If this is a new sign-in, show the welcome message
      if (!wasSignedIn || isNewSignIn) {
        setShowWelcomeMessage(true);
        setIsNewSignIn(true);
        
        // Clear the new sign-in flag
        sessionStorage.removeItem('isNewSignIn');
        
        // Hide the message after 5 seconds
        setTimeout(() => {
          setShowWelcomeMessage(false);
        }, 5000);
      }
      
      // Store current auth state
      sessionStorage.setItem('wasSignedIn', 'true');
    } else if (isLoaded && !isSignedIn) {
      // Clear the auth state if signed out
      sessionStorage.removeItem('wasSignedIn');
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <Header navItems={[]} />
      
      <main className={`flex-1 flex flex-col transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {/* Hero Section - Enhanced */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 py-12 md:py-20 border-b border-primary/10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
              <div className="md:w-1/2 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  Boost Your YouTube <br className="hidden md:block" />Click-Through Rate
                </h1>
                <p className="text-lg md:text-xl text-gray-700 mb-6 max-w-xl">
                  Get AI-powered analysis and actionable recommendations to create thumbnails that drive more views.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm text-blue-700 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Create a free account and get <span className="font-semibold">1 free thumbnail analysis per day</span>. Sign up in seconds.</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-8">
                    <a href="#analyze" className="inline-flex items-center bg-primary hover:bg-primary-hover text-white font-medium py-3 px-6 rounded-lg transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Start Analyzing
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-8">
                    <a href="#how-it-works" className="inline-flex items-center bg-white border border-primary text-primary hover:bg-primary/5 font-medium py-3 px-6 rounded-lg transition-all duration-300">
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/2 mt-8 md:mt-0">
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full"></div>
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/10 rounded-full"></div>
                  <div className="relative bg-white p-4 rounded-xl shadow-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20"></div>
                        <span className="relative text-sm font-medium text-gray-700">Before</span>
                      </div>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100"></div>
                        <span className="relative text-sm font-medium text-gray-700">After</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">+42% Click-Through Rate</h3>
                          <p className="text-xs text-gray-600">Average improvement with our recommendations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* How It Works Section */}
        <div id="how-it-works" className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our AI-powered tool analyzes your thumbnails and provides actionable recommendations in three simple steps.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-xl p-6 text-center relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold shadow-md">1</div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Thumbnail</h3>
                <p className="text-gray-600">Upload your thumbnail image, paste a URL, or enter a YouTube video ID.</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 text-center relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold shadow-md">2</div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Analysis</h3>
                <p className="text-gray-600">Our AI analyzes text, colors, faces, and composition of your thumbnail.</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 text-center relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold shadow-md">3</div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Get Recommendations</h3>
                <p className="text-gray-600">Receive actionable insights to improve your thumbnail&apos;s effectiveness.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content - Upload and Analysis */}
        <div id="analyze" className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Analyze Your Thumbnail</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload your thumbnail and get AI-powered recommendations in seconds.
              </p>
            </div>
            
            <div className="text-center mb-8 w-full">
              {/* Main Upload Area */}
              <div className="w-full">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 w-full">
                  {/* Error Message */}
                  {error && (
                    <div id="error-message" className="p-4 bg-red-50 border-b border-red-200 text-red-700 animate-fadeIn flex items-center w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}
                  
                  {/* Thumbnail Upload Component */}
                  {isLoading ? (
                    <AnalysisLoading progress={progress} />
                  ) : (
                    <>
                      {!showAuthInAnalyze ? (
                        <div className="p-6 w-full">
                          <ThumbnailUpload 
                            onSubmit={(data) => {
                              if (!isSignedIn) {
                                setPendingData(data);
                                setShowAuthInAnalyze(true);
                              } else {
                                handleThumbnailSubmit(data);
                              }
                            }} 
                            isLoading={isLoading}
                            buttonText="Analyze Thumbnail"
                          />
                        </div>
                      ) : (
                        <div className="w-full max-w-md mx-auto">
                          <div className="flex justify-between items-center px-4 pt-4">
                            <button 
                              onClick={() => setShowAuthInAnalyze(false)}
                              className="text-gray-500 hover:text-gray-700 flex items-center text-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                              </svg>
                              Back
                            </button>
                            
                            <div className="flex space-x-2 text-sm">
                              <button
                                onClick={() => setAuthView('signUp')}
                                className={`px-3 py-1 rounded-full transition-colors ${
                                  authView === 'signUp' 
                                    ? 'bg-primary text-white' 
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                Sign up
                              </button>
                              <button
                                onClick={() => setAuthView('signIn')}
                                className={`px-3 py-1 rounded-full transition-colors ${
                                  authView === 'signIn' 
                                    ? 'bg-primary text-white' 
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                Sign in
                              </button>
                            </div>
                          </div>
                          
                          {/* Direct Clerk Integration */}
                          <div className="clerk-container w-full px-4 pb-6 mt-2">
                            {authView === 'signUp' ? (
                              <SignUp 
                                signInUrl="#"
                                afterSignUpUrl="#__clerk_cb=1"
                                redirectUrl=""
                                routing="hash"
                                appearance={{
                                  elements: {
                                    formButtonPrimary: 'bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-all duration-200',
                                    formFieldInput: 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                                    card: 'shadow-none border-none p-0',
                                    headerTitle: 'text-xl font-bold text-gray-900',
                                    headerSubtitle: 'hidden',
                                    rootBox: 'mx-auto',
                                    footer: 'hidden',
                                    socialButtonsBlockButton: 'border border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200',
                                    socialButtonsBlockButtonText: 'font-medium'
                                  },
                                  layout: {
                                    socialButtonsPlacement: 'top',
                                    showOptionalFields: false,
                                    termsPageUrl: '/terms'
                                  }
                                }}
                              />
                            ) : (
                              <SignIn 
                                signUpUrl="#"
                                afterSignInUrl="#__clerk_cb=1"
                                redirectUrl=""
                                routing="hash"
                                appearance={{
                                  elements: {
                                    formButtonPrimary: 'bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-all duration-200',
                                    formFieldInput: 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                                    card: 'shadow-none border-none p-0',
                                    headerTitle: 'text-xl font-bold text-gray-900',
                                    headerSubtitle: 'hidden',
                                    rootBox: 'mx-auto',
                                    footer: 'hidden',
                                    socialButtonsBlockButton: 'border border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200',
                                    socialButtonsBlockButtonText: 'font-medium'
                                  },
                                  layout: {
                                    socialButtonsPlacement: 'top',
                                    termsPageUrl: '/terms'
                                  }
                                }}
                              />
                            )}
                            
                            <div className="text-center text-xs text-gray-500 mt-6">
                              By signing up, you'll get 1 free thumbnail analysis per day
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div id="features" className="py-12 bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Key Features</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our BetterThumbnails tool provides comprehensive insights to help you create more effective thumbnails.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-600">AI-Powered Analysis</h3>
                <p className="text-gray-600">Get detailed insights on your thumbnail&apos;s effectiveness using advanced AI algorithms.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Text detection and readability
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Color analysis and contrast
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Face detection and expressions
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-600">Actionable Recommendations</h3>
                <p className="text-gray-600">Receive specific suggestions to improve your thumbnail&apos;s click-through rate.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Personalized improvement tips
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Best practices for YouTube
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Competitor comparison
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-600">Instant Results</h3>
                <p className="text-gray-600">Get comprehensive analysis in seconds, no waiting or complex setup required.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Fast processing time
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    1 Free Daily Analysis
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Multiple upload methods
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
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
                <span className="text-lg font-bold">BetterThumbnails.com</span>
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
            <p>© {new Date().getFullYear()} BetterThumbnails.com. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Welcome Toast */}
      {showWelcomeMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg animate-fade-in-up">
          <div className="flex items-center">
            <div className="py-1">
              <svg className="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Welcome Back!</p>
              <p className="text-sm">You have {analysisCount === 0 ? 'no' : analysisCount} free thumbnail {analysisCount === 1 ? 'analysis' : 'analyses'} left today.</p>
            </div>
            <button onClick={() => setShowWelcomeMessage(false)} className="ml-auto text-green-500 hover:text-green-700">
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Auth Modal - kept for backward compatibility but hidden by default */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="signUp"
        onAuthSuccess={() => {
          console.log('Auth success callback in Home component, pendingData:', pendingData);
          if (pendingData) {
            // This callback is triggered when authentication is successful
            setShowWelcomeMessage(true);
            handleThumbnailSubmit(pendingData);
            setPendingData(null);
          }
        }}
      />
    </div>
  );
}
