'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, UserProfile, UserButton } from '@clerk/nextjs';
import { getUserDailyAnalysisCount, getLastAnalysisTimestamp, getUserThumbnailAnalyses } from '@/lib/db/index';
import { redirect } from 'next/navigation';
import Header from '../components/Header';
import Link from 'next/link';
import Image from 'next/image';

// Define the thumbnail analysis type for improved type safety
interface ThumbnailAnalysis {
  id: number;
  thumbnail: {
    url: string;
    title?: string;
    width: number;
    height: number;
  };
  previewUrl: string;
  scores: {
    overall: number;
    text?: number;
    visual?: number;
    faces?: number;
    composition?: number;
  };
  createdAt: string;
  formattedDate: string;
}

// Define the interface for analysis item in the dashboard list
interface AnalysisListItem {
  id: number;
  thumbnail: {
    url: string;
    title?: string;
    width: number;
    height: number;
  };
  scores: {
    overall: number;
    [key: string]: number;
  };
  createdAt: string;
}

export default function ProfilePage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [analysisCount, setAnalysisCount] = useState<number | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analysisHistory, setAnalysisHistory] = useState<ThumbnailAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dashboardAnalyses, setDashboardAnalyses] = useState<AnalysisListItem[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [noAnalysesAvailable, setNoAnalysesAvailable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Showing fewer items per page since this is embedded in the profile page

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        redirect('/sign-in');
      } else {
        fetchUserData();
      }
    }
  }, [isLoaded, isSignedIn]);

  // Fetch analysis history when the history tab is activated
  useEffect(() => {
    if (activeTab === 'history' && userId && analysisHistory.length === 0 && !historyLoading) {
      fetchAnalysisHistory();
    }
  }, [activeTab, userId, analysisHistory.length, historyLoading]);

  // Fetch dashboard analyses when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard' && userId && !dashboardLoading && !noAnalysesAvailable && 
        (dashboardAnalyses.length === 0 || currentPage > 1)) {
      fetchDashboardAnalyses();
    }
  }, [activeTab, userId, dashboardAnalyses.length, dashboardLoading, currentPage, noAnalysesAvailable]);

  // Reset noAnalysesAvailable when page changes
  useEffect(() => {
    // If we're navigating to a new page, we don't know yet if there are analyses there
    if (currentPage > 1) {
      setNoAnalysesAvailable(false);
    }
  }, [currentPage]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      const count = await getUserDailyAnalysisCount(userId);
      const timestamp = await getLastAnalysisTimestamp(userId);
      
      setAnalysisCount(count);
      setLastAnalysis(timestamp);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardAnalyses = async () => {
    if (!userId) return;
    
    setDashboardLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await fetch(`/api/user/analyses?limit=${itemsPerPage}&offset=${offset}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analyses');
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (data.analyses.length === 0 && currentPage === 1) {
          // If we're on the first page and there are no analyses, mark that no analyses are available
          setNoAnalysesAvailable(true);
        } else if (data.analyses.length > 0) {
          // If we got analyses, make sure this flag is false
          setNoAnalysesAvailable(false);
        }
        
        setDashboardAnalyses(data.analyses);
      } else {
        throw new Error('Failed to fetch analyses');
      }
    } catch (error: any) {
      console.error('Error fetching analyses:', error);
      setDashboardError(error.message || 'Failed to fetch your analysis history');
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchAnalysisHistory = async () => {
    if (!userId) return;
    
    setHistoryLoading(true);
    try {
      const history = await getUserThumbnailAnalyses(userId, 10, 0);
      setAnalysisHistory(history);
      console.log('Fetched analysis history:', history);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Reset pagination and loading states when changing tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    
    if (tab === 'dashboard') {
      setNoAnalysesAvailable(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format date for dashboard display
  const formatDashboardDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get score color class based on score value
  const getScoreColorClass = (score: number, variant: 'badge' | 'circle' = 'circle') => {
    if (variant === 'circle') {
      // For circular score displays (history tab)
      if (score >= 80) return 'bg-green-500';
      if (score >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    } else {
      // For badge score displays (dashboard tab)
      if (score >= 90) return 'bg-green-100 text-green-800';
      if (score >= 70) return 'bg-blue-100 text-blue-800';
      if (score >= 50) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <Header navItems={[]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const remainingAnalyses = Math.max(0, 1 - (analysisCount || 0));
  const nextResetTime = new Date();
  nextResetTime.setHours(24, 0, 0, 0);
  const timeUntilReset = nextResetTime.getTime() - new Date().getTime();
  const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
  const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <Header navItems={[]} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header with Welcome Message */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-white/80">
                  Manage your account and view your thumbnail analysis stats
                </p>
              </div>
              {remainingAnalyses > 0 ? (
                <Link
                  href="/#analyze"
                  className="mt-4 md:mt-0 bg-white text-primary hover:bg-white/90 font-medium py-2 px-6 rounded-lg transition-all duration-300 inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  Analyze Thumbnail
                </Link>
              ) : (
                <div className="mt-4 md:mt-0 bg-white/10 border border-white/20 text-white rounded-lg py-2 px-6 inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Quota resets in {hoursUntilReset}h {minutesUntilReset}m</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-1/3 lg:w-1/4">
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="mr-4">
                    <UserButton />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Your Account</h2>
                    <p className="text-sm text-gray-600">Free Plan</p>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <nav>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-colors ${
                      activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => handleTabChange('dashboard')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Dashboard
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-colors ${
                      activeTab === 'history' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => handleTabChange('history')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Analysis History
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-colors ${
                      activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => handleTabChange('settings')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Account Settings
                  </button>
                </nav>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md overflow-hidden text-white">
              <div className="p-6">
                <h3 className="font-semibold mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                  Unlock More Features
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  Coming soon: Upgrade to Premium for unlimited analyses, advanced metrics, and thumbnail generation.
                </p>
                <button 
                  className="w-full bg-white text-blue-600 font-medium py-2 rounded-lg transition-opacity hover:opacity-90"
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:w-2/3 lg:w-3/4">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-start">
                      <div className="p-2 bg-green-100 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Analyses Available</p>
                        <h3 className="text-2xl font-bold text-gray-800">{remainingAnalyses}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Resets at midnight {hoursUntilReset}h {minutesUntilReset}m
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-start">
                      <div className="p-2 bg-blue-100 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Analyses Used Today</p>
                        <h3 className="text-2xl font-bold text-gray-800">{analysisCount || 0}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Free plan: 1 analysis/day
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-start">
                      <div className="p-2 bg-purple-100 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Last Analysis</p>
                        <h3 className="text-lg font-bold text-gray-800 truncate">
                          {lastAnalysis ? formatDate(lastAnalysis) : 'Never'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {lastAnalysis ? 'View in history tab' : 'No analyses yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Analyses */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Analyses</h2>
                    <p className="text-sm text-gray-600">View and manage your recent thumbnail analyses</p>
                  </div>
                  
                  <div className="p-6">
                    {dashboardError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                        <p>{dashboardError}</p>
                      </div>
                    )}
                    
                    {dashboardLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : dashboardAnalyses.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center bg-gray-100 rounded-full w-16 h-16 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No analyses yet</h3>
                        <p className="text-gray-600 mb-4">
                          Get started by analyzing your first YouTube thumbnail
                        </p>
                        <Link
                          href="/#analyze"
                          className="inline-flex items-center bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                          </svg>
                          Analyze Your First Thumbnail
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {dashboardAnalyses.map((analysis) => (
                            <Link 
                              href={`/results?id=${analysis.id}`} 
                              key={analysis.id}
                              className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                            >
                              <div className="flex flex-col sm:flex-row">
                                <div className="sm:w-32 h-24 relative bg-gray-100">
                                  {analysis.thumbnail.url ? (
                                    <div className="relative w-full h-full">
                                      <Image 
                                        src={analysis.thumbnail.url} 
                                        alt="Thumbnail" 
                                        fill
                                        sizes="128px"
                                        style={{ objectFit: 'cover' }}
                                        className="bg-gray-200"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-gray-400">No image</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="p-4 flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-medium text-gray-800 mb-1">
                                        {analysis.thumbnail.title || `Analysis #${analysis.id}`}
                                      </h3>
                                      <p className="text-sm text-gray-500 mb-2">
                                        {formatDashboardDate(analysis.createdAt)}
                                      </p>
                                    </div>
                                    
                                    <div className={`rounded-full px-3 py-1 text-sm font-medium ${getScoreColorClass(analysis.scores.overall, 'badge')}`}>
                                      Score: {analysis.scores.overall}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-2">
                                    <div className="flex flex-wrap gap-2">
                                      {Object.entries(analysis.scores)
                                        .filter(([key]) => key !== 'overall')
                                        .map(([key, score]) => (
                                          <div 
                                            key={key} 
                                            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700"
                                          >
                                            {key.charAt(0).toUpperCase() + key.slice(1)}: {score}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="p-4 sm:p-0 sm:flex items-center px-4">
                                  <div className="text-primary hover:text-primary-hover text-sm font-medium">
                                    View Results →
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        
                        {/* Pagination controls */}
                        <div className="flex justify-between items-center mt-6">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded text-sm ${
                              currentPage === 1 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-primary text-white hover:bg-primary-hover'
                            }`}
                          >
                            Previous
                          </button>
                          
                          <span className="text-sm text-gray-600">
                            Page {currentPage}
                          </span>
                          
                          <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={dashboardAnalyses.length < itemsPerPage}
                            className={`px-3 py-1 rounded text-sm ${
                              dashboardAnalyses.length < itemsPerPage
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-primary text-white hover:bg-primary-hover'
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Tips section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Thumbnail Tips</h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h3 className="font-medium text-gray-800 mb-2">Tips for better thumbnails:</h3>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Use high contrast colors and clear text
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Include faces with emotional expressions
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Keep it simple and focus on one key element
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'history' && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">Analysis History</h2>
                  <p className="text-sm text-gray-600">View your recent thumbnail analyses</p>
                </div>
                
                <div className="p-6">
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : analysisHistory.length > 0 ? (
                    <div className="space-y-4">
                      {analysisHistory.map((analysis) => (
                        <div key={analysis.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600 flex justify-between items-center">
                            <span>{analysis.formattedDate}</span>
                            <Link 
                              href={`/results?id=${analysis.id}`} 
                              className="text-primary hover:text-primary-hover"
                            >
                              View Results
                            </Link>
                          </div>
                          <div className="p-4 flex items-center">
                            <div className="w-24 h-16 bg-gray-100 rounded-md mr-4 overflow-hidden relative">
                              {analysis.previewUrl ? (
                                <div className="relative w-24 h-16">
                                  <Image
                                    src={analysis.previewUrl}
                                    alt="Thumbnail preview"
                                    fill
                                    sizes="96px"
                                    style={{ objectFit: 'cover' }}
                                    className="rounded-md"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-gray-800">
                                    {analysis.thumbnail.title || 'Thumbnail Analysis'}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {analysis.thumbnail.width}x{analysis.thumbnail.height}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <div className={`w-10 h-10 rounded-full ${getScoreColorClass(analysis.scores.overall, 'circle')} flex items-center justify-center text-white font-medium text-sm`}>
                                    {analysis.scores.overall}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-4 pb-4 pt-0 flex justify-end">
                            <Link
                              href={`/results?id=${analysis.id}`}
                              className="text-sm bg-white border border-primary text-primary hover:bg-primary/5 font-medium py-1 px-3 rounded-lg transition-colors flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              View Analysis
                            </Link>
                          </div>
                        </div>
                      ))}
                      
                      {/* Keep this message for now - will be replaced with pagination in future */}
                      <div className="text-center text-gray-600 text-sm py-4">
                        <p>Premium plan will include history of all your analyses</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center bg-gray-100 rounded-full w-16 h-16 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No analysis history</h3>
                      <p className="text-gray-600 mb-4">
                        Your analysis history will appear here once you've analyzed thumbnails
                      </p>
                      <Link
                        href="/#analyze"
                        className="inline-flex items-center bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                        Analyze Your First Thumbnail
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">Account Settings</h2>
                  <p className="text-sm text-gray-600">Manage your account preferences</p>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium text-gray-800 mb-3">Your Profile</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <UserProfile />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium text-gray-800 mb-3">Current Plan</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Free Plan</h4>
                            <p className="text-sm text-gray-600">1 analysis per day</p>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            Current
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium text-gray-800 mb-3">Account Actions</h3>
                      <div className="flex flex-col space-y-2">
                        <Link 
                          href="/"
                          className="text-gray-600 hover:text-gray-800 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                          </svg>
                          Return to Homepage
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 