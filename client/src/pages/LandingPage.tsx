import React from 'react';
import spendMoreTimeImage from "@assets/spend more time enjoying life (Website)_1754111670996.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Full-screen image section - cropped to show only middle section */}
      <section className="relative min-h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${spendMoreTimeImage})`,
            backgroundPosition: 'center 35%', // Focus on the middle section with the woman
            backgroundSize: 'cover',
            transform: 'scale(1.2)', // Zoom in to remove text overlays
            filter: 'none'
          }}
        />
      </section>
    </div>
  );
}