import { useLocation } from 'wouter';
import { useMarketType } from '@/hooks/use-market-type';

// Import promotional images
import luxuryB2CImage from '@assets/Dedw3n Marketplace (1).png';
import bottomPromoImage from '@assets/Copy of Dedw3n Marketplace.png';

export default function B2CLandingPage() {
  const [, setLocation] = useLocation();
  const { setMarketType } = useMarketType();

  const handleShopNow = () => {
    setMarketType('b2c');
    setLocation('/products');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full">
          <img 
            src={luxuryB2CImage}
            alt="Dedwen B2C Marketplace"
            className="w-full h-[500px] object-cover cursor-pointer"
            onClick={handleShopNow}
          />
        </div>
      </section>

      {/* Bottom Section */}
      <section className="relative">
        <div className="w-full">
          <img 
            src={bottomPromoImage}
            alt="Dedwen B2C Marketplace"
            className="w-full h-[350px] object-cover cursor-pointer"
            onClick={handleShopNow}
          />
        </div>
      </section>
    </div>
  );
}