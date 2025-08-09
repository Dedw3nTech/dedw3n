import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function MobileLanding() {
  return (
    <>
      <SEOHead 
        title="Dedw3n Mobile - Spend More Time Enjoying Life"
        description="Mobile optimized access to Dedw3n's social marketplace platform"
      />
      
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm mx-auto">
          <img 
            src="/attached_assets/spend more time enjoying life (395 x 932 px)_1754773395025.png"
            alt="Spend more time enjoying life"
            className="w-full h-auto object-contain"
            style={{ maxWidth: '395px', maxHeight: '932px' }}
            onError={(e) => {
              console.error('Image failed to load:', e);
              // Fallback to previous version
              if (e.currentTarget.src.includes('_1754773395025.png')) {
                e.currentTarget.src = '/attached_assets/spend more time enjoying life (395 x 932 px)_1754767685316.png';
              }
            }}
          />
        </div>
      </div>
    </>
  );
}