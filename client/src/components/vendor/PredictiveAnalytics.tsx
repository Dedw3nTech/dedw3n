import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  TrendingUp,
  Target,
  AlertTriangle,
  BarChart3,
  Users,
  DollarSign,
  Package,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  Lightbulb,
  Zap,
  Activity,
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PredictiveAnalyticsProps {
  vendorId: number;
}

interface PredictiveInsights {
  salesForecast: {
    nextMonth: {
      predictedRevenue: number;
      confidenceLevel: number;
      trend: string;
      factors: string[];
    };
    nextQuarter: {
      predictedRevenue: number;
      confidenceLevel: number;
      trend: string;
      growthRate: number;
    };
  };
  customerInsights: {
    churnPrediction: {
      highRiskCustomers: number;
      totalCustomers: number;
      churnRate: number;
      retentionStrategies: string[];
    };
    lifetimeValuePrediction: {
      avgPredictedLTV: number;
      highValueCustomers: number;
      growthPotential: string;
    };
  };
  productInsights: {
    demandForecast: any;
    seasonalTrends: any;
    recommendedActions: string[];
  };
  marketTrends: {
    competitiveAnalysis: {
      marketPosition: string;
      competitiveAdvantage: string[];
      threatLevel: string;
    };
    opportunityScore: number;
    recommendedInvestments: string[];
  };
}

interface MLRecommendations {
  customerSegmentation: {
    algorithm: string;
    segments: Array<{
      name: string;
      size: number;
      characteristics: string[];
      recommendedActions: string[];
    }>;
  };
  priceOptimization: {
    algorithm: string;
    recommendations: Array<{
      productCategory: string;
      suggestedPriceChange: string;
      expectedImpact: string;
      confidence: number;
    }>;
    optimalPricingStrategy: string;
  };
  inventoryOptimization: {
    algorithm: string;
    stockRecommendations: Array<{
      productId: number;
      currentStock: number;
      recommendedStock: number;
      reason: string;
      timeframe: string;
    }>;
    reorderAlerts: Array<{
      productId: number;
      alertLevel: string;
      daysUntilStockout: number;
      recommendedReorderQuantity: number;
    }>;
  };
  marketingOptimization: {
    algorithm: string;
    channelEffectiveness: Array<{
      channel: string;
      roi: number;
      attribution: number;
      recommendation: string;
    }>;
    personalizedCampaigns: {
      targetSegments: string[];
      expectedLift: number;
      confidence: number;
    };
  };
}

interface TrendAnalysis {
  salesTrends: {
    overall: {
      direction: string;
      growth_rate: number;
      volatility: string;
      seasonality: string;
    };
    monthly: Array<{
      month: string;
      revenue: number;
      orders: number;
      growth: number;
    }>;
    weekly: Array<{
      day: string;
      avgOrders: number;
      peakHour: number;
    }>;
    daily: Array<{
      hour: number;
      avgOrders: number;
      conversionRate: number;
    }>;
  };
  customerTrends: {
    acquisition: {
      rate: string;
      cost_per_acquisition: number;
      conversion_rate: number;
      quality_score: string;
    };
    retention: {
      rate: number;
      trend: string;
      cohort_analysis: any;
    };
    satisfaction: {
      nps_score: number;
      trend: string;
      feedback_sentiment: string;
    };
  };
  productTrends: {
    category_performance: Array<{
      category: string;
      growth: number;
      trend: string;
      market_share: number;
    }>;
    emerging_categories: string[];
    declining_categories: string[];
  };
  marketTrends: {
    industry_growth: number;
    competitive_landscape: string;
    technological_adoption: string;
    consumer_behavior_shifts: string[];
  };
  predictive_indicators: {
    leading_indicators: string[];
    lagging_indicators: string[];
    early_warning_signals: string[];
  };
}

export default function PredictiveAnalytics({ vendorId }: PredictiveAnalyticsProps) {
  const { formatPriceFromGBP } = useCurrency();
  const [activeTab, setActiveTab] = useState('insights');

  // Fetch predictive insights
  const { data: predictiveInsights, isLoading: isLoadingInsights } = useQuery<PredictiveInsights>({
    queryKey: [`/api/vendors/${vendorId}/analytics/predictive-insights`],
    enabled: !!vendorId,
  });

  // Fetch ML recommendations
  const { data: mlRecommendations, isLoading: isLoadingML } = useQuery<MLRecommendations>({
    queryKey: [`/api/vendors/${vendorId}/analytics/ml-recommendations`],
    enabled: !!vendorId && activeTab === 'ml-recommendations',
  });

  // Fetch trend analysis
  const { data: trendAnalysis, isLoading: isLoadingTrends } = useQuery<TrendAnalysis>({
    queryKey: [`/api/vendors/${vendorId}/analytics/trend-analysis`],
    enabled: !!vendorId && activeTab === 'trend-analysis',
  });

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'increasing':
      case 'upward':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
      case 'downward':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatStrategy = (strategy: string) => {
    return strategy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Predictive Analytics & AI Insights</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
          <TabsTrigger value="ml-recommendations">ML Recommendations</TabsTrigger>
          <TabsTrigger value="trend-analysis">Trend Analysis</TabsTrigger>
        </TabsList>

        {/* Predictive Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {isLoadingInsights ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sales Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Sales Forecast</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Next Month Prediction</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">
                          {formatPriceFromGBP(predictiveInsights?.salesForecast?.nextMonth?.predictedRevenue || 0)}
                        </span>
                        {getTrendIcon(predictiveInsights?.salesForecast?.nextMonth?.trend || 'stable')}
                      </div>
                      <div className={`text-sm ${getConfidenceColor(predictiveInsights?.salesForecast?.nextMonth?.confidenceLevel || 0)}`}>
                        {predictiveInsights?.salesForecast?.nextMonth?.confidenceLevel}% confidence
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Factors: {predictiveInsights?.salesForecast?.nextMonth?.factors?.join(', ')}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Next Quarter Prediction</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">
                          {formatPriceFromGBP(predictiveInsights?.salesForecast?.nextQuarter?.predictedRevenue || 0)}
                        </span>
                        {getTrendIcon(predictiveInsights?.salesForecast?.nextQuarter?.trend || 'stable')}
                      </div>
                      <div className={`text-sm ${getConfidenceColor(predictiveInsights?.salesForecast?.nextQuarter?.confidenceLevel || 0)}`}>
                        {predictiveInsights?.salesForecast?.nextQuarter?.confidenceLevel}% confidence
                      </div>
                      <div className="text-xs text-green-600">
                        +{predictiveInsights?.salesForecast?.nextQuarter?.growthRate}% growth rate
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Churn Prediction</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>High Risk Customers</span>
                      <Badge variant="destructive">
                        {predictiveInsights?.customerInsights?.churnPrediction?.highRiskCustomers || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Predicted Churn Rate</span>
                      <span className="text-red-600 font-medium">
                        {predictiveInsights?.customerInsights?.churnPrediction?.churnRate}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Retention Strategies</h5>
                      <div className="flex flex-wrap gap-1">
                        {predictiveInsights?.customerInsights?.churnPrediction?.retentionStrategies?.map((strategy, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {formatStrategy(strategy)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Lifetime Value Prediction</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Avg Predicted LTV</span>
                      <span className="text-2xl font-bold">
                        {formatPriceFromGBP(predictiveInsights?.customerInsights?.lifetimeValuePrediction?.avgPredictedLTV || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>High Value Customers</span>
                      <Badge variant="secondary">
                        {predictiveInsights?.customerInsights?.lifetimeValuePrediction?.highValueCustomers || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Growth Potential</span>
                      <Badge className="bg-green-100 text-green-800">
                        {predictiveInsights?.customerInsights?.lifetimeValuePrediction?.growthPotential || 'Unknown'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Market Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Market Intelligence</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h5 className="font-medium">Market Position</h5>
                      <Badge className="bg-blue-100 text-blue-800">
                        {predictiveInsights?.marketTrends?.competitiveAnalysis?.marketPosition || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium">Opportunity Score</h5>
                      <div className="text-2xl font-bold text-green-600">
                        {predictiveInsights?.marketTrends?.opportunityScore || 0}/100
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium">Threat Level</h5>
                      <Badge variant={predictiveInsights?.marketTrends?.competitiveAnalysis?.threatLevel === 'low' ? 'default' : 'destructive'}>
                        {predictiveInsights?.marketTrends?.competitiveAnalysis?.threatLevel || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ML Recommendations Tab */}
        <TabsContent value="ml-recommendations" className="space-y-6">
          {isLoadingML ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer Segmentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>AI Customer Segmentation</span>
                    <Badge variant="outline" className="text-xs">
                      {mlRecommendations?.customerSegmentation?.algorithm}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mlRecommendations?.customerSegmentation?.segments?.map((segment, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex justify-between">
                            {segment.name}
                            <Badge>{segment.size} customers</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <h6 className="text-sm font-medium mb-1">Characteristics</h6>
                            <div className="flex flex-wrap gap-1">
                              {segment.characteristics?.map((char, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {formatStrategy(char)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h6 className="text-sm font-medium mb-1">Recommended Actions</h6>
                            <div className="flex flex-wrap gap-1">
                              {segment.recommendedActions?.map((action, i) => (
                                <Badge key={i} className="bg-green-100 text-green-800 text-xs">
                                  {formatStrategy(action)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Price Optimization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Dynamic Price Optimization</span>
                    <Badge variant="outline" className="text-xs">
                      {mlRecommendations?.priceOptimization?.algorithm}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Suggested Change</TableHead>
                        <TableHead>Expected Impact</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mlRecommendations?.priceOptimization?.recommendations?.map((rec, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{rec.productCategory}</TableCell>
                          <TableCell>
                            <Badge variant={rec.suggestedPriceChange.startsWith('+') ? 'default' : 'secondary'}>
                              {rec.suggestedPriceChange}
                            </Badge>
                          </TableCell>
                          <TableCell>{rec.expectedImpact}</TableCell>
                          <TableCell>
                            <span className={getConfidenceColor(rec.confidence)}>
                              {rec.confidence}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Inventory Optimization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Smart Inventory Management</span>
                    <Badge variant="outline" className="text-xs">
                      {mlRecommendations?.inventoryOptimization?.algorithm}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-3">Stock Recommendations</h5>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product ID</TableHead>
                          <TableHead>Current Stock</TableHead>
                          <TableHead>Recommended</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Timeframe</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mlRecommendations?.inventoryOptimization?.stockRecommendations?.map((rec, index) => (
                          <TableRow key={index}>
                            <TableCell>#{rec.productId}</TableCell>
                            <TableCell>{rec.currentStock}</TableCell>
                            <TableCell className="font-medium">{rec.recommendedStock}</TableCell>
                            <TableCell>{formatStrategy(rec.reason)}</TableCell>
                            <TableCell>{formatStrategy(rec.timeframe)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h5 className="font-medium mb-3">Urgent Reorder Alerts</h5>
                    <div className="space-y-2">
                      {mlRecommendations?.inventoryOptimization?.reorderAlerts?.map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span>Product #{alert.productId}</span>
                            <Badge variant="destructive">{alert.alertLevel}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{alert.daysUntilStockout} days until stockout</div>
                            <div className="text-xs text-muted-foreground">
                              Reorder: {alert.recommendedReorderQuantity} units
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Trend Analysis Tab */}
        <TabsContent value="trend-analysis" className="space-y-6">
          {isLoadingTrends ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Overall Business Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        {getTrendIcon(trendAnalysis?.salesTrends?.overall?.direction || 'stable')}
                        <span className="font-medium">{trendAnalysis?.salesTrends?.overall?.direction}</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        +{trendAnalysis?.salesTrends?.overall?.growth_rate}%
                      </div>
                      <div className="text-xs text-muted-foreground">Growth Rate</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Volatility</div>
                      <Badge variant="outline">
                        {trendAnalysis?.salesTrends?.overall?.volatility}
                      </Badge>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Seasonality</div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {trendAnalysis?.salesTrends?.overall?.seasonality}
                      </Badge>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Industry Growth</div>
                      <div className="text-lg font-bold">+{trendAnalysis?.marketTrends?.industry_growth}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Customer Acquisition & Retention</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h5 className="font-medium">Acquisition Metrics</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Cost per Acquisition</span>
                          <span className="font-medium">
                            {formatPriceFromGBP(trendAnalysis?.customerTrends?.acquisition?.cost_per_acquisition || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Conversion Rate</span>
                          <span className="font-medium">{trendAnalysis?.customerTrends?.acquisition?.conversion_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Quality Score</span>
                          <Badge className="bg-green-100 text-green-800">
                            {trendAnalysis?.customerTrends?.acquisition?.quality_score}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h5 className="font-medium">Retention Analysis</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Retention Rate</span>
                          <span className="font-medium text-green-600">{trendAnalysis?.customerTrends?.retention?.rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Trend</span>
                          <Badge variant="outline">{trendAnalysis?.customerTrends?.retention?.trend}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h5 className="font-medium">Satisfaction Metrics</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">NPS Score</span>
                          <span className="font-medium text-blue-600">{trendAnalysis?.customerTrends?.satisfaction?.nps_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Sentiment</span>
                          <Badge className="bg-green-100 text-green-800">
                            {trendAnalysis?.customerTrends?.satisfaction?.feedback_sentiment}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Predictive Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5" />
                    <span>Predictive Indicators</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h5 className="font-medium mb-3 text-green-600">Leading Indicators</h5>
                      <div className="space-y-1">
                        {trendAnalysis?.predictive_indicators?.leading_indicators?.map((indicator, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <Zap className="h-3 w-3 text-green-500" />
                            <span>{formatStrategy(indicator)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-3 text-blue-600">Lagging Indicators</h5>
                      <div className="space-y-1">
                        {trendAnalysis?.predictive_indicators?.lagging_indicators?.map((indicator, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <BarChart3 className="h-3 w-3 text-blue-500" />
                            <span>{formatStrategy(indicator)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-3 text-orange-600">Early Warning Signals</h5>
                      <div className="space-y-1">
                        {trendAnalysis?.predictive_indicators?.early_warning_signals?.map((signal, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span>{formatStrategy(signal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}