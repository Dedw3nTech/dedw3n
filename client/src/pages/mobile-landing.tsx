import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import heroImageMobile from '@assets/spend more time enjoying life (395 x 932 px)_1754767685316.png';

export default function MobileLanding() {
  return (
    <>
      <SEOHead 
        title="Dedw3n Mobile - Spend More Time Enjoying Life"
        description="Mobile optimized access to Dedw3n's social marketplace platform"
        canonicalUrl="https://dedw3n.com/mobile"
      />
      
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm mx-auto">
          <img 
            src={heroImageMobile}
            alt="Spend more time enjoying life"
            className="w-full h-auto object-contain"
            style={{ maxWidth: '395px', maxHeight: '932px' }}
          />
        </div>
      </div>
    </>
  );
}