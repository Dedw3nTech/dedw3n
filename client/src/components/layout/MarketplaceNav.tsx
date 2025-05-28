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

      {/* Image Upload Card */}
      <div className="container mx-auto px-4 mt-6">
        <div className="max-w-md mx-auto">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">Upload Picture</p>
            <p className="text-sm text-gray-500">Click to browse or drag and drop your image here</p>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              id="image-upload"
            />
          </div>
        </div>
      </div>

    </div>
  );
}