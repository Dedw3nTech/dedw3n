import React from 'react';
import heroImage from "@assets/spend more time enjoying life (Website)_1754112546594.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero section with full-screen image */}
      <section className="relative min-h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundPosition: 'center center',
            backgroundSize: 'cover'
          }}
        />
      </section>
    </div>
  );
}