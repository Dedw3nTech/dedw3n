import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Types for analytics data
export interface ProductForecast {
  productId: number;
  productName: string;
  predictedSales: number;
  predictedRevenue: number;
  confidenceLevel: number;
  recommendedInventory: number;
  recommendedPrice: number;
  forecastDate: string;
}

export interface MarketTrend {
  category: string;
  trendDirection: 'up' | 'down' | 'stable';
  growthRate: number;
  marketDemand: number;
  competitorCount: number;
  averagePrice: number;
  searchVolume: number;
  recommendedActions: string[];
  period: string;
}

export interface ConversionRate {
  date: string;
  totalViews: number;
  cartAdds: number;
  checkouts: number;
  purchases: number;
  totalValue: number;
  conversionRate: number;
  checkoutRate: number;
}

export interface SessionAnalytics {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  totalSessions: number;
  avgDuration: number;
  conversions: number;
  totalValue: number;
  bounceRate: number;
  conversionRate: number;
  avgDurationMinutes: number;
}

export interface Demographics {
  ageGroup: string;
  gender: 'male' | 'female' | 'other' | null;
  country: string;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  lifetimeValue: number;
}

export interface CompetitorAnalysis {
  competitorId: number;
  competitorName: string;
  category: string;
  averagePrice: number;
  totalProducts: number;
  monthlyRevenue: number;
  marketShare: number;
  rating: number;
  reviewCount: number;
}

export interface FinancialSummary {
  period: string;
  startDate: string;
  endDate: string;
  grossRevenue: number;
  netRevenue: number;
  totalCosts: number;
  platformFees: number;
  shippingCosts: number;
  marketingCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  averageOrderValue: number;
  totalOrders: number;
  totalRefunds: number;
  refundRate: number;
}

export interface ProfitBreakdown {
  productId: number;
  productName: string;
  totalSales: number;
  grossRevenue: number;
  productCost: number;
  grossProfit: number;
  profitMargin: number;
}

export interface OrdersReturns {
  productId: number;
  productName: string;
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  returnRate: number;
  cancellationRate: number;
}

export interface CrossSellData {
  product_a_id: number;
  product_a_name: string;
  product_b_id: number;
  product_b_name: string;
  frequency: number;
}

export interface InventoryData {
  date: string;
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  currentStock: number;
}

export interface AnalyticsDashboard {
  productForecasts: ProductForecast[];
  marketTrends: MarketTrend[];
  conversionRates: ConversionRate[];
  sessionAnalytics: SessionAnalytics[];
  demographics: Demographics[];
  competitorAnalysis: CompetitorAnalysis[];
  financialSummary: FinancialSummary[];
  profitBreakdown: ProfitBreakdown[];
  ordersAndReturns: OrdersReturns[];
  crossSellAnalytics: CrossSellData[];
  inventoryAnalytics: InventoryData[];
}

// Custom hooks for individual analytics sections
export const useProductForecasts = (period: 'monthly' | 'quarterly' | 'yearly' = 'monthly') => {
  return useQuery<ProductForecast[]>({
    queryKey: ['/api/vendor/analytics/forecasts', period],
    queryFn: () => apiRequest('GET', `/api/vendor/analytics/forecasts?period=${period}`).then(res => res.json()),
  });
};

export const useMarketTrends = (period: 'weekly' | 'monthly' | 'quarterly' = 'monthly') => {
  return useQuery<MarketTrend[]>({
    queryKey: ['/api/vendor/analytics/market-trends', period],
    queryFn: () => apiRequest('GET', `/api/vendor/analytics/market-trends?period=${period}`).then(res => res.json()),
  });
};

export const useConversionRates = (days: number = 30) => {
  return useQuery<ConversionRate[]>({
    queryKey: ['/api/vendor/analytics/conversions', days],
    queryFn: () => apiRequest('GET', `/api/vendor/analytics/conversions?days=${days}`).then(res => res.json()),
  });
};

export const useDemographics = (period: 'monthly' | 'quarterly' = 'monthly') => {
  return useQuery<Demographics[]>({
    queryKey: ['/api/vendor/analytics/demographics', period],
    queryFn: () => apiRequest('GET', `/api/vendor/analytics/demographics?period=${period}`).then(res => res.json()),
  });
};

export const useCompetitorAnalysis = () => {
  return useQuery<CompetitorAnalysis[]>({
    queryKey: ['/api/vendor/analytics/competitors'],
    queryFn: () => apiRequest('GET', '/api/vendor/analytics/competitors').then(res => res.json()),
  });
};

export const useFinancialSummary = (period: 'weekly' | 'monthly' = 'monthly') => {
  return useQuery<FinancialSummary[]>({
    queryKey: ['/api/vendor/analytics/financial', period],
    queryFn: () => apiRequest('GET', `/api/vendor/analytics/financial?period=${period}`).then(res => res.json()),
  });
};

// Comprehensive dashboard hook
export const useAnalyticsDashboard = (days: number = 30, period: 'weekly' | 'monthly' = 'monthly') => {
  return useQuery<AnalyticsDashboard>({
    queryKey: ['/api/vendor/analytics/dashboard', days, period],
    queryFn: () => apiRequest('GET', `/api/vendor/analytics/dashboard?days=${days}&period=${period}`).then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

// Generate sample data hook
export const useGenerateSampleData = () => {
  return useQuery({
    queryKey: ['/api/vendor/analytics/generate-sample'],
    queryFn: () => apiRequest('POST', '/api/vendor/analytics/generate-sample').then(res => res.json()),
    enabled: false, // Only run when manually triggered
  });
};