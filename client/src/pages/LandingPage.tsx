import React from 'react';
import newHeroImage from "@assets/spend more time enjoying life (Website) (3)_1756242887808.png";

export default function LandingPage() {
  const heroImagePath = newHeroImage;
  
  return (
    <div className="w-full min-h-[calc(150vh-300px)] overflow-hidden">
      {/* Hero section with full image display that fills available space between header and footer */}
      <section className="relative w-full h-full min-h-[calc(150vh-300px)]">
        {/* Full image container that fills available space with no white spaces */}
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={heroImagePath} 
            alt="Spend more time enjoying life - Dedw3n"
            className="w-full h-full object-cover"
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