import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSpendingAnalytics, TimePeriod } from '@/hooks/use-spending-analytics';
import { Redirect } from 'wouter';
import { useMasterTranslation } from '@/hooks/use-master-translation';
import { formatCurrency } from '@/lib/currencyConverter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Line, 
  ResponsiveContainer, 
  Pie, 
  Cell, 
  AreaChart,
  Area,
  LineChart,
  PieChart,
  BarChart 
} from 'recharts';

export default function SpendingAnalytics() {
  const { translateText } = useMasterTranslation();
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Redirect if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  const userId = user.id;
  
  const { 
    spendingByCategory, 
    getSpendingOverTime, 
    spendingStats, 
    isLoading 
  } = useSpendingAnalytics(userId);
  
  const timeSeriesData = getSpendingOverTime(timePeriod);
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#2E86C1', '#CB4335', '#F1C40F', '#2ECC71', '#9B59B6'];
  const DEPOSIT_COLOR = '#4CAF50';
  const SPENDING_COLOR = '#F44336';
  
  // Format the time period label
  const formatPeriodLabel = (period: string): string => {
    if (timePeriod === 'weekly') {
      const [year, week] = period.split('-W');
      return `Week ${week}, ${year}`;
    } else if (timePeriod === 'monthly') {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    } else if (timePeriod === 'yearly') {
      return period;
    }
    return period;
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center gradient-text">{t('wallet.spending_analytics')}</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="overview">
                <BarChartIcon className="h-4 w-4 mr-2" />
                {t('wallet.overview')}
              </TabsTrigger>
              <TabsTrigger value="trends">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('wallet.trends')}
              </TabsTrigger>
              <TabsTrigger value="categories">
                <PieChartIcon className="h-4 w-4 mr-2" />
                {t('wallet.categories')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('wallet.total_deposits')}
                    </CardTitle>
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">
                      {formatCurrency(spendingStats.totalDeposits, "GBP")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('wallet.total_transactions', { count: spendingStats.depositCount })}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('wallet.total_spending')}
                    </CardTitle>
                    <Wallet className="h-5 w-5 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">
                      {formatCurrency(spendingStats.totalSpending, "GBP")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('wallet.total_transactions', { count: spendingStats.spendingCount })}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('wallet.net_balance')}
                    </CardTitle>
                    {spendingStats.netBalance >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${spendingStats.netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(spendingStats.netBalance, "GBP")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('wallet.balance_change')}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t('wallet.largest_transactions')}
                    </CardTitle>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <ArrowUp className="h-4 w-4 mr-1 text-green-500" />
                        <span className="text-sm">{formatCurrency(spendingStats.largestDeposit, "GBP")}</span>
                      </div>
                      <div className="flex items-center">
                        <ArrowDown className="h-4 w-4 mr-1 text-red-500" />
                        <span className="text-sm">{formatCurrency(spendingStats.largestSpending, "GBP")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Overview Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('wallet.income_vs_spending')}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { 
                            name: t('wallet.summary'), 
                            deposits: spendingStats.totalDeposits, 
                            spending: spendingStats.totalSpending 
                          }
                        ]}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => formatCurrency(value, "GBP")} />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip formatter={(value) => formatCurrency(value as number, "GBP")} />
                        <Legend />
                        <Bar dataKey="deposits" name={t('wallet.deposits')} fill="#4CAF50" />
                        <Bar dataKey="spending" name={t('wallet.spending')} fill="#F44336" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>{t('wallet.spending_by_category')}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {spendingByCategory.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={spendingByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="amount"
                            nameKey="category"
                            label={({ category, percentage }) => 
                              `${category}: ${percentage.toFixed(1)}%`
                            }
                          >
                            {spendingByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => formatCurrency(value as number, "GBP")} 
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex justify-center items-center h-full text-muted-foreground">
                        {t('wallet.no_spending_data')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="space-y-6">
              {/* Time Period Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('wallet.spending_over_time')}</CardTitle>
                  <div className="flex space-x-2 mt-4">
                    <Button 
                      variant={timePeriod === 'weekly' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setTimePeriod('weekly')}
                    >
                      {t('wallet.weekly')}
                    </Button>
                    <Button 
                      variant={timePeriod === 'monthly' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setTimePeriod('monthly')}
                    >
                      {t('wallet.monthly')}
                    </Button>
                    <Button 
                      variant={timePeriod === 'yearly' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setTimePeriod('yearly')}
                    >
                      {t('wallet.yearly')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="h-96">
                  {timeSeriesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="period" 
                          tickFormatter={formatPeriodLabel}
                        />
                        <YAxis tickFormatter={(value) => formatCurrency(value, "GBP")} />
                        <Tooltip 
                          formatter={(value, name) => [
                            formatCurrency(value as number, "GBP"),
                            name === 'deposits' ? t('wallet.deposits') : t('wallet.spending')
                          ]}
                          labelFormatter={formatPeriodLabel}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="deposits" 
                          name={t('wallet.deposits')}
                          stroke={DEPOSIT_COLOR} 
                          fill={DEPOSIT_COLOR} 
                          fillOpacity={0.3} 
                          stackId="1"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="spending" 
                          name={t('wallet.spending')}
                          stroke={SPENDING_COLOR} 
                          fill={SPENDING_COLOR} 
                          fillOpacity={0.3} 
                          stackId="2"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      {t('wallet.no_trend_data')}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Line Chart of Spending vs Income */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('wallet.income_vs_spending_trend')}</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {timeSeriesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="period" 
                          tickFormatter={formatPeriodLabel}
                        />
                        <YAxis tickFormatter={(value) => formatCurrency(value, "GBP")} />
                        <Tooltip 
                          formatter={(value) => formatCurrency(value as number, "GBP")}
                          labelFormatter={formatPeriodLabel}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="deposits" 
                          name={t('wallet.deposits')}
                          stroke={DEPOSIT_COLOR} 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="spending" 
                          name={t('wallet.spending')}
                          stroke={SPENDING_COLOR} 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      {t('wallet.no_trend_data')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-6">
              {/* Category spending breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('wallet.category_breakdown')}</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  {spendingByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={spendingByCategory}
                        layout="vertical"
                        margin={{ left: 120 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => formatCurrency(value, "GBP")} />
                        <YAxis 
                          dataKey="category" 
                          type="category" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => formatCurrency(value as number, "GBP")}
                        />
                        <Legend />
                        <Bar 
                          dataKey="amount" 
                          name={t('wallet.amount')}
                          fill="#8884d8"
                        >
                          {spendingByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      {t('wallet.no_category_data')}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Category percentage pie chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('wallet.category_distribution')}</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {spendingByCategory.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                      <div className="min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={spendingByCategory}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="amount"
                              nameKey="category"
                              label={({ category, percentage }) => 
                                percentage > 5 ? `${category}: ${percentage.toFixed(1)}%` : ''
                              }
                            >
                              {spendingByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, name, props) => {
                                const item = props.payload;
                                return [`${formatCurrency(value as number, "GBP")} (${item?.percentage.toFixed(1)}%)`];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className="text-lg font-semibold mb-4">{t('wallet.top_categories')}</h3>
                        <ul className="space-y-2">
                          {spendingByCategory.slice(0, 5).map((category, index) => (
                            <li key={index} className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="flex-1">{category.category}</span>
                              <span className="font-medium">{formatCurrency(category.amount, "GBP")}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({category.percentage.toFixed(1)}%)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      {t('wallet.no_category_data')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}