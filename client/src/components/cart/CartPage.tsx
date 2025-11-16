import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useCartData } from '@/hooks/cart/useCartData';
import { useShippingOptions } from '@/hooks/cart/useShippingOptions';
import { useGiftCart } from '@/hooks/cart/useGiftCart';
import { useCartTranslations } from '@/locales/cartStrings';
import { CartHeader } from './CartHeader';
import { CartItemsPanel } from './CartItemsPanel';
import { CheckoutStepper } from './CheckoutStepper';
import { PricingSummary } from './PricingSummary';
import { Button } from '@/components/ui/button';
import { Loader2, Package, CreditCard } from './icons';
import { addDays, format } from 'date-fns';
import { SEOHead } from '@/components/seo/SEOHead';

const GiftDialog = lazy(() => import('./GiftDialog'));

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const ts = useCartTranslations();
  
  const [selectedShippingType, setSelectedShippingType] = useState<string>('normal-freight');
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [packagingOption, setPackagingOption] = useState<'signature-box' | 'signature-with-bag' | 'standard'>('signature-box');
  
  const [shippingForm, setShippingForm] = useState({
    firstName: user?.firstName || '',
    surname: user?.surname || '',
    addressLine1: user?.shippingAddress || '',
    addressLine2: '',
    country: user?.country || 'Belgium',
    city: user?.city || '',
    postalCode: user?.shippingZipCode || '',
    isBusinessAddress: false,
    phoneCode: '+32',
    phone: user?.phone || '',
    saveToAddressBook: false,
  });

  const {
    cartItems,
    isLoading,
    error,
    subtotal,
    tax,
    transactionCommission,
    formatPriceFromGBP,
    handleUpdateQuantity,
    handleRemoveFromCart,
    updateQuantityMutation,
  } = useCartData();

  const { finalShippingCost } = useShippingOptions(cartItems, selectedShippingType);

  const {
    giftDialogOpen,
    setGiftDialogOpen,
    selectedRecipient,
    setSelectedRecipient,
    giftMessage,
    setGiftMessage,
    recipientSearch,
    setRecipientSearch,
    filteredUsers,
    usersLoading,
    sendGiftMutation,
    handleSendGift,
  } = useGiftCart();

  const total = useMemo(() => 
    subtotal + finalShippingCost + tax + transactionCommission,
    [subtotal, finalShippingCost, tax, transactionCommission]
  );

  const deliveryEstimate = useMemo(() => {
    const addWorkingDays = (startDate: Date, days: number) => {
      let currentDate = new Date(startDate);
      let addedDays = 0;
      
      while (addedDays < days) {
        currentDate = addDays(currentDate, 1);
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          addedDays++;
        }
      }
      
      return currentDate;
    };
    
    const today = new Date();
    const startDate = addWorkingDays(today, 2);
    const endDate = addWorkingDays(today, 5);
    
    const formattedStart = format(startDate, 'EEE, d MMM');
    const formattedEnd = format(endDate, 'EEE, d MMM');
    
    return `Estimated complimentary delivery: ${formattedStart} - ${formattedEnd}. Some regions may take up to 20+ working days.`;
  }, []);

  const handleShippingFormChange = useCallback((field: string, value: any) => {
    setShippingForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleContinueToPackaging = useCallback(() => {
    if (!shippingForm.firstName.trim() || !shippingForm.surname.trim() || 
        !shippingForm.addressLine1.trim() || !shippingForm.city.trim() || 
        !shippingForm.postalCode.trim() || !shippingForm.phone.trim()) {
      return;
    }
    setCheckoutStep(2);
  }, [shippingForm]);

  const handleContinueToPayment = useCallback(() => {
    setCheckoutStep(3);
  }, []);

  const handleGoHome = useCallback(() => setLocation('/'), [setLocation]);
  const handleContinueShopping = useCallback(() => setLocation('/'), [setLocation]);

  const handleGiftCancel = useCallback(() => {
    setGiftDialogOpen(false);
    setSelectedRecipient(null);
    setGiftMessage('');
    setRecipientSearch('');
  }, [setGiftDialogOpen, setSelectedRecipient, setGiftMessage, setRecipientSearch]);

  const handleGiftSend = useCallback(() => {
    handleSendGift(cartItems, total, finalShippingCost, selectedShippingType);
  }, [handleSendGift, cartItems, total, finalShippingCost, selectedShippingType]);

  if (!user || isLoading || error) {
    return (
      <CartHeader
        user={user}
        isLoading={isLoading}
        error={error}
        onGoHome={handleGoHome}
        onContinueShopping={handleContinueShopping}
      />
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <SEOHead 
          title="Shopping Cart - Dedw3n"
          description="Review your shopping cart items before checkout. Secure payment, luxury packaging, and worldwide shipping available."
        />
        <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
          <h2 className="text-2xl font-semibold mb-2">{ts.yourCartIsEmpty}</h2>
          <Button onClick={handleContinueShopping} data-testid="button-browse-products" className="bg-black text-white hover:bg-black/90">
            {ts.browseProducts}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title={`Shopping Cart (${cartItems.length} items) - Dedw3n`}
        description="Review your shopping cart items, select shipping options, and proceed to secure checkout. Free shipping on orders over £500."
      />
      <div className="container max-w-7xl mx-auto py-6 px-4 sm:py-8">
      <CartHeader
        user={user}
        isLoading={false}
        error={null}
        onGoHome={handleGoHome}
        onContinueShopping={handleContinueShopping}
      />

      {/* Mobile Order Summary */}
      <div className="mb-8 lg:hidden">
        <div className="border rounded-lg">
          <div className="border-b px-6 py-4 bg-gray-50">
            <h2 className="text-lg font-semibold uppercase tracking-wide text-center">{ts.orderSummary}</h2>
            <p className="text-sm text-center mt-1">{cartItems.length} {ts.item}</p>
          </div>
          
          <div className="p-6 max-h-96 overflow-y-auto">
            <CartItemsPanel
              items={cartItems}
              formatPrice={formatPriceFromGBP}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveFromCart}
              isUpdating={updateQuantityMutation.isPending}
            />
          </div>

          <PricingSummary
            subtotal={subtotal}
            shipping={finalShippingCost}
            tax={tax}
            total={total}
            formatPrice={formatPriceFromGBP}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Checkout Steps */}
        <div className="lg:col-span-2">
          <CheckoutStepper
            currentStep={checkoutStep}
            shippingForm={shippingForm}
            onShippingFormChange={handleShippingFormChange}
            onContinueToPackaging={handleContinueToPackaging}
            onContinueToPayment={handleContinueToPayment}
            isSavingAddress={false}
            packagingOption={packagingOption}
            onPackagingChange={setPackagingOption}
          />
        </div>

        {/* Right Column - Desktop Order Summary */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="border rounded-lg sticky top-4">
            <div className="border-b px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-semibold uppercase tracking-wide text-center">{ts.orderSummary}</h2>
              <p className="text-sm text-center mt-1">{cartItems.length} {ts.item}</p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <CartItemsPanel
                items={cartItems}
                formatPrice={formatPriceFromGBP}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveFromCart}
                isUpdating={updateQuantityMutation.isPending}
              />
            </div>

            <PricingSummary
              subtotal={subtotal}
              shipping={finalShippingCost}
              tax={tax}
              total={total}
              formatPrice={formatPriceFromGBP}
            />

            <div className="px-6 pb-4">
              <button className="w-full flex items-center justify-between text-sm font-medium py-2 border-t pt-4">
                <span>{ts.viewDetails}</span>
                <span>+</span>
              </button>
              <p className="text-xs text-gray-600 mt-2">{ts.chargeNotice}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lazy-loaded Gift Dialog */}
      <Suspense fallback={<div className="hidden" />}>
        <GiftDialog
          open={giftDialogOpen}
          onOpenChange={setGiftDialogOpen}
          cartItems={cartItems}
          total={total}
          shippingCost={finalShippingCost}
          formatPrice={formatPriceFromGBP}
          selectedRecipient={selectedRecipient}
          onSelectRecipient={setSelectedRecipient}
          giftMessage={giftMessage}
          onMessageChange={setGiftMessage}
          recipientSearch={recipientSearch}
          onSearchChange={setRecipientSearch}
          filteredUsers={filteredUsers}
          usersLoading={usersLoading}
          onSendGift={handleGiftSend}
          isSending={sendGiftMutation.isPending}
          onCancel={handleGiftCancel}
        />
      </Suspense>
    </div>
    </>
  );
}
