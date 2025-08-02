import React from 'react';
import spendMoreTimeImage from "@assets/spend more time enjoying life (Website)_1754111670996.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Full-screen image section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <img 
          src={spendMoreTimeImage}
          alt="Spend more time enjoying life - Dedw3n"
          className="w-full h-screen object-cover"
        />
      </section>
    </div>
  );
}