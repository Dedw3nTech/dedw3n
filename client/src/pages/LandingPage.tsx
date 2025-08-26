import React from 'react';
import newHeroImage from "@assets/spend more time enjoying life (Website) (3)_1756242887808.png";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

export default function LandingPage() {
  const heroImagePath = newHeroImage;
  
  // Hero text translations
  const heroTexts = [
    "Spend more time enjoying life.",
    "Together for a prosperous and green planet"
  ];

  // Use Master Translation System
  const { translations: translatedTexts, isLoading: isTranslating } = useMasterBatchTranslation(heroTexts);
  
  // Create translation function
  const t = (text: string) => {
    const index = heroTexts.indexOf(text);
    return index >= 0 && translatedTexts ? translatedTexts[index] || text : text;
  };
  
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
        
        {/* Hero text overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingTop: '20vh' }}>
          <div className="text-center px-4 max-w-6xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
              {t("Spend more time enjoying life.") || "Spend more time enjoying life."}
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white mb-6 drop-shadow-lg">
              {t("Together for a prosperous and green planet") || "Together for a prosperous and green planet"}
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
}