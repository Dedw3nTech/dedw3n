import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { HeroBackground } from '@/components/ui/HeroBackground';

export default function MobileLanding() {
  return (
    <>
      <SEOHead 
        title="Dedw3n Mobile - Spend More Time Enjoying Life"
        description="Mobile access to Dedw3n's social marketplace platform. Discover, connect, and shop with an optimized mobile experience."
        keywords="Dedw3n mobile, mobile marketplace, social commerce, mobile shopping, mobile platform"
      />
      
      {/* Unified Hero Background */}
      <HeroBackground 
        alt="Spend more time enjoying life - Dedw3n Mobile"
        onLoad={() => console.log('Mobile hero background image loaded successfully')}
        onError={() => console.error('Failed to load mobile hero background image')}
      >
        {/* Content positioned over background */}
        <div className="flex-1 flex flex-col justify-between px-4 py-8">
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
      </HeroBackground>
    </>
  );
}