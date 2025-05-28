import { useLocation } from 'wouter';
import { useMarketType } from '@/hooks/use-market-type';
import { Button } from '@/components/ui/button';
import { Users, Store, Building, Landmark } from 'lucide-react';

export function MarketplaceNav() {
  const [, setLocation] = useLocation();
  const { marketType, setMarketType } = useMarketType();

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
          <div 
            className="cursor-pointer group transition-all duration-300"
            onClick={() => {
              setMarketType("c2c");
              setLocation("/products");
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className={`text-lg font-medium transition-colors duration-300 ${
                marketType === 'c2c' 
                  ? 'text-blue-600' 
                  : 'text-gray-700 group-hover:text-blue-600'
              }`}>
                Buy from a friend (C2C)
              </span>
            </div>
            <div className={`h-0.5 transition-all duration-300 ${
              marketType === 'c2c' 
                ? 'bg-blue-600 w-full' 
                : 'bg-transparent w-0 group-hover:w-full group-hover:bg-blue-600'
            }`} />
          </div>
          
          <div 
            className="cursor-pointer group transition-all duration-300"
            onClick={() => {
              setMarketType("b2c");
              setLocation("/products");
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-5 w-5 text-green-600" />
              <span className={`text-lg font-medium transition-colors duration-300 ${
                marketType === 'b2c' 
                  ? 'text-green-600' 
                  : 'text-gray-700 group-hover:text-green-600'
              }`}>
                Buy from a store (B2C)
              </span>
            </div>
            <div className={`h-0.5 transition-all duration-300 ${
              marketType === 'b2c' 
                ? 'bg-green-600 w-full' 
                : 'bg-transparent w-0 group-hover:w-full group-hover:bg-green-600'
            }`} />
          </div>
          
          <div 
            className="cursor-pointer group transition-all duration-300"
            onClick={() => {
              setMarketType("b2b");
              setLocation("/products");
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-5 w-5 text-purple-600" />
              <span className={`text-lg font-medium transition-colors duration-300 ${
                marketType === 'b2b' 
                  ? 'text-purple-600' 
                  : 'text-gray-700 group-hover:text-purple-600'
              }`}>
                Business (B2B)
              </span>
            </div>
            <div className={`h-0.5 transition-all duration-300 ${
              marketType === 'b2b' 
                ? 'bg-purple-600 w-full' 
                : 'bg-transparent w-0 group-hover:w-full group-hover:bg-purple-600'
            }`} />
          </div>
          
          <div 
            className="cursor-pointer group transition-all duration-300"
            onClick={() => {
              setMarketType("gov");
              setLocation("/government");
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="h-5 w-5 text-amber-600" />
              <span className={`text-lg font-medium transition-colors duration-300 ${
                marketType === 'gov' 
                  ? 'text-amber-600' 
                  : 'text-gray-700 group-hover:text-amber-600'
              }`}>
                Governmental Services
              </span>
            </div>
            <div className={`h-0.5 transition-all duration-300 ${
              marketType === 'gov' 
                ? 'bg-amber-600 w-full' 
                : 'bg-transparent w-0 group-hover:w-full group-hover:bg-amber-600'
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}