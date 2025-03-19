import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { useEffect } from "react";
import { initConnection } from "@/lib/db/connection";
import { initializeDatabase } from '@/lib/db/initialize';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Initialize the database connection and schema
const initDB = async () => {
  try {
    // First initialize the connection
    const connectionSuccess = await initConnection();
    if (!connectionSuccess) {
      console.warn('Failed to initialize database connection. Some features may not work correctly.');
      return;
    }
    
    // Then initialize the schema
    const schemaSuccess = await initializeDatabase();
    if (!schemaSuccess) {
      console.warn('Failed to initialize database schema. Some features may not work correctly.');
      return;
    }
    
    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
};

// Run the initialization
if (typeof process !== 'undefined') {
  initDB().catch(err => {
    console.error('Failed to initialize the database:', err);
  });
}

export const metadata: Metadata = {
  title: "BetterThumbnails.com - Improve Your YouTube Click-Through Rate",
  description: "Analyze your YouTube thumbnails with AI and get actionable recommendations to improve your click-through rates and grow your channel.",
  keywords: ["YouTube", "thumbnail", "analyzer", "CTR", "click-through rate", "AI", "analysis", "optimization"],
  authors: [{ name: "BetterThumbnails.com" }],
  creator: "BetterThumbnails.com",
  publisher: "BetterThumbnails.com",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <meta name="google" content="notranslate" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}
        >
          <main className="flex-grow">
            {children}
            <Analytics />
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
