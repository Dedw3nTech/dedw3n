import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@shared/schema';

// Type definitions for spending analytics data
export interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface SpendingOverTime {
  period: string;
  deposits: number;
  spending: number;
}

export interface SpendingStats {
  totalDeposits: number;
  totalSpending: number;
  netBalance: number;
  depositCount: number;
  spendingCount: number;
  avgDeposit: number;
  avgSpending: number;
  largestDeposit: number;
  largestSpending: number;
}

export type TimePeriod = 'weekly' | 'monthly' | 'yearly' | 'all';

export function useSpendingAnalytics(userId: number) {
  const { toast } = useToast();

  // Fetch all transactions for the user
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError
  } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/user/${userId}`],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Calculate spending by category
  const calculateSpendingByCategory = (txns: Transaction[] = []): SpendingByCategory[] => {
    // Filter to only include expenses
    const expenses = txns.filter(t => t.type === 'expense');
    
    // Group by category and sum amounts
    const byCategory: Record<string, number> = {};
    expenses.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      byCategory[category] = (byCategory[category] || 0) + transaction.amount;
    });
    
    // Calculate total spending
    const totalSpending = Object.values(byCategory).reduce((sum, amount) => sum + amount, 0);
    
    // Convert to array with percentages
    return Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpending > 0 ? (amount / totalSpending * 100) : 0
    })).sort((a, b) => b.amount - a.amount);
  };

  // Calculate spending over time
  const calculateSpendingOverTime = (txns: Transaction[] = [], period: TimePeriod = 'monthly'): SpendingOverTime[] => {
    if (!txns.length) return [];
    
    // Function to get the period key based on date and selected period
    const getPeriodKey = (date: Date | null): string => {
      // Handle null dates by using the current date as fallback
      const d = date ? new Date(date) : new Date();
      switch(period) {
        case 'weekly':
          // Get year and week number
          const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
          const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
          const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          return `${d.getFullYear()}-W${weekNumber}`;
        case 'monthly':
          return `${d.getFullYear()}-${d.getMonth() + 1}`;
        case 'yearly':
          return `${d.getFullYear()}`;
        case 'all':
        default:
          return 'all';
      }
    };

    // Group transactions by period
    const periodData: Record<string, { deposits: number; spending: number }> = {};
    
    txns.forEach(transaction => {
      // Handle potentially null createdAt value
      const transactionDate = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
      const key = getPeriodKey(transactionDate);
      
      if (!periodData[key]) {
        periodData[key] = { deposits: 0, spending: 0 };
      }
      
      if (transaction.type === 'income' || transaction.type === 'deposit') {
        periodData[key].deposits += transaction.amount;
      } else if (transaction.type === 'expense' || transaction.type === 'withdrawal') {
        periodData[key].spending += transaction.amount;
      }
    });
    
    // Convert to array and sort by period
    return Object.entries(periodData)
      .map(([period, data]) => ({
        period,
        deposits: data.deposits,
        spending: data.spending
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  };

  // Calculate overall spending statistics
  const calculateSpendingStats = (txns: Transaction[] = []): SpendingStats => {
    const deposits = txns.filter(t => t.type === 'income' || t.type === 'deposit');
    const spending = txns.filter(t => t.type === 'expense' || t.type === 'withdrawal');
    
    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalSpending = spending.reduce((sum, t) => sum + t.amount, 0);
    
    const depositCount = deposits.length;
    const spendingCount = spending.length;
    
    const avgDeposit = depositCount > 0 ? totalDeposits / depositCount : 0;
    const avgSpending = spendingCount > 0 ? totalSpending / spendingCount : 0;
    
    const largestDeposit = deposits.length > 0 
      ? Math.max(...deposits.map(t => t.amount))
      : 0;
      
    const largestSpending = spending.length > 0 
      ? Math.max(...spending.map(t => t.amount))
      : 0;
    
    return {
      totalDeposits,
      totalSpending,
      netBalance: totalDeposits - totalSpending,
      depositCount,
      spendingCount,
      avgDeposit,
      avgSpending,
      largestDeposit,
      largestSpending
    };
  };

  // Handle errors with toasts
  if (transactionsError) {
    toast({
      title: "Error loading transaction data",
      description: (transactionsError as Error).message,
      variant: "destructive",
    });
  }

  // Computed values
  const spendingByCategory = calculateSpendingByCategory(transactions);
  const spendingStats = calculateSpendingStats(transactions);
  
  // Function to get spending over time with specified period
  const getSpendingOverTime = (period: TimePeriod = 'monthly') => {
    return calculateSpendingOverTime(transactions, period);
  };

  return {
    transactions,
    spendingByCategory,
    getSpendingOverTime,
    spendingStats,
    isLoading: isLoadingTransactions,
  };
}