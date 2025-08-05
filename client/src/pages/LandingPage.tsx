import React from 'react';

export default function LandingPage() {
  const heroImagePath = "/hero-image-new.png";
  
  return (
    <div className="min-h-screen w-full">
      {/* Hero section with full image display - responsive background handling */}
      <section className="relative w-full min-h-screen overflow-hidden">
        {/* Background color that matches the image theme */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black"></div>
        
        {/* Full image container that maintains aspect ratio */}
        <div className="relative w-full h-full flex items-center justify-center min-h-screen">
          <img 
            src={heroImagePath} 
            alt="Spend more time enjoying life - Dedw3n"
            className="w-full h-auto object-contain block max-w-full max-h-full"
            style={{
              minHeight: '60vh',
              maxHeight: '100vh',
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