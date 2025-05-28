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

      {/* Image Card Holder Section */}
      <div className="container mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Featured Category Card */}
          <div className="group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="h-32 mb-4 bg-blue-200 rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Featured Products</h3>
            <p className="text-sm text-gray-600">Discover trending items in your area</p>
          </div>

          {/* Local Deals Card */}
          <div className="group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="h-32 mb-4 bg-green-200 rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Deals</h3>
            <p className="text-sm text-gray-600">Best offers from nearby vendors</p>
          </div>

          {/* Community Favorites Card */}
          <div className="group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="h-32 mb-4 bg-purple-200 rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4.5c0-1.1.9-2 2-2s2 .9 2 2V18h4v-5c0-1.1.9-2 2-2s2 .9 2 2v5h4v-7.5c0-1.1-.9-2-2-2s-2 .9-2 2V13h-4V8.5c0-1.1-.9-2-2-2s-2 .9-2 2V13H4v5z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Picks</h3>
            <p className="text-sm text-gray-600">Top-rated by our members</p>
          </div>

          {/* New Arrivals Card */}
          <div className="group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="h-32 mb-4 bg-orange-200 rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">New Arrivals</h3>
            <p className="text-sm text-gray-600">Fresh inventory just added</p>
          </div>
        </div>
      </div>

    </div>
  );
}