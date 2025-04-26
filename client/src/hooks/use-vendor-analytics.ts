import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Product } from '@shared/schema';

// Type definitions for analytics data
export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  canceledOrders: number;
}

export interface ProfitLoss {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
}

export interface TopProduct {
  product: Product;
  totalSold: number;
  revenue: number;
}

export interface TopBuyer {
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
  totalSpent: number;
  orderCount: number;
}

export type RevenuePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function useVendorAnalytics(vendorId: number) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Determine if the queries should be enabled
  const isEnabled = !!vendorId && !!user && !!user.isVendor;

  // Total Sales
  const {
    data: totalSalesData,
    isLoading: isLoadingTotalSales,
    error: totalSalesError
  } = useQuery<{ totalSales: number }>({
    queryKey: [`/api/vendors/${vendorId}/analytics/total-sales`],
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Order Stats
  const {
    data: orderStatsData,
    isLoading: isLoadingOrderStats,
    error: orderStatsError
  } = useQuery<OrderStats>({
    queryKey: [`/api/vendors/${vendorId}/analytics/order-stats`],
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Revenue data with period parameter
  const getRevenueData = (period: RevenuePeriod = 'monthly') => {
    return useQuery<Record<string, number>>({
      queryKey: [`/api/vendors/${vendorId}/analytics/revenue`, period],
      enabled: isEnabled,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Top Products
  const {
    data: topProductsData,
    isLoading: isLoadingTopProducts,
    error: topProductsError
  } = useQuery<TopProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/analytics/top-products`],
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Profit/Loss
  const {
    data: profitLossData,
    isLoading: isLoadingProfitLoss,
    error: profitLossError
  } = useQuery<ProfitLoss>({
    queryKey: [`/api/vendors/${vendorId}/analytics/profit-loss`],
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  
  // Top Buyers
  const {
    data: topBuyersData,
    isLoading: isLoadingTopBuyers,
    error: topBuyersError
  } = useQuery<TopBuyer[]>({
    queryKey: [`/api/vendors/${vendorId}/analytics/top-buyers`],
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Handle errors with toasts
  if (totalSalesError) {
    toast({
      title: "Error loading sales data",
      description: (totalSalesError as Error).message,
      variant: "destructive",
    });
  }

  if (orderStatsError) {
    toast({
      title: "Error loading order statistics",
      description: (orderStatsError as Error).message,
      variant: "destructive",
    });
  }

  if (topProductsError) {
    toast({
      title: "Error loading top products",
      description: (topProductsError as Error).message,
      variant: "destructive",
    });
  }

  if (profitLossError) {
    toast({
      title: "Error loading profit/loss data",
      description: (profitLossError as Error).message,
      variant: "destructive",
    });
  }
  
  if (topBuyersError) {
    toast({
      title: "Error loading top buyers data",
      description: (topBuyersError as Error).message,
      variant: "destructive",
    });
  }

  return {
    totalSales: totalSalesData?.totalSales || 0,
    orderStats: orderStatsData,
    topProducts: topProductsData || [],
    topBuyers: topBuyersData || [],
    profitLoss: profitLossData,
    getRevenueData,
    isLoading: isLoadingTotalSales || isLoadingOrderStats || isLoadingTopProducts || isLoadingProfitLoss || isLoadingTopBuyers,
  };
}