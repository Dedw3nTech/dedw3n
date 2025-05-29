import { useLocation } from 'wouter';
import { useMarketType } from '@/hooks/use-market-type';
import { Button } from '@/components/ui/button';

export default function B2CLandingPage() {
  const [, setLocation] = useLocation();
  const { setMarketType } = useMarketType();

  const handleShopNow = () => {
    setMarketType('b2c');
    setLocation('/marketplace');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Welcome to Dedwen B2C Marketplace
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Discover premium products and connect with businesses worldwide
          </p>
          <Button 
            onClick={handleShopNow}
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
          >
            Start Shopping
          </Button>
        </div>
      </section>
    </div>
  );
}