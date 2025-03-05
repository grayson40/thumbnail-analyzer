import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="h-10 bg-gray-200 rounded w-80 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-72 mb-12"></div>
          
          <div className="w-full bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex space-x-4 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded flex-1"></div>
              ))}
            </div>
            
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            
            <div className="h-12 bg-gray-200 rounded-lg"></div>
          </div>
          
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-white rounded-xl shadow-md p-6">
                <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 