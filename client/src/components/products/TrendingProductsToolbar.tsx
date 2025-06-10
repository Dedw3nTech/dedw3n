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

  // Show placeholder when no products are available
  if (products.length === 0) {
    return (
      <div className="w-full bg-white text-black p-3 mb-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-sm font-semibold text-black">Trending Products</span>
        </div>
        <div className="text-xs text-gray-500">
          No trending products available
        </div>
      </div>
    );
  }

  // Duplicate products for seamless scrolling
  const scrollingProducts = [...products, ...products];

  return null;
}