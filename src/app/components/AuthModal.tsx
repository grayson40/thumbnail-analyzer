'use client';

import React, { useEffect, useState } from 'react';
import {
  SignIn,
  SignUp,
  useAuth,
} from '@clerk/nextjs';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  defaultView?: 'signIn' | 'signUp';
  embedded?: boolean;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess, 
  defaultView = 'signUp',
  embedded = false 
}: AuthModalProps) {
  const [view, setView] = useState<'signIn' | 'signUp'>(defaultView);
  const [authSuccess, setAuthSuccess] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    console.log('AuthModal - Auth state:', { isLoaded, isSignedIn, authSuccess });
    
    // Check if auth state has changed to signed in
    if (isLoaded && isSignedIn && !authSuccess) {
      console.log('AuthModal - User signed in, triggering onAuthSuccess');
      setAuthSuccess(true);
      
      // Call onAuthSuccess immediately if provided
      if (onAuthSuccess) {
        console.log('AuthModal - Calling onAuthSuccess callback');
        onAuthSuccess();
      }
      
      // Close the modal
      if (!embedded) {
        onClose();
      }
    }
  }, [isLoaded, isSignedIn, authSuccess, onAuthSuccess, onClose, embedded]);
  
  // Listen for hash changes (Clerk auth completion)
  useEffect(() => {
    const handleHashChange = () => {
      // Check for authentication callback completion in URL hash
      if (window.location.hash.includes('__clerk_cb=') || window.location.hash.includes('__clerk_status=')) {
        console.log('AuthModal - Detected Clerk callback hash');
        
        // Set flag for new sign-in
        sessionStorage.setItem('isNewSignIn', 'true');
        
        // Clear the hash to clean up the URL
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
        
        // Try multiple attempts with increasing delays to check auth state
        const checkAuthState = (attempts = 0) => {
          console.log(`AuthModal - Checking auth state, attempt ${attempts + 1}`);
          
          if (isSignedIn) {
            console.log('AuthModal - Auth confirmed, triggering success');
            setAuthSuccess(true);
            
            // Call the callback
            if (onAuthSuccess) {
              console.log('AuthModal - Calling onAuthSuccess from hash handler');
              onAuthSuccess();
            }
            
            // Close the modal if not embedded
            if (!embedded) {
              onClose();
            }
          } else if (attempts < 5) {
            // Try again with progressively longer delays
            const delay = Math.min(500 * Math.pow(1.5, attempts), 3000);
            setTimeout(() => checkAuthState(attempts + 1), delay);
          }
        };
        
        // Start checking auth state
        checkAuthState();
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    // Also check on mount in case hash is already present
    handleHashChange();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isSignedIn, onAuthSuccess, onClose, embedded]);

  if (embedded) {
    return (
      <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 pb-0">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {view === 'signUp' ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {view === 'signUp' 
                ? 'Sign up to get 1 free thumbnail analysis per day'
                : 'Sign in to access your free daily analysis'}
            </p>
          </div>
          
          {view === 'signUp' ? (
            <>
              <SignUp 
                signInUrl="#"
                afterSignUpUrl="#__clerk_cb=1"
                redirectUrl=""
                routing="hash"
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-primary hover:bg-primary-hover text-white',
                    footerActionLink: 'text-primary hover:text-primary-hover',
                    card: 'shadow-none border-none',
                    headerSubtitle: 'hidden'
                  }
                }}
              />
              <div className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setView('signIn')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </button>
              </div>
            </>
          ) : (
            <>
              <SignIn 
                signUpUrl="#"
                afterSignInUrl="#__clerk_cb=1"
                redirectUrl=""
                routing="hash"
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-primary hover:bg-primary-hover text-white',
                    footerActionLink: 'text-primary hover:text-primary-hover',
                    card: 'shadow-none border-none',
                    headerSubtitle: 'hidden'
                  }
                }}
              />
              <div className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setView('signUp')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        {view === 'signUp' ? (
            <SignUp 
              signInUrl="#"
              afterSignUpUrl="#__clerk_cb=1"
              redirectUrl=""
              routing="hash"
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-primary hover:bg-primary-hover text-white',
                  footerActionLink: 'text-primary hover:text-primary-hover',
                  card: 'shadow-none border-none',
                  headerSubtitle: 'hidden'
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
                  formButtonPrimary: 'bg-primary hover:bg-primary-hover text-white',
                  footerActionLink: 'text-primary hover:text-primary-hover',
                  card: 'shadow-none border-none',
                  headerSubtitle: 'hidden'
                }
              }}
            />
        )}
      </div>
    </div>
  );
} 