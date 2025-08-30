import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function MobileLanding() {
  return (
    <>
      <SEOHead 
        title="Dedw3n Mobile - Spend More Time Enjoying Life"
        description="Mobile access to Dedw3n's social marketplace platform. Discover, connect, and shop with an optimized mobile experience."
        keywords="Dedw3n mobile, mobile marketplace, social commerce, mobile shopping, mobile platform"
      />
      
      {/* Full Screen Background Image Layout */}
      <div 
        className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat flex flex-col"
        style={{
          backgroundImage: `url('/attached_assets/spend more time enjoying life (Website) (5)_1756528059778.png?v=1756528600')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Content positioned over background */}
        <div className="relative z-10 flex-1 flex flex-col justify-between px-4 py-8">
          {/* Top Section */}
          <div className="flex-shrink-0">
            {/* Space for global header */}
          </div>

          {/* Middle Section - Main content area */}
          <div className="flex-1 flex items-center justify-center">
            {/* Main background image takes up the space */}
          </div>

          {/* Bottom Section - Pure Background Image */}
          <div className="flex-shrink-0">
            {/* No buttons or UI elements - pure background image experience */}
          </div>
        </div>
      </div>
    </>
  );
}