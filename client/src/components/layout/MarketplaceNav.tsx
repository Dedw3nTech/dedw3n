import { useLocation } from 'wouter';
import { useMarketType } from '@/hooks/use-market-type';
import { Button } from '@/components/ui/button';
import { Users, Store, Building, Landmark } from 'lucide-react';

export function MarketplaceNav() {
  const [, setLocation] = useLocation();
  const { marketType, setMarketType } = useMarketType();

  return (
    <div className="bg-gray-50 border-b border-gray-200 py-3">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            variant={marketType === 'c2c' ? 'default' : 'outline'} 
            className={`flex items-center justify-center ${marketType === 'c2c' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
            onClick={() => {
              setMarketType("c2c");
              setLocation("/products");
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            Buy from a friend (C2C)
          </Button>
          
          <Button 
            variant={marketType === 'b2c' ? 'default' : 'outline'} 
            className={`flex items-center justify-center ${marketType === 'b2c' ? 'bg-green-500 hover:bg-green-600' : ''}`}
            onClick={() => {
              setMarketType("b2c");
              setLocation("/products");
            }}
          >
            <Store className="mr-2 h-4 w-4" />
            Buy from a store (B2C)
          </Button>
          
          <Button 
            variant={marketType === 'b2b' ? 'default' : 'outline'} 
            className={`flex items-center justify-center ${marketType === 'b2b' ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
            onClick={() => {
              setMarketType("b2b");
              setLocation("/products");
            }}
          >
            <Building className="mr-2 h-4 w-4" />
            Business (B2B)
          </Button>
          
          <Button 
            variant={marketType === 'gov' ? 'default' : 'outline'} 
            className={`flex items-center justify-center ${marketType === 'gov' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            onClick={() => {
              setMarketType("gov");
              setLocation("/government");
            }}
          >
            <Landmark className="mr-2 h-4 w-4" />
            Governmental Services
          </Button>
        </div>
      </div>
    </div>
  );
}