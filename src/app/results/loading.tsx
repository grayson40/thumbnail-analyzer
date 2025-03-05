import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center animate-pulse">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-80 mb-12"></div>
          
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
            <div className="h-6 bg-gray-200 rounded w-48 mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="space-y-6">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-6 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 