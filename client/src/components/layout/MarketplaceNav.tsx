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
        </div>
      </div>
    </div>
  );
}