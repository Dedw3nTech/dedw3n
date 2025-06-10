import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Building2, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';

interface TrendingProduct {
  id: number;
  name: string;
  price: number;
  category?: string;
  vendor?: {
    name: string;
  };
  soldCount?: number;
}

const categoryIcons = {
  'Web Design': ShoppingBag,
  'Consulting': Building2,
  'Marketing': Activity,
  'Development': () => <i className="ri-code-line text-white text-lg"></i>,
  'default': ShoppingBag
};

const categoryColors = [
  'from-blue-500 to-purple-600',
  'from-green-500 to-teal-600', 
  'from-pink-500 to-red-600',
  'from-yellow-500 to-orange-600'
];

const statusLabels = ['Hot', 'Rising', 'Popular', 'New'];
const statusColors = ['text-green-600', 'text-orange-600', 'text-blue-600', 'text-purple-600'];
const statusIcons = ['ri-fire-line', 'ri-trending-up-line', 'ri-star-line', 'ri-rocket-line'];

export default function TrendingProducts() {
  const [, setLocation] = useLocation();
  
  const { data: trendingProducts, isLoading, error } = useQuery({
    queryKey: ['/api/products/trending'],
    queryFn: async () => {
      const response = await fetch('/api/products/trending?limit=4');
      if (!response.ok) {
        throw new Error('Failed to fetch trending products');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center space-x-3 p-2">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !trendingProducts || trendingProducts.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No trending products available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trendingProducts.map((product: TrendingProduct, index: number) => {
        const IconComponent = categoryIcons[product.category as keyof typeof categoryIcons] || categoryIcons.default;
        const colorClass = categoryColors[index % categoryColors.length];
        const statusLabel = statusLabels[index % statusLabels.length];
        const statusColor = statusColors[index % statusColors.length];
        const statusIcon = statusIcons[index % statusIcons.length];

        return (
          <div 
            key={product.id}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => setLocation(`/product/${product.id}`)}
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center`}>
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.vendor?.name ? `by ${product.vendor.name}` : `$${product.price.toFixed(2)}`}
              </p>
            </div>
            <div className={`flex items-center ${statusColor}`}>
              <i className={`${statusIcon} text-sm mr-1`}></i>
              <span className="text-xs">{statusLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}