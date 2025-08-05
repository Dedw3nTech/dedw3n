import React from 'react';

export default function LandingPage() {
  const heroImagePath = "/hero-image-new.png";
  
  return (
    <div className="min-h-screen w-full">
      {/* Hero section with full image display - no cropping */}
      <section className="relative w-full flex items-center justify-center bg-white">
        {/* Full image container that maintains aspect ratio */}
        <div className="w-full max-w-none">
          <img 
            src={heroImagePath} 
            alt="Spend more time enjoying life - Dedw3n"
            className="w-full h-auto object-contain block"
            style={{
              minHeight: '100vh',
              objectFit: 'contain',
              objectPosition: 'center center'
            }}
          />
        </div>
        
        {/* Optional overlay content can be added here if needed */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Content overlay space - currently empty to show full image */}
        </div>
      </section>
    </div>
  );
}