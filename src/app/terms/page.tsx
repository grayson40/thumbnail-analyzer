import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms of Service</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-800 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            
            <h2 className="text-gray-800">1. Acceptance of Terms</h2>
            <p className="text-gray-800">
              By accessing or using the BetterThumbnails.com service, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
            
            <h2 className="text-gray-800">2. Description of Service</h2>
            <p className="text-gray-800">
              BetterThumbnails.com provides AI-powered analysis of YouTube thumbnails to help content creators improve their thumbnail effectiveness. The service analyzes various aspects including text, colors, faces, and composition.
            </p>
            
            <h2 className="text-gray-800">3. User Responsibilities</h2>
            <p className="text-gray-800">
              You are responsible for ensuring that you have the right to upload and analyze any thumbnails submitted to our service. You must not upload thumbnails that contain illegal, offensive, or inappropriate content.
            </p>
            
            <h2 className="text-gray-800">4. API Usage and Limitations</h2>
            <p className="text-gray-800">
              Our service utilizes Google Cloud Vision API and other third-party services. Usage is subject to the limitations and terms of these services. We reserve the right to limit the number of analyses per user to ensure fair usage.
            </p>
            
            <h2 className="text-gray-800">5. Intellectual Property</h2>
            <p className="text-gray-800">
              You retain all rights to the thumbnails you upload. By using our service, you grant us a limited license to analyze your thumbnails for the purpose of providing our service. We do not claim ownership of your content.
            </p>
            
            <h2 className="text-gray-800">6. Data Storage</h2>
            <p className="text-gray-800">
              Analysis results are temporarily stored to provide you with the service. We may anonymize and aggregate data to improve our service. Please refer to our Privacy Policy for more information on how we handle your data.
            </p>
            
            <h2 className="text-gray-800">7. Disclaimer of Warranties</h2>
            <p className="text-gray-800">
              The service is provided &quot;as is&quot; without warranties of any kind, either express or implied. We do not guarantee that the analysis will improve your YouTube performance or click-through rates.
            </p>
            
            <h2 className="text-gray-800">8. Limitation of Liability</h2>
            <p className="text-gray-800">
              We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>
            
            <h2 className="text-gray-800">9. Changes to Terms</h2>
            <p className="text-gray-800">
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
            </p>
            
            <h2 className="text-gray-800">10. Governing Law</h2>
            <p className="text-gray-800">
              These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which we operate, without regard to its conflict of law provisions.
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