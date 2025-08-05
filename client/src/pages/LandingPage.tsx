import React from 'react';

export default function LandingPage() {
  const heroImagePath = "/hero-image-new.png";
  
  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* Hero section with full image display optimized for mobile and desktop */}
      <section className="relative w-full h-screen bg-white">
        {/* Full image container that fills viewport on all devices */}
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={heroImagePath} 
            alt="Spend more time enjoying life - Dedw3n"
            className="w-full h-full object-cover md:object-contain"
            style={{
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