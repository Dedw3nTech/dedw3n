import React, { useState } from 'react';
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export default function LandingPage() {
  const [imageError, setImageError] = useState(false);
  
  // Use the new desktop hero image
  const heroImagePath = "/attached_assets/simplify spend more time enjoying life (Website)_1756530923138.png";
  
  const handleImageError = () => {
    console.error('Failed to load hero image:', heroImagePath);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('Hero image loaded successfully');
  };
  
  return (
    <div className="w-full min-h-[calc(150vh-300px)] overflow-hidden">
      {/* Hero section with full image display that fills available space between header and footer */}
      <section className="relative w-full h-full min-h-[calc(150vh-300px)]">
        {/* Full image container that fills available space with no white spaces */}
        <div className="absolute inset-0 w-full h-full">
          {!imageError ? (
            <OptimizedImage 
              src={heroImagePath} 
              alt="Dedw3n - Spend More Time Enjoying Life - Professional Business Platform"
              className="w-full h-full object-cover"
              priority={true}
              loading="eager"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto px-6">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                  Dedw3n
                </h1>
                <p className="text-xl md:text-2xl text-gray-700 mb-6">
                  Professional Business Platform
                </p>
                <p className="text-lg text-gray-600">
                  Spend more time enjoying life
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}