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
        description="Mobile optimized access to Dedw3n's social marketplace platform. Discover, connect, and shop with the best mobile experience."
        keywords="Dedw3n mobile, mobile marketplace, social commerce, mobile shopping, mobile platform"
      />
      
      <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white">
        {/* Hero Section */}
        <div className="px-4 py-8">
          <div className="max-w-sm mx-auto text-center">
            <div className="mb-6">
              <img 
                src="/attached_assets/spend more time enjoying life (395 x 932 px)_1754773395025.png"
                alt="Spend more time enjoying life"
                className="w-full h-auto object-contain rounded-lg shadow-lg"
                style={{ maxWidth: '395px', maxHeight: '500px' }}
                onError={(e) => {
                  console.error('Image failed to load:', e);
                  // Fallback to previous version
                  if (e.currentTarget.src.includes('_1754773395025.png')) {
                    e.currentTarget.src = '/attached_assets/spend more time enjoying life (395 x 932 px)_1754767685316.png';
                  }
                }}
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Dedw3n Mobile
            </h1>
            <p className="text-gray-600 mb-6 text-sm">
              Your gateway to the world's most innovative social marketplace platform, optimized for mobile.
            </p>

            {/* Quick Access Cards */}
            <div className="space-y-3 mb-8">
              <Card className="text-left">
                <CardContent className="p-4 flex items-center">
                  <Store className="h-8 w-8 text-blue-600 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">Marketplace</h3>
                    <p className="text-xs text-gray-600">Shop from global vendors</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </CardContent>
              </Card>

              <Card className="text-left">
                <CardContent className="p-4 flex items-center">
                  <MessageCircle className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">Community</h3>
                    <p className="text-xs text-gray-600">Connect with like-minded people</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </CardContent>
              </Card>

              <Card className="text-left">
                <CardContent className="p-4 flex items-center">
                  <Heart className="h-8 w-8 text-red-600 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">Dating</h3>
                    <p className="text-xs text-gray-600">Find meaningful connections</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
            <div className="space-y-3">
              <Link href="/auth">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>

              <Link href="/marketplace">
                <Button variant="outline" className="w-full">
                  <Globe className="mr-2 h-4 w-4" />
                  Explore Marketplace
                </Button>
              </Link>
            </div>

            {/* Desktop Option */}
            {showDesktopOption && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-3">
                  Prefer the full desktop experience?
                </p>
                <Button 
                  onClick={handleViewDesktop}
                  variant="ghost" 
                  size="sm"
                  className="text-blue-600"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Switch to Desktop Version
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="px-4 pb-8">
          <div className="max-w-sm mx-auto">
            <h2 className="text-lg font-semibold text-center mb-4 text-gray-900">
              Why Choose Dedw3n Mobile?
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 text-center">
                <CardContent className="p-0">
                  <div className="text-2xl mb-2">🚀</div>
                  <h3 className="font-medium text-xs">Fast & Smooth</h3>
                  <p className="text-xs text-gray-600 mt-1">Optimized for mobile speed</p>
                </CardContent>
              </Card>

              <Card className="p-3 text-center">
                <CardContent className="p-0">
                  <div className="text-2xl mb-2">🌍</div>
                  <h3 className="font-medium text-xs">Global Reach</h3>
                  <p className="text-xs text-gray-600 mt-1">Connect worldwide</p>
                </CardContent>
              </Card>

              <Card className="p-3 text-center">
                <CardContent className="p-0">
                  <div className="text-2xl mb-2">🔒</div>
                  <h3 className="font-medium text-xs">Secure</h3>
                  <p className="text-xs text-gray-600 mt-1">Your data is protected</p>
                </CardContent>
              </Card>

              <Card className="p-3 text-center">
                <CardContent className="p-0">
                  <div className="text-2xl mb-2">💼</div>
                  <h3 className="font-medium text-xs">Business Ready</h3>
                  <p className="text-xs text-gray-600 mt-1">B2B, B2C, C2C support</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}