import { memo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, AlertTriangle, Loader2 } from './icons';
import { useCartTranslations } from '@/locales/cartStrings';

interface CartHeaderProps {
  user: any;
  isLoading: boolean;
  error: Error | null;
  onGoHome: () => void;
  onContinueShopping: () => void;
}

export const CartHeader = memo(function CartHeader({
  user,
  isLoading,
  error,
  onGoHome,
  onContinueShopping
}: CartHeaderProps) {
  const ts = useCartTranslations();

  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <Card>
          <CardHeader>
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>{ts.shoppingCart}</CardTitle>
            <CardDescription>{ts.pleaseLogIn}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              {ts.signedInRequired}
            </p>
            <Button onClick={onGoHome} data-testid="button-go-home">
              {ts.goToHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="border-none">
          <CardHeader>
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <CardTitle>{ts.shoppingCart}</CardTitle>
            <CardDescription>{ts.errorLoading}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4">
              {error.message}
            </div>
            <Button onClick={onContinueShopping} data-testid="button-continue-shopping">
              {ts.continueShopping}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-6 border-b pb-4">
      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
        {ts.checkingOutAs}:
      </p>
      <p className="text-sm font-medium">
        {user?.firstName} {user?.surname}
      </p>
    </div>
  );
});
