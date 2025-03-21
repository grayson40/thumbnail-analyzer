import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'img.youtube.com',  // Allow YouTube thumbnail images
      'i.ytimg.com',      // Alternative YouTube image domain
      'i3.ytimg.com',     // Another YouTube image domain
      'via.placeholder.com', // For placeholder images
      'ovqbsufswnnpsxwm.public.blob.vercel-storage.com' // Vercel Blob domain
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ovqbsufswnnpsxwm.public.blob.vercel-storage.com',
        port: '',
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
