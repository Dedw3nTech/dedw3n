import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import ProductDetail from '@/pages/product-detail';
import type { Product } from '@shared/schema';

interface ProductRedirectHandlerProps {
  identifier: string;
}

export default function ProductRedirectHandler({ identifier }: ProductRedirectHandlerProps) {
  const [, setLocation] = useLocation();
  
  // Check if identifier is numeric (old ID format)
  const isNumeric = /^\d+$/.test(identifier);
  
  // If it's numeric, fetch the product to get the slug for redirect
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${identifier}`],
    enabled: isNumeric,
  });
  
  useEffect(() => {
    if (isNumeric && product?.slug) {
      // Redirect to slug URL
      setLocation(`/product/${product.slug}`, { replace: true });
    }
  }, [isNumeric, product?.slug, setLocation]);
  
  // Show loading for numeric URLs while fetching product data
  if (isNumeric && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // If numeric but no slug found, show 404
  if (isNumeric && product && !product.slug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-lg">Product not found</p>
        </div>
      </div>
    );
  }
  
  // If it's already a slug or redirect complete, show the product detail page
  if (!isNumeric || (isNumeric && product?.slug)) {
    return <ProductDetail />;
  }
  
  return null;
}