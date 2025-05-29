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
        } else {
          // Create sample data structure for demonstration
          setProducts([
            { id: 1, name: "Wireless Headphones", price: 199.99, priceChange: 15.50, changePercent: 8.4 },
            { id: 2, name: "Smart Watch Pro", price: 349.99, priceChange: -25.00, changePercent: -6.7 },
            { id: 3, name: "Gaming Laptop", price: 1299.99, priceChange: 89.99, changePercent: 7.4 },
            { id: 4, name: "Bluetooth Speaker", price: 79.99, priceChange: -5.00, changePercent: -5.9 },
            { id: 5, name: "4K Webcam", price: 159.99, priceChange: 12.00, changePercent: 8.1 },
            { id: 6, name: "Ergonomic Mouse", price: 49.99, priceChange: 3.50, changePercent: 7.5 },
            { id: 7, name: "USB-C Hub", price: 89.99, priceChange: -7.50, changePercent: -7.7 },
            { id: 8, name: "Wireless Charger", price: 39.99, priceChange: 2.99, changePercent: 8.1 },
          ]);
        }
      } catch (error) {
        console.error('Error fetching trending products:', error);
        // Use fallback data on error
        setProducts([
          { id: 1, name: "Wireless Headphones", price: 199.99, priceChange: 15.50, changePercent: 8.4 },
          { id: 2, name: "Smart Watch Pro", price: 349.99, priceChange: -25.00, changePercent: -6.7 },
          { id: 3, name: "Gaming Laptop", price: 1299.99, priceChange: 89.99, changePercent: 7.4 },
          { id: 4, name: "Bluetooth Speaker", price: 79.99, priceChange: -5.00, changePercent: -5.9 },
        ]);
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