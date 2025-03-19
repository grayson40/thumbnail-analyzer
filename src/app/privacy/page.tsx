import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-800 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            
            <h2 className="text-gray-800">1. Introduction</h2>
            <p className="text-gray-800">
              This Privacy Policy explains how BetterThumbnails.com collects, uses, and protects your information when you use our service. We are committed to ensuring the privacy and security of your data.
            </p>
            
            <h2 className="text-gray-800">2. Information We Collect</h2>
            <p className="text-gray-800">
              We collect the following types of information:
            </p>
            <ul>
              <li className="text-gray-800"><strong>Thumbnail Images:</strong> When you upload a thumbnail or provide a URL, we process this image to provide our analysis service.</li>
              <li className="text-gray-800"><strong>YouTube Video IDs:</strong> If you provide a YouTube video ID, we use it to retrieve the associated thumbnail.</li>
              <li className="text-gray-800"><strong>Analysis Results:</strong> We temporarily store the results of your thumbnail analysis.</li>
              <li className="text-gray-800"><strong>Usage Data:</strong> We collect anonymous data about how you interact with our service to improve user experience.</li>
            </ul>
            
            <h2 className="text-gray-800">3. How We Use Your Information</h2>
            <p className="text-gray-800">
              We use your information for the following purposes:
            </p>
            <ul>
              <li className="text-gray-800">To provide and maintain our service</li>
              <li className="text-gray-800">To analyze your thumbnails and generate recommendations</li>
              <li className="text-gray-800">To improve our analysis algorithms and service quality</li>
              <li className="text-gray-800">To detect and prevent technical issues or abuse</li>
            </ul>
            
            <h2 className="text-gray-800">4. Data Storage and Security</h2>
            <p className="text-gray-800">
              Your thumbnail images and analysis results are stored temporarily to provide the service. We implement appropriate security measures to protect your data from unauthorized access, alteration, or disclosure.
            </p>
            
            <h2 className="text-gray-800">5. Third-Party Services</h2>
            <p className="text-gray-800">
              We use the following third-party services to provide our analysis:
            </p>
            <ul>
              <li className="text-gray-800"><strong>Google Cloud Vision API:</strong> Used for image analysis, including text detection, face detection, and color analysis.</li>
              <li className="text-gray-800"><strong>Anthropic API:</strong> Used for generating recommendations based on analysis results.</li>
            </ul>
            <p className="text-gray-800">
              These services have their own privacy policies that govern how they process your data.
            </p>
            
            <h2 className="text-gray-800">6. Data Retention</h2>
            <p className="text-gray-800">
              We retain your thumbnail images and analysis results only for as long as necessary to provide the service. Analysis results are stored in your browser&apos;s local storage and are not permanently stored on our servers.
            </p>
            
            <h2 className="text-gray-800">7. Your Rights</h2>
            <p className="text-gray-800">
              Depending on your location, you may have rights regarding your personal data, including:
            </p>
            <ul>
              <li className="text-gray-800">The right to access your data</li>
              <li className="text-gray-800">The right to correct inaccurate data</li>
              <li className="text-gray-800">The right to delete your data</li>
              <li className="text-gray-800">The right to restrict or object to processing</li>
            </ul>
            
            <h2 className="text-gray-800">8. Children&apos;s Privacy</h2>
            <p className="text-gray-800">
              Our service is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
            
            <h2 className="text-gray-800">9. Changes to This Privacy Policy</h2>
            <p className="text-gray-800">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
            
            <h2 className="text-gray-800">10. Contact Us</h2>
            <p className="text-gray-800">
              If you have any questions about this Privacy Policy, please contact us through our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link>.
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href="/" className="text-primary hover:text-primary-hover transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 