import { useLocation } from 'wouter';
import { useMarketType } from '@/hooks/use-market-type';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShoppingBag, Wallet, Heart } from 'lucide-react';

interface MarketplaceNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function MarketplaceNav({ searchTerm = '', setSearchTerm }: MarketplaceNavProps = {}) {
  const [, setLocation] = useLocation();
  const { marketType, setMarketType } = useMarketType();

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          {/* Compact Market Type Selector */}
          <div className="flex items-center bg-gray-50 rounded-lg p-1 gap-1">
            <button
              onClick={() => {
                setMarketType("c2c");
                setLocation("/products");
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                marketType === 'c2c'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black hover:bg-white/50'
              }`}
            >
              C2C
            </button>
            <button
              onClick={() => {
                setMarketType("b2c");
                setLocation("/products");
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                marketType === 'b2c'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black hover:bg-white/50'
              }`}
            >
              B2C
            </button>
            <button
              onClick={() => {
                setMarketType("b2b");
                setLocation("/products");
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                marketType === 'b2b'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black hover:bg-white/50'
              }`}
            >
              B2B
            </button>
          </div>
            
          {/* Search bar */}
          {setSearchTerm && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          )}
          
          {/* Right corner buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/liked")}
            >
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">Liked</span>
            </Button>
            
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



    </div>
  );
}