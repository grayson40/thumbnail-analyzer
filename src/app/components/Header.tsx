'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';

interface NavItem {
  label: string;
  href: string;
  onClick?: () => void;
}

interface HeaderProps {
  navItems: NavItem[];
}

export default function Header({ navItems }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Desktop Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg mr-3 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">BetterThumbnails</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav>
              <ul className="flex space-x-6">
                {navItems.map((item, index) => (
                  <li key={index}>
                    {item.onClick ? (
                      <button
                        onClick={item.onClick}
                        className={`text-gray-600 hover:text-primary transition-colors ${
                          pathname === item.href ? 'text-primary font-medium' : ''
                        }`}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={`text-gray-600 hover:text-primary transition-colors ${
                          pathname === item.href ? 'text-primary font-medium' : ''
                        }`}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Auth / Profile Section */}
            <div className="flex items-center ml-4">
              {isLoaded && (
                isSignedIn ? (
                  <div className="flex items-center gap-2">
                    {pathname !== '/dashboard' && (
                      <Link 
                        href="/dashboard" 
                        className="text-gray-600 hover:text-primary transition-colors flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        Go to Console
                      </Link>
                    )}
                    <div className="ml-2">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </div>
                ) : (
                  <Link 
                    href="/sign-in"
                    className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                  >
                    Sign In
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex items-center"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-2">
            <ul className="flex flex-col space-y-3">
              {navItems.map((item, index) => (
                <li key={index}>
                  {item.onClick ? (
                    <button
                      onClick={() => {
                        item.onClick?.();
                        setIsMenuOpen(false);
                      }}
                      className={`block w-full text-left py-2 px-3 rounded-md text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors ${
                        pathname === item.href ? 'bg-gray-100 text-primary font-medium' : ''
                      }`}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block py-2 px-3 rounded-md text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors ${
                        pathname === item.href ? 'bg-gray-100 text-primary font-medium' : ''
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}

              {/* Auth links for mobile */}
              {isLoaded && (
                isSignedIn ? (
                  <>
                    {pathname !== '/dashboard' && (
                      <li>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center py-2 px-3 rounded-md text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          Go to Console
                        </Link>
                      </li>
                    )}
                  </>
                ) : (
                  <li>
                    <Link
                      href="/sign-in"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center py-2 px-3 rounded-md text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      Sign In
                    </Link>
                  </li>
                )
              )}
            </ul>
            
            {/* User button in mobile menu if signed in */}
            {isLoaded && isSignedIn && (
              <div className="mt-4 px-3">
                <div className="border-t border-gray-200 pt-4 flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Account: </span>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
} 