import { useLocation } from 'wouter';
import { useMarketType } from '@/hooks/use-market-type';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShoppingBag, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MarketplaceNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function MarketplaceNav({ searchTerm = '', setSearchTerm }: MarketplaceNavProps = {}) {
  const [, setLocation] = useLocation();
  const { marketType, setMarketType } = useMarketType();
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowBanner(false);
      } else {
        setShowBanner(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => {
                setMarketType("c2c");
                setLocation("/products");
              }}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  marketType === 'c2c' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  Buy from a friend (C2C)
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                marketType === 'c2c' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
            
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => {
                setMarketType("b2c");
                setLocation("/products");
              }}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  marketType === 'b2c' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  Buy from a store (B2C)
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                marketType === 'b2c' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
            
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => {
                setMarketType("b2b");
                setLocation("/products");
              }}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  marketType === 'b2b' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  Business (B2B)
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                marketType === 'b2b' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
            
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => {
                setMarketType("gov");
                setLocation("/government");
              }}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  marketType === 'gov' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  Governmental Services
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                marketType === 'gov' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
            
            {/* Search bar positioned next to Governmental Services */}
            {setSearchTerm && (
              <div className="relative flex-1 max-w-md ml-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            )}
          </div>
          
          {/* Right corner buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/cart")}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm font-medium">Shopping Bag</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/wallet")}
            >
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">E-wallet</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Fixed Picture Banner */}
      <div className={`w-full bg-gray-100 py-4 transition-all duration-300 ease-in-out ${showBanner ? 'opacity-100 max-h-48' : 'opacity-0 max-h-0 py-0 overflow-hidden'}`}>
        <div className="container mx-auto px-4">
          <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <svg className="mx-auto h-12 w-12 mb-2 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-lg font-medium">Picture Banner</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}