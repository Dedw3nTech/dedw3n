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
import { useTranslation } from 'react-i18next';
import { ChevronUpIcon, ChevronDownIcon, RefreshCwIcon, ArrowRightIcon, PlusIcon, WalletIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Redirect } from 'wouter';

export default function WalletPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
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

  // Fetch user's transactions
  const { 
    data: transactions, 
    isLoading: transactionsLoading,
    isError: transactionsError 
  } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!wallet,
  });

  // Create wallet mutation
  const createWalletMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/wallets', {
        balance: 0,
        currency: 'USD',
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

  const handleCreateWallet = () => {
    createWalletMutation.mutate();
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

    // For withdrawals, check if there are sufficient funds
    if (type === 'withdrawal' && wallet && Number(amount) > wallet.balance) {
      toast({
        title: t('wallet.insufficient_funds'),
        description: t('wallet.amount_positive'),
        variant: 'destructive',
      });
      return;
    }

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
      default:
        return <ArrowRightIcon className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'text-green-600';
      case 'withdrawal':
      case 'payment':
        return 'text-red-500';
      default:
        return '';
    }
  };

  const formatAmount = (type: string, amount: number) => {
    const prefix = type === 'deposit' || type === 'refund' ? '+' : '-';
    return `${prefix}$${amount.toFixed(2)}`;
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
                  <p className="text-3xl font-bold">${wallet.balance.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('wallet.currency')}</p>
                  <p className="text-md">{wallet.currency}</p>
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
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">{t('wallet.overview')}</TabsTrigger>
                  <TabsTrigger value="deposit" className="flex-1">{t('wallet.deposit')}</TabsTrigger>
                  <TabsTrigger value="withdraw" className="flex-1">{t('wallet.withdraw')}</TabsTrigger>
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
                            className="flex items-center justify-between p-3 border rounded-lg"
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
                  <form onSubmit={handleTransaction('deposit')} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">{t('wallet.amount')}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
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
                </TabsContent>
                
                <TabsContent value="withdraw">
                  <form onSubmit={handleTransaction('withdrawal')} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">{t('wallet.amount')}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
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
                        {t('wallet.available')}: ${wallet.balance.toFixed(2)}
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
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}