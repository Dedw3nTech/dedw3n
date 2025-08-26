import React, { useEffect, useState } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Globe, Store, MessageCircle, Heart, ArrowRight } from 'lucide-react';
import { setDesktopPreference } from '@/lib/mobile-detection';
import { Link } from 'wouter';

export default function MobileLanding() {
  const [showDesktopOption, setShowDesktopOption] = useState(false);

  useEffect(() => {
    // Show desktop option after 3 seconds
    const timer = setTimeout(() => {
      setShowDesktopOption(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleViewDesktop = () => {
    // Set preference to force desktop version
    setDesktopPreference(true);
    
    // Redirect to main desktop site
    window.location.href = '/';
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
        {/* Optional overlay for better readability */}
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Content positioned over background */}
        <div className="relative z-10 flex-1 flex flex-col justify-between px-4 py-8">
          {/* Top Section - Logo/Header area if needed */}
          <div className="flex-shrink-0">
            {/* Space for future header content */}
          </div>

          {/* Middle Section - Main content area */}
          <div className="flex-1 flex items-center justify-center">
            {/* Main background image takes up the space */}
          </div>

          {/* Bottom Section - Navigation */}
          <div className="flex-shrink-0">
            <div className="max-w-sm mx-auto">
              {/* Quick Access Navigation Cards - positioned at bottom */}
              <div className="space-y-3 mb-6">
                <Link href="/marketplace">
                  <Card className="text-left bg-white/90 backdrop-blur-sm hover:bg-white/95 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <Store className="h-8 w-8 text-blue-600 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-sm">Marketplace</h3>
                        <p className="text-xs text-gray-600">Shop from global vendors</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/community">
                  <Card className="text-left bg-white/90 backdrop-blur-sm hover:bg-white/95 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <MessageCircle className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-sm">Community</h3>
                        <p className="text-xs text-gray-600">Connect with like-minded people</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dating">
                  <Card className="text-left bg-white/90 backdrop-blur-sm hover:bg-white/95 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <Heart className="h-8 w-8 text-red-600 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-sm">Dating</h3>
                        <p className="text-xs text-gray-600">Find meaningful connections</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Call to Action Buttons */}
              <div className="space-y-3 mb-4">
                <Link href="/auth">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Desktop Option */}
              {showDesktopOption && (
                <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg">
                  <Button 
                    onClick={handleViewDesktop}
                    variant="ghost" 
                    size="sm"
                    className="w-full text-blue-600 hover:bg-blue-50"
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    Switch to Desktop Version
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}