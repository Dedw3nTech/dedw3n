import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendingProduct {
  id: number;
  name: string;
  price: number;
  priceChange: number;
  changePercent: number;
}

export function TrendingProductsToolbar() {
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        const response = await fetch('/api/products/trending');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching trending products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, []);

  if (loading) {
    return (
      <div className="bg-black text-white p-2 mb-4 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Only show the toolbar if there are products to display
  if (products.length === 0) {
    return null;
  }

  // Duplicate products for seamless scrolling
  const scrollingProducts = [...products, ...products];

  return (
    <div className="bg-black text-white p-2 mb-4 rounded-lg overflow-hidden relative">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-semibold text-green-400">LIVE MARKET</span>
      </div>
      
      <div className="relative overflow-hidden">
        <div className="flex animate-scroll-left whitespace-nowrap">
          {scrollingProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="flex items-center gap-2 mr-8 flex-shrink-0"
            >
              <span className="text-sm font-medium text-white truncate max-w-32">
                {product.name}
              </span>
              
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-white">
                  ${product.price.toFixed(2)}
                </span>
                
                <div className={`flex items-center gap-1 ${
                  product.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {product.priceChange >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="text-xs font-medium">
                    {product.priceChange >= 0 ? '+' : ''}
                    {product.changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}