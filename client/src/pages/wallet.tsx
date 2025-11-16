import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Wallet, Transaction } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMasterTranslation } from '@/hooks/use-master-translation';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  RefreshCwIcon, 
  ArrowRightIcon, 
  PlusIcon, 
  WalletIcon,
  ArrowUpDownIcon,
  PieChartIcon,
  TagIcon,
  CreditCardIcon,
  ReceiptIcon,
  BanknoteIcon,
  ShoppingCartIcon,
  HomeIcon,
  WifiIcon,
  CarIcon,
  HeartIcon,
  GraduationCapIcon,
  BriefcaseIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { Redirect, Link } from 'wouter';
import { 
  supportedCurrencies, 
  currencySymbols, 
  convertCurrency, 
  formatCurrency,
  fetchExchangeRates,
  CurrencyCode
} from '@/lib/currencyConverter';

export default function WalletPage() {
  const { translateText } = useMasterTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('GBP');
  // Start with EUR as a default target currency, will be updated when wallet data is available
  const [targetCurrency, setTargetCurrency] = useState<CurrencyCode>('EUR');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<CurrencyCode, number>>({} as Record<CurrencyCode, number>);
  
  // Top-up card payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedCardValue, setSelectedCardValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Force rerender when currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      console.log('Wallet page detected currency change');
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('currency-changed', handleCurrencyChange);
    
    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, []);
  
  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Fetch user's wallet
  const { 
    data: wallet, 
    isLoading: walletLoading, 
    isError: walletError 
  } = useQuery<Wallet>({
    queryKey: ['/api/wallets/me'],
    retry: false,
  });
  
  // Initialize default target currency and fetch exchange rates
  useEffect(() => {
    if (wallet && wallet.currency) {
      // Convert the wallet currency to a valid CurrencyCode or use GBP as fallback
      const walletCurrency = supportedCurrencies.includes(wallet.currency as CurrencyCode) 
        ? (wallet.currency as CurrencyCode) 
        : 'GBP';
      
      // Find a default target currency different from the current wallet currency
      const defaultTarget = supportedCurrencies.find(c => c !== walletCurrency) || 'USD';
      setTargetCurrency(defaultTarget);
      
      // Fetch exchange rates
      fetchExchangeRates(walletCurrency)
        .then(rates => {
          setExchangeRates(rates);
        })
        .catch(error => {
          console.error('Error fetching initial exchange rates:', error);
        });
    }
  }, [wallet]);

  // Fetch user's transactions
  const { 
    data: transactions, 
    isLoading: transactionsLoading,
    isError: transactionsError 
  } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!wallet,
  });
  
  // Fetch transactions categorized by category
  const {
    data: categorizedTransactions,
    isLoading: categoriesLoading,
    isError: categoriesError
  } = useQuery<Record<string, Transaction[]>>({
    queryKey: ['/api/transactions/categories'],
    enabled: !!wallet,
  });
  
  // Fetch transaction statistics
  const {
    data: transactionStats,
    isLoading: statsLoading,
    isError: statsError
  } = useQuery<{
    totalIncome: number;
    totalExpense: number;
    byCategoryExpense: Record<string, number>;
    byCategoryIncome: Record<string, number>;
  }>({
    queryKey: ['/api/transactions/stats'],
    enabled: !!wallet,
  });

  // Create wallet mutation
  const createWalletMutation = useMutation({
    mutationFn: async (currency: string = 'GBP') => {
      const res = await apiRequest('POST', '/api/wallets', {
        balance: 0,
        currency,
        isActive: true
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallets/me'] });
      toast({
        title: t('wallet.created'),
        description: t('wallet.created_success'),
      });
    },
    onError: () => {
      toast({
        title: t('wallet.error'),
        description: t('wallet.create_error'),
        variant: 'destructive',
      });
    }
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: { type: string; amount: number; description?: string }) => {
      const res = await apiRequest('POST', '/api/transactions', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallets/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setAmount('');
      setDescription('');
      toast({
        title: t('wallet.transaction_success'),
        description: t('wallet.funds_updated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('wallet.transaction_error'),
        description: error.message || t('wallet.transaction_failed'),
        variant: 'destructive',
      });
    }
  });
  
  // Create transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: async (data: { 
      recipientUsername: string; 
      amount: number; 
      description?: string 
    }) => {
      const res = await apiRequest('POST', '/api/transfers', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallets/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setAmount('');
      setDescription('');
      setRecipient('');
      toast({
        title: t('wallet.transfer_success'),
        description: t('wallet.transfer_completed'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('wallet.transfer_error'),
        description: error.message || t('wallet.transfer_failed'),
        variant: 'destructive',
      });
    }
  });

  const handleCreateWallet = () => {
    createWalletMutation.mutate(selectedCurrency);
  };

  // Handle top-up card selection
  const handleCardSelection = (value: number) => {
    setSelectedCardValue(value);
    setPaymentMethod('card'); // Default to card payment
    setShowPaymentDialog(true);
    
    // Set amount and description for the top-up card
    setAmount(value.toString());
    setDescription(`${wallet?.currency || 'GBP'}${value} Top-up Card`);
  };

  // Handle card payment for top-up
  const handleCardPayment = async () => {
    try {
      // For this prototype, we'll directly add funds to the wallet instead of processing a real payment
      // In a production app, we would connect to Stripe API here
      
      toast({
        title: "Payment Processing",
        description: `Processing payment for £${selectedCardValue} top-up card...`,
      });

      // Simulate payment processing delay
      setTimeout(() => {
        // Add funds to wallet
        createTransactionMutation.mutate({
          type: 'deposit',
          amount: selectedCardValue,
          description: `${wallet?.currency || 'GBP'}${selectedCardValue} Top-up Card Purchase`
        });
        
        setShowPaymentDialog(false);
      }, 1500);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: translateText("Error"),
        description: "An error occurred while processing your payment.",
        variant: "destructive"
      });
    }
  };

  // Handle mobile money payment for top-up
  const handleMobileMoneyPayment = async () => {
    try {
      // For this prototype, we'll directly add funds to the wallet instead of processing a real payment
      // In a production app, we would connect to a mobile money API here
      
      toast({
        title: "Mobile Money Payment",
        description: `Processing mobile money payment for ${wallet?.currency || 'GBP'}${selectedCardValue}...`,
      });

      // Simulate payment processing delay
      setTimeout(() => {
        // Add funds to wallet
        createTransactionMutation.mutate({
          type: 'deposit',
          amount: selectedCardValue,
          description: `${wallet?.currency || 'GBP'}${selectedCardValue} Top-up Card - Mobile Money`
        });
        
        setShowPaymentDialog(false);
      }, 1500);
    } catch (error) {
      console.error("Mobile money payment error:", error);
      toast({
        title: translateText("Error"),
        description: "An error occurred while processing your mobile money payment.",
        variant: "destructive"
      });
    }
  };

  // Handle PayPal payment for top-up
  const handlePaypalPayment = async () => {
    try {
      // For this prototype, we'll directly add funds to the wallet instead of processing a real payment
      // In a production app, we would connect to the PayPal API here
      
      toast({
        title: "PayPal Payment",
        description: `Processing PayPal payment for ${wallet?.currency || 'GBP'}${selectedCardValue}...`,
      });

      // Simulate payment processing delay
      setTimeout(() => {
        // Add funds to wallet
        createTransactionMutation.mutate({
          type: 'deposit',
          amount: selectedCardValue,
          description: `${wallet?.currency || 'GBP'}${selectedCardValue} Top-up Card - PayPal`
        });
        
        setShowPaymentDialog(false);
      }, 1500);
    } catch (error) {
      console.error("PayPal payment error:", error);
      toast({
        title: translateText("Error"),
        description: "An error occurred while processing your PayPal payment.",
        variant: "destructive"
      });
    }
  };

  // Handle the payment based on the selected method
  const handlePayment = () => {
    switch (paymentMethod) {
      case 'card':
        handleCardPayment();
        break;
      case 'mobile':
        handleMobileMoneyPayment();
        break;
      case 'paypal':
        handlePaypalPayment();
        break;
      default:
        handleCardPayment();
    }
  };

  const handleTransaction = (type: string) => (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: t('wallet.invalid_amount'),
        description: t('wallet.amount_positive'),
        variant: 'destructive',
      });
      return;
    }

    // For withdrawals and transfers, check if there are sufficient funds
    if ((type === 'withdrawal' || type === 'transfer') && wallet && Number(amount) > wallet.balance) {
      toast({
        title: t('wallet.insufficient_funds'),
        description: t('wallet.amount_positive'),
        variant: 'destructive',
      });
      return;
    }
    
    // Handle transfer
    if (type === 'transfer') {
      if (!recipient) {
        toast({
          title: t('wallet.recipient_required'),
          description: t('wallet.enter_recipient'),
          variant: 'destructive',
        });
        return;
      }
      
      createTransferMutation.mutate({
        recipientUsername: recipient,
        amount: Number(amount),
        description: description || undefined
      });
      return;
    }

    // Handle deposit and withdrawal
    createTransactionMutation.mutate({
      type,
      amount: Number(amount),
      description: description || undefined
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ChevronUpIcon className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ChevronDownIcon className="h-4 w-4 text-red-500" />;
      case 'payment':
        return <ArrowRightIcon className="h-4 w-4 text-blue-500" />;
      case 'refund':
        return <RefreshCwIcon className="h-4 w-4 text-amber-500" />;
      case 'transfer':
      case 'transfer_in':
      case 'transfer_out':
        return <ArrowRightIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <ArrowRightIcon className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
      case 'transfer_in':
        return 'text-green-600';
      case 'withdrawal':
      case 'payment':
      case 'transfer_out':
        return 'text-red-500';
      case 'transfer':
        return 'text-blue-500';
      default:
        return '';
    }
  };

  const formatAmount = (type: string, amount: number) => {
    let prefix = '-';
    
    if (type === 'deposit' || type === 'refund' || type === 'transfer_in') {
      prefix = '+';
    }
    
    // Use the wallet's currency symbol for formatting
    const currencySymbol = wallet?.currency ? currencySymbols[wallet.currency as keyof typeof currencySymbols] || '$' : '$';
    
    return `${prefix}${currencySymbol}${amount.toFixed(2)}`;
  };
  
  // Get category icon based on category name
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'salary':
      case 'income':
        return <BriefcaseIcon className="h-4 w-4 text-green-500" />;
      case 'shopping':
        return <ShoppingCartIcon className="h-4 w-4 text-blue-500" />;
      case 'bills':
      case 'utilities':
        return <ReceiptIcon className="h-4 w-4 text-red-500" />;
      case 'entertainment':
        return <HeartIcon className="h-4 w-4 text-purple-500" />;
      case 'transport':
      case 'travel':
        return <CarIcon className="h-4 w-4 text-amber-500" />;
      case 'education':
        return <GraduationCapIcon className="h-4 w-4 text-indigo-500" />;
      case 'housing':
      case 'rent':
        return <HomeIcon className="h-4 w-4 text-emerald-500" />;
      case 'services':
        return <WifiIcon className="h-4 w-4 text-cyan-500" />;
      default:
        return <TagIcon className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get category color based on category name
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'salary':
      case 'income':
        return 'bg-green-100 text-green-800';
      case 'shopping':
        return 'bg-blue-100 text-blue-800';
      case 'bills':
      case 'utilities':
        return 'bg-red-100 text-red-800';
      case 'entertainment':
        return 'bg-purple-100 text-purple-800';
      case 'transport':
      case 'travel':
        return 'bg-amber-100 text-amber-800';
      case 'education':
        return 'bg-indigo-100 text-indigo-800';
      case 'housing':
      case 'rent':
        return 'bg-emerald-100 text-emerald-800';
      case 'services':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (walletLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[70vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // No wallet yet
  if (walletError || !wallet) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{t('wallet.no_wallet')}</CardTitle>
            <CardDescription>{t('wallet.create_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">{t('wallet.select_currency')}</Label>
                <Select 
                  value={selectedCurrency} 
                  onValueChange={(value: string) => setSelectedCurrency(value as CurrencyCode)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('wallet.select_currency')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('wallet.available_currencies')}</SelectLabel>
                      <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                      <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                      <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                      <SelectItem value="CNY">CNY - Chinese Yuan (¥)</SelectItem>
                      <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                      <SelectItem value="BRL">BRL - Brazilian Real (R$)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleCreateWallet}
              disabled={createWalletMutation.isPending}
              className="w-full"
            >
              {createWalletMutation.isPending ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  {t('wallet.creating')}
                </span>
              ) : (
                <span className="flex items-center">
                  <PlusIcon className="mr-2 h-4 w-4" /> 
                  {t('wallet.create_wallet')}
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Wallet Overview */}
        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <WalletIcon className="h-5 w-5 mr-2" />
                {t('wallet.my_wallet')}
              </CardTitle>
              <CardDescription>{t('wallet.manage_funds')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('wallet.balance')}</p>
                  <p className="text-3xl font-bold">
                    {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '$'}
                    {wallet.balance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('wallet.currency')}</p>
                  <p className="text-md">{wallet.currency}</p>
                </div>
                <div className="mt-4">
                  <Link href="/spending-analytics">
                    <Button 
                      variant="outline" 
                      className="w-full"
                    >
                      <PieChartIcon className="h-4 w-4 mr-2" />
                      {t('wallet.spending_analytics')}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Tabs */}
        <div className="md:w-2/3">
          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full mb-2">
                  <TabsTrigger value="overview">
                    <WalletIcon className="h-4 w-4 mr-1" />
                    {t('wallet.overview')}
                  </TabsTrigger>
                  <TabsTrigger value="categories">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {t('wallet.categories')}
                  </TabsTrigger>
                  <TabsTrigger value="stats">
                    <PieChartIcon className="h-4 w-4 mr-1" />
                    {t('wallet.statistics')}
                  </TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="deposit">{t('wallet.deposit')}</TabsTrigger>
                  <TabsTrigger value="withdraw">{t('wallet.withdraw')}</TabsTrigger>
                  <TabsTrigger value="convert">
                    <ArrowUpDownIcon className="h-4 w-4 mr-1" />
                    {t('wallet.convert')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('wallet.recent_transactions')}</h3>
                    
                    {transactionsLoading ? (
                      <div className="flex justify-center p-4">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : transactionsError || !transactions || transactions.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        {t('wallet.no_transactions')}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.slice(0, 5).map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center">
                              <div className="mr-3 p-2 bg-gray-100 rounded-full">
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div>
                                <p className="font-medium capitalize">{transaction.type}</p>
                                <p className="text-xs text-muted-foreground">
                                  {transaction.createdAt 
                                    ? format(new Date(transaction.createdAt), 'MMM dd, yyyy • HH:mm')
                                    : ''}
                                </p>
                                {transaction.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{transaction.description}</p>
                                )}
                                {/* Display link to related user profile for transfers */}
                                {(transaction.type === 'transfer_in' || transaction.type === 'transfer_out') && 
                                 (transaction as any).relatedUser && (
                                  <Link 
                                    to={`/members/${(transaction as any).relatedUser.id}`}
                                    className="text-xs text-primary flex items-center mt-1 hover:underline"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    {t('wallet.view_profile')}: {(transaction as any).relatedUser.name}
                                  </Link>
                                )}
                              </div>
                            </div>
                            <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                              {formatAmount(transaction.type, transaction.amount)}
                            </p>
                          </div>
                        ))}
                        
                        {transactions.length > 5 && (
                          <Button variant="outline" className="w-full mt-4">
                            {t('wallet.view_all')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="deposit">
                  <div className="space-y-6">
                    {/* Top-up Cards */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Quick Top-up Cards</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[5, 10, 25, 50, 100, 250, 500, 1000].map((value) => (
                          <div 
                            key={value}
                            onClick={() => handleCardSelection(value)}
                            className="border rounded-lg p-3 text-center hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                          >
                            <p className="text-sm font-medium mb-1">Top-up Card</p>
                            <p className="text-xl font-bold text-primary">
                              {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '£'}{value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Custom Amount Form */}
                    <form onSubmit={handleTransaction('deposit')} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">{t('wallet.amount')}</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2">
                            {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '£'}
                          </span>
                          <Input 
                            id="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="pl-7"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">{t('wallet.description')} ({t('wallet.optional')})</Label>
                        <Input 
                          id="description"
                          placeholder={t('wallet.deposit_description')}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={createTransactionMutation.isPending}
                      >
                        {createTransactionMutation.isPending ? (
                          <span className="flex items-center">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                            {t('wallet.processing')}
                          </span>
                        ) : (
                          t('wallet.deposit_funds')
                        )}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
                
                <TabsContent value="withdraw">
                  <form onSubmit={handleTransaction('withdrawal')} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">{t('wallet.amount')}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">
                          {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '$'}
                        </span>
                        <Input 
                          id="amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          max={wallet.balance}
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-7"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('wallet.available')}: {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '$'}
                        {wallet.balance.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">{t('wallet.description')} ({t('wallet.optional')})</Label>
                      <Input 
                        id="description"
                        placeholder={t('wallet.withdrawal_description')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createTransactionMutation.isPending || Number(amount) > wallet.balance}
                    >
                      {createTransactionMutation.isPending ? (
                        <span className="flex items-center">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                          {t('wallet.processing')}
                        </span>
                      ) : (
                        t('wallet.withdraw_funds')
                      )}
                    </Button>
                  </form>
                </TabsContent>
                


                <TabsContent value="categories">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('wallet.transactions_by_category')}</h3>
                    
                    {categoriesLoading ? (
                      <div className="flex justify-center p-4">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : categoriesError || !categorizedTransactions || Object.keys(categorizedTransactions).length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        {t('wallet.no_categorized_transactions')}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(categorizedTransactions).map(([category, categoryTransactions]) => (
                          <div key={category} className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-muted">
                              <div className="flex items-center">
                                <div className="mr-3 p-2 bg-white rounded-full">
                                  {getCategoryIcon(category)}
                                </div>
                                <div>
                                  <h4 className="font-medium capitalize">{category}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {categoryTransactions.length} {t('wallet.transactions')}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className={getCategoryColor(category)}>
                                {category}
                              </Badge>
                            </div>
                            
                            <div className="divide-y">
                              {categoryTransactions.slice(0, 3).map(transaction => (
                                <div key={transaction.id} className="p-3 flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{transaction.description || transaction.type}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {transaction.createdAt 
                                        ? format(new Date(transaction.createdAt), 'MMM dd, yyyy • HH:mm')
                                        : ''}
                                    </p>
                                    <div className="mt-1 flex items-center">
                                      <Badge variant="secondary" className="text-xs mr-2">
                                        {transaction.paymentMethod}
                                      </Badge>
                                      {transaction.type && (
                                        <Badge variant="outline" className="text-xs">
                                          {transaction.type}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                                    {formatAmount(transaction.type, transaction.amount)}
                                  </p>
                                </div>
                              ))}
                            </div>
                            
                            {categoryTransactions.length > 3 && (
                              <div className="p-2 bg-muted">
                                <Button variant="ghost" size="sm" className="w-full text-xs">
                                  {t('wallet.view_all_in_category', { category })}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="stats">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('wallet.financial_statistics')}</h3>
                    
                    {statsLoading ? (
                      <div className="flex justify-center p-4">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : statsError || !transactionStats ? (
                      <div className="text-center py-6 text-muted-foreground">
                        {t('wallet.no_statistics')}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground">{t('wallet.total_income')}</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '$'}
                                  {transactionStats.totalIncome.toFixed(2)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground">{t('wallet.total_expense')}</p>
                                <p className="text-2xl font-bold text-red-500">
                                  {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '$'}
                                  {transactionStats.totalExpense.toFixed(2)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        {/* Category breakdowns */}
                        <div className="space-y-4">
                          <h4 className="font-medium">{t('wallet.expense_by_category')}</h4>
                          
                          {Object.keys(transactionStats.byCategoryExpense).length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t('wallet.no_expense_data')}</p>
                          ) : (
                            <div className="space-y-2">
                              {Object.entries(transactionStats.byCategoryExpense)
                                .sort(([, amountA], [, amountB]) => amountB - amountA)
                                .map(([category, amount]) => (
                                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center">
                                      <div className="mr-3 p-2 bg-gray-100 rounded-full">
                                        {getCategoryIcon(category)}
                                      </div>
                                      <span className="font-medium capitalize">{category}</span>
                                    </div>
                                    <Badge variant="outline" className={getCategoryColor(category)}>
                                      {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '$'}
                                      {amount.toFixed(2)}
                                    </Badge>
                                  </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-medium">{t('wallet.income_by_category')}</h4>
                          
                          {Object.keys(transactionStats.byCategoryIncome).length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t('wallet.no_income_data')}</p>
                          ) : (
                            <div className="space-y-2">
                              {Object.entries(transactionStats.byCategoryIncome)
                                .sort(([, amountA], [, amountB]) => amountB - amountA)
                                .map(([category, amount]) => (
                                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center">
                                      <div className="mr-3 p-2 bg-gray-100 rounded-full">
                                        {getCategoryIcon(category)}
                                      </div>
                                      <span className="font-medium capitalize">{category}</span>
                                    </div>
                                    <Badge variant="outline" className={getCategoryColor(category)}>
                                      {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '$'}
                                      {amount.toFixed(2)}
                                    </Badge>
                                  </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="convert">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">{t('wallet.currency_converter')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('wallet.convert_description')}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('wallet.amount')}</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2">
                            {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '$'}
                          </span>
                          <Input 
                            type="number"
                            min="0.01"
                            step="0.01"
                            max={wallet.balance}
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="pl-7"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('wallet.available')}: {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '$'}
                          {wallet.balance.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label>{t('wallet.from')}</Label>
                          <Select defaultValue={wallet.currency} disabled>
                            <SelectTrigger>
                              <SelectValue>{wallet.currency}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={wallet.currency}>{wallet.currency}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="pt-6">
                          <ArrowUpDownIcon className="h-5 w-5" />
                        </div>

                        <div className="flex-1">
                          <Label>{t('wallet.to')}</Label>
                          <Select
                            value={targetCurrency}
                            onValueChange={(value: string) => setTargetCurrency(value as CurrencyCode)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('wallet.select_currency')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {supportedCurrencies
                                  .filter(c => c !== wallet.currency)
                                  .map(currency => (
                                    <SelectItem key={currency} value={currency}>
                                      {currency} - {currencySymbols[currency as keyof typeof currencySymbols]}
                                    </SelectItem>
                                  ))
                                }
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button 
                        onClick={async () => {
                          if (!amount || !targetCurrency || isNaN(Number(amount))) {
                            toast({
                              title: t('wallet.conversion_error'),
                              description: t('wallet.provide_valid_amount'),
                              variant: 'destructive'
                            });
                            return;
                          }
                          
                          try {
                            const amountToConvert = Number(amount);
                            
                            // Get wallet currency as CurrencyCode or use GBP as fallback
                            const walletCurrency = supportedCurrencies.includes(wallet.currency as CurrencyCode)
                              ? (wallet.currency as CurrencyCode)
                              : 'GBP';
                            
                            // Fetch fresh rates
                            const rates = await fetchExchangeRates(walletCurrency);
                            setExchangeRates(rates);
                            
                            // Calculate converted amount
                            const converted = amountToConvert * (rates[targetCurrency] || 1);
                            setConvertedAmount(converted);
                            
                            toast({
                              title: t('wallet.conversion_result'),
                              description: `${formatCurrency(amountToConvert, walletCurrency, true)} = ${formatCurrency(converted, targetCurrency, true)}`
                            });
                          } catch (error) {
                            console.error('Conversion error:', error);
                            toast({
                              title: t('wallet.conversion_error'),
                              description: t('wallet.rate_fetch_failed'),
                              variant: 'destructive'
                            });
                          }
                        }}
                        disabled={!amount || !targetCurrency || isNaN(Number(amount))}
                        className="w-full mt-2"
                      >
                        {t('wallet.calculate_rate')}
                      </Button>
                      
                      {convertedAmount !== null && exchangeRates[targetCurrency] && (
                        <div className="bg-muted p-4 rounded-md mt-4">
                          <h4 className="font-medium mb-2">{t('wallet.conversion_result')}</h4>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-bold">
                                {formatCurrency(Number(amount), supportedCurrencies.includes(wallet.currency as CurrencyCode) ? (wallet.currency as CurrencyCode) : 'GBP')}
                              </p>
                              <p className="text-sm text-muted-foreground">{wallet.currency}</p>
                            </div>
                            <ArrowRightIcon className="h-5 w-5 mx-4 text-muted-foreground" />
                            <div>
                              <p className="text-2xl font-bold">
                                {formatCurrency(convertedAmount, targetCurrency)}
                              </p>
                              <p className="text-sm text-muted-foreground">{targetCurrency}</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                              {t('wallet.exchange_rate')}: 1 {wallet.currency} = {exchangeRates[targetCurrency].toFixed(4)} {targetCurrency}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('wallet.rates_updated')}: {new Date().toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Top-up Card Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Top-up Card Payment</DialogTitle>
            <DialogDescription>
              Select a payment method to purchase your 
              {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '£'}{selectedCardValue} top-up card.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Selected Top-up Card</h3>
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Amount:</span>
                  <span className="text-xl font-bold">
                    {currencySymbols[wallet.currency as keyof typeof currencySymbols] || '£'}{selectedCardValue}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Payment Method</h3>
              <div className="grid grid-cols-3 gap-2">
                <div 
                  className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${
                    paymentMethod === 'card' ? 'border-primary bg-primary/10' : 'hover:border-primary hover:bg-primary/5'
                  }`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCardIcon className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">Card</span>
                </div>
                <div 
                  className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${
                    paymentMethod === 'paypal' ? 'border-primary bg-primary/10' : 'hover:border-primary hover:bg-primary/5'
                  }`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <svg className="h-5 w-5 mx-auto mb-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.5 15.5H6.5L5 7.5H9.5C11.5 7.5 12.5 9 12 11C11.5 13 9.5 15.5 9.5 15.5Z" fill="#0070E0" />
                    <path d="M15.5 12H12.5L11 20H15C17 20 18 18.5 17.5 16.5C17 14.5 15.5 12 15.5 12Z" fill="#0070E0" />
                  </svg>
                  <span className="text-xs font-medium">PayPal</span>
                </div>
                <div 
                  className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${
                    paymentMethod === 'mobile' ? 'border-primary bg-primary/10' : 'hover:border-primary hover:bg-primary/5'
                  }`}
                  onClick={() => setPaymentMethod('mobile')}
                >
                  <svg className="h-5 w-5 mx-auto mb-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 4H9C7.89543 4 7 4.89543 7 6V18C7 19.1046 7.89543 20 9 20H15C16.1046 20 17 19.1046 17 18V6C17 4.89543 16.1046 4 15 4Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="text-xs font-medium">Mobile Money</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our terms and conditions. Your payment information 
                is secured with industry-standard encryption.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={createTransactionMutation.isPending}
            >
              {createTransactionMutation.isPending ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Processing...
                </span>
              ) : (
                'Purchase Card'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}