import React, { useEffect, useState } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Menu, X, Globe, DollarSign } from 'lucide-react';
import { LanguageSelector } from '@/components/lang/LanguageSelector';
import { CurrencySelector } from '@/components/lang/CurrencySelector';

export default function MobileLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <SEOHead 
        title="Dedw3n Mobile - Spend More Time Enjoying Life"
        description="Mobile access to Dedw3n's social marketplace platform. Discover, connect, and shop with an optimized mobile experience."
        keywords="Dedw3n mobile, mobile marketplace, social commerce, mobile shopping, mobile platform"
      />
      
      {/* Full Screen Background Image Layout */}
      <div 
        className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat flex flex-col"
        style={{
          backgroundImage: `url('/attached_assets/spend more time enjoying life (395 x 932 px)_1754773395025.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Mobile Header */}
        <div className="relative z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dedw3n</h1>
              <span className="ml-2 text-xs text-orange-600 font-medium">Under Maintenance</span>
            </div>

            {/* Login/Register and Menu */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600">تسجيل</span>
              <Button size="sm" variant="outline" className="text-xs px-3 py-1">
                تسجيل دخول
              </Button>
              <Button 
                size="sm"
                variant="ghost"
                onClick={toggleMenu}
                className="p-2 hover:bg-gray-100"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Slide-down Menu */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm">
              <div className="px-4 py-3 space-y-3">
                {/* Language Selector */}
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">Language:</span>
                  <div className="flex-1">
                    <LanguageSelector />
                  </div>
                </div>

                {/* Currency Selector */}
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">Currency:</span>
                  <div className="flex-1">
                    <CurrencySelector />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content positioned over background */}
        <div className="relative z-10 flex-1 flex flex-col justify-between px-4 py-8">
          {/* Top Section spacing for header */}
          <div className="flex-shrink-0">
            {/* Header space handled above */}
          </div>

          {/* Middle Section - Main content area */}
          <div className="flex-1 flex items-center justify-center">
            {/* Main background image takes up the space */}
          </div>

          {/* Bottom Section - Pure Background Image */}
          <div className="flex-shrink-0">
            {/* No buttons or UI elements - pure background image experience */}
          </div>
        </div>
      </div>
    </>
  );
}