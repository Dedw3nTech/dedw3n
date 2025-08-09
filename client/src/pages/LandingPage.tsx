import React from 'react';

export default function LandingPage() {
  const heroImagePath = "/hero-image-new.png";
  
  return (
    <div className="w-full min-h-screen">
      {/* Hero section with responsive full image display */}
      <section className="hero-mobile-optimized">
        {/* Responsive background image with auto-resize functionality */}
        <img 
          src={heroImagePath} 
          alt="Spend more time enjoying life - Dedw3n"
          className="absolute inset-0 w-full h-full"
          loading="eager"
          decoding="async"
        />
      </section>
    </div>
  );
}