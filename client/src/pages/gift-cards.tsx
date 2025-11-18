import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Gift, CreditCard, Heart, Star, ShoppingBag, Crown, Diamond, Sparkles, LogIn, XCircle } from 'lucide-react';
import { GIFT_CARD_DESIGNS, GIFT_CARD_DENOMINATIONS } from '@shared/schema';
import PaymentGatewaySelector from '@/components/vendor/PaymentGatewaySelector';
import MultiPaymentProcessor from '@/components/vendor/MultiPaymentProcessor';
import { apiRequest } from '@/lib/queryClient';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe';
import { formatPriceWithCurrency, convertCurrency } from '@/lib/currencyConverter';
import logoPath from '@assets/Navigation Header logo_1758774698294.png';
import headerImagePath from '@assets/De dw3n_1758789078040.png';
import mobileHeaderImagePath from '@assets/Copy of De dw3n (750 x 500 px)_1758998302741.png';
import { SEOHead } from '@/components/seo/SEOHead';

interface GiftCardDesign {
  id: string;
  name: string;
  amount: number;
  backgroundColor: string;
}

export default function GiftCardsPage() {
  // ALL HOOKS MUST BE DECLARED FIRST to follow Rules of Hooks
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { selectedCurrency, formatPriceFromGBP } = useCurrency();
  const { isMobile } = useMobileDetection();
  
  // State hooks
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<string>('classic_blue');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customAmountError, setCustomAmountError] = useState('');  
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [giftCardNumber, setGiftCardNumber] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [balanceResult, setBalanceResult] = useState<{ balance: number; status: string; cardNumber: string } | null>(null);
  const [balanceError, setBalanceError] = useState('');
  
  // Master Translation mega-batch for Gift Cards page
  const giftCardTexts = useMemo(() => [
    // Page Headers
    "Gift Cards", "Perfect for any occasion", "Purchase and redeem gift cards for yourself or loved ones",
    
    // Design Names
    "Classic Blue", "Elegant Gold", "Festive Red", "Modern Purple", 
    "Nature Green", "Luxury Black", "Premium Silver", "Exclusive Diamond", "Customize",
    
    // Form Labels and Buttons
    "Select Amount", "Custom Amount", "Recipient Email", "Recipient Name", "Personal Message", 
    "Purchase Gift Card", "Buy Now", "Buy", "Processing...", "Login Required", "Preview", "Share",
    
    // Messages and Notifications
    "Enter a custom amount", "Enter recipient's email address", "Enter recipient's name", 
    "Add a personal message (optional)", "You must be logged in to purchase gift cards.",
    "Please enter a gift card code", "Invalid gift card code", "Current Balance", 
    "Gift card purchased successfully!", "Gift card email sent successfully", "Error",
    
    // Balance and Card Info
    "Check Balance", "Code", "Status", "Transaction History", "Enter your gift card code",
    
    // Form Fields and Placeholders  
    "Gift Card Code", "Enter amount", "Digital Gift Card", "Payment Method", "Change",
    "Recipient Name", "Recipient Email", "Add a personal message (optional)",
    
    // Actions and Buttons
    "Continue", "Login", "Cancel", "Minimum", "Maximum", "Unauthorized",
    
    // Help and Terms
    "FAQ", "No Expiry", "Valid only for Dedw3n marketplace", "Physical Gift Cards",
    "Digital gift cards delivered instantly",
    
    // Validation
    "Card number must be 16 digits", "PIN must be 4 digits",
    
    // Loading and Status
    "Loading translations...", "Digital gift card Dedw3n",
    
    // FAQ Section
    "Dedw3n Gift Cards", "Does My Gift Card Expire?", "No, your Gift Card has no expiry date.",
    "How Can I View My Gift Card Balance?", "Click here to view your balance", 
    "Where Can I Use My Gift Card?", "You can use the card only on our (web) app Dedw3n.com.",
    "Can I purchase a physical Gift Card?", "Physical Gift Cards are not available currently.",
    "What's My Gift Card Balance?", "Enter your 16-digit gift card number:", "Enter your 4-digit PIN:",
    
    // Header Overlay Text
    "Share with your loved ones, family, and friends. Keep it stored on your electronic devices, in your email, or print gift cards.",
    "You can print the gift card wherever you like and share it instantly.",
    
    // Placeholders
    "Enter your 16-digit gift card number here.", "Enter your 4-digit PIN here",
    "Write a personal message...", "Minimum €5", "Maximum €10,000",
    
    // Error Messages
    "Failed to complete gift card purchase. Please try again.", "Failed to initialize payment. Please try again.",
    "Failed to add product to cart. Please log in.",
    
    // Helper Text
    "(scroll down to {section} section below.)"
  ], []);

  const { translations, isLoading: translationsLoading } = useMasterBatchTranslation(giftCardTexts, 'high');
  
  // Type-safe translations accessor - translations is an array in the same order as giftCardTexts
  const t = (key: string) => {
    const index = giftCardTexts.indexOf(key);
    return index !== -1 && translations ? translations[index] : key;
  };
  
  // Gift card design and denomination mapping - memoized to prevent hook order issues
  const giftCardMap = useMemo(() => [
    { id: 'classic_blue', name: t("Classic Blue"), amount: 5, backgroundColor: '#2563eb' },
    { id: 'elegant_gold', name: t("Elegant Gold"), amount: 10, backgroundColor: '#d97706' },
    { id: 'festive_red', name: t("Festive Red"), amount: 25, backgroundColor: '#dc2626' },
    { id: 'modern_purple', name: t("Modern Purple"), amount: 50, backgroundColor: '#7c3aed' },
    { id: 'nature_green', name: t("Nature Green"), amount: 100, backgroundColor: '#059669' },
    { id: 'luxury_black', name: t("Luxury Black"), amount: 500, backgroundColor: '#374151' },
    { id: 'premium_silver', name: t("Premium Silver"), amount: 1000, backgroundColor: '#6b7280' },
    { id: 'exclusive_diamond', name: t("Exclusive Diamond"), amount: 2500, backgroundColor: '#1f2937' },
    { id: 'customize', name: t("Customize"), amount: 0, backgroundColor: '#6366f1' }
  ], [translations]);
  
  // Early return after all hooks are declared
  if (translationsLoading) {
    return <div className="flex items-center justify-center min-h-screen">{t("Loading translations...")}</div>;
  }

  const isAuthenticated = !!user;
  

  const formatCurrency = (amount: number) => {
    // Use the global currency context to convert from GBP and format
    return formatPriceFromGBP(amount);
  };

  const getDesignById = (id: string) => {
    return giftCardMap.find((design) => design.id === id) || giftCardMap[0];
  };

  const handleAmountSelect = (amount: number, designId?: string) => {
    if (!isAuthenticated) {
      setSelectedAmount(amount);
      setShowLoginPrompt(true);
      return;
    }
    
    if (designId === 'customize') {
      setShowCustomDialog(true);
      return;
    }
    
    setSelectedAmount(amount);
    setIsDialogOpen(true);
  };
  
  const handleCustomAmountSubmit = () => {
    const amount = parseFloat(customAmount);
    if (amount && amount >= 1 && amount <= 10000) {
      setSelectedAmount(amount);
      setShowCustomDialog(false);
      setIsDialogOpen(true);
    }
  };

  const handleBalanceCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setBalanceError('');
    setBalanceResult(null);

    if (!giftCardNumber || !giftCardPin) {
      setBalanceError(t("Please enter a gift card code"));
      return;
    }

    if (giftCardNumber.length !== 16) {
      setBalanceError(t("Card number must be 16 digits"));
      return;
    }

    if (giftCardPin.length !== 4) {
      setBalanceError(t("PIN must be 4 digits"));
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/gift-cards/check-balance', {
        cardNumber: giftCardNumber,
        pin: giftCardPin,
      });

      if (response.ok) {
        const data = await response.json();
        setBalanceResult(data);
        toast({
          title: t("Current Balance"),
          description: `${t("Current Balance")}: ${formatCurrency(data.balance)}`,
        });
      } else {
        const errorData = await response.json();
        setBalanceError(errorData.message || t("Invalid gift card code"));
      }
    } catch (error: any) {
      console.error('Error checking balance:', error);
      setBalanceError(error.message || t("Invalid gift card code"));
    }
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
  };

  const handlePaymentSuccess = async () => {
    try {
      // Complete the gift card purchase
      const response = await apiRequest('POST', '/api/gift-cards/complete-purchase', {
        paymentIntentId
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: t("Gift card purchased successfully!"),
          description: `${t("Gift card purchased successfully!")} ${formatCurrency(selectedAmount!)}`,
        });
        
        // Reset form and close dialog
        setIsDialogOpen(false);
        setSelectedAmount(null);
        setRecipientEmail('');
        setRecipientName('');
        setGiftMessage('');
        setPaymentMethod('');
        setPaymentIntentId('');
      }
    } catch (error) {
      console.error('Error completing gift card purchase:', error);
      toast({
        title: t("Error"),
        description: t('Failed to complete gift card purchase. Please try again.'),
        variant: 'destructive',
      });
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: t("Error"),
      description: error,
      variant: 'destructive',
    });
  };

  const createPaymentIntent = async () => {
    if (!selectedAmount) return;

    try {
      setIsProcessing(true);
      const response = await apiRequest('POST', '/api/gift-cards/create-payment-intent', {
        amount: selectedAmount,
        currency: selectedCurrency.code,
        design: selectedDesign,
        recipientEmail,
        recipientName,
        giftMessage
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentIntentId(data.paymentIntentId);
        return data.clientSecret;
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: t("Error"),
        description: t('Failed to initialize payment. Please try again.'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const PencilDrawingArt = ({ design }: { design: GiftCardDesign }) => {
    // Plain color schemes for pencil drawing effect
    const colorSchemes = {
      classic_blue: "#2563eb", // blue-600
      elegant_gold: "#d97706", // amber-600
      festive_red: "#dc2626", // red-600
      modern_purple: "#7c3aed", // violet-600
      nature_green: "#059669", // emerald-600
      luxury_black: "#374151", // gray-700
      premium_silver: "#6b7280", // gray-500
      exclusive_diamond: "#1f2937" // gray-800
    };

    const baseColor = colorSchemes[design.id as keyof typeof colorSchemes] || colorSchemes.classic_blue;

    return (
      <div className="absolute inset-0 opacity-20">
        {/* Pencil sketch-style lines and shapes */}
        <svg className="w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none">
          {/* Hand-drawn style curved lines */}
          <path 
            d="M20,50 Q80,30 140,60 T220,40" 
            stroke={baseColor} 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="3,2"
            className="animate-pulse"
          />
          <path 
            d="M30,120 Q90,100 150,130 T230,110" 
            stroke={baseColor} 
            strokeWidth="1.5" 
            fill="none" 
            strokeDasharray="4,3"
          />
          <path 
            d="M10,160 Q70,140 130,170 T210,150" 
            stroke={baseColor} 
            strokeWidth="1" 
            fill="none" 
            strokeDasharray="2,1"
          />
          
          {/* Sketchy circular elements */}
          <circle 
            cx="60" 
            cy="80" 
            r="15" 
            stroke={baseColor} 
            strokeWidth="1.5" 
            fill="none" 
            strokeDasharray="2,1"
          />
          <circle 
            cx="180" 
            cy="140" 
            r="10" 
            stroke={baseColor} 
            strokeWidth="1" 
            fill="none" 
            strokeDasharray="1.5,1"
          />
          
          {/* Hand-drawn rectangles */}
          <rect 
            x="200" 
            y="60" 
            width="40" 
            height="25" 
            stroke={baseColor} 
            strokeWidth="1" 
            fill="none" 
            strokeDasharray="3,2"
            transform="rotate(15 220 72.5)"
          />
          
          {/* Scribbled texture lines */}
          <path 
            d="M250,30 L270,45 M260,35 L280,50 M255,40 L275,55" 
            stroke={baseColor} 
            strokeWidth="0.8" 
            strokeDasharray="1,1"
          />
        </svg>
      </div>
    );
  };

  const GiftCardPreview = ({ design }: { design: GiftCardDesign }) => {
    const isCustomize = design.id === 'customize';
    
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Gift Card Visual Area */}
        <div 
          className="relative h-48 overflow-hidden"
          style={{ backgroundColor: design.backgroundColor }}
        >
          <div className="absolute inset-0 bg-white bg-opacity-10"></div>
          
          {/* Pencil Drawing Art Pattern */}
          <PencilDrawingArt design={design} />
          
          <div className="relative p-6 h-full flex flex-col justify-center items-center text-white z-10">
            {/* Dedw3n Logo */}
            <div className="mb-4">
              <img 
                src={logoPath} 
                alt="Dedw3n Logo" 
                className="h-16 w-auto drop-shadow-lg" 
                style={{ 
                  filter: 'invert(1) brightness(2) drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                  mixBlendMode: 'difference'
                }}
              />
            </div>
            {/* Amount or Custom Text */}
            {isCustomize ? (
              <div className="text-2xl font-bold text-center drop-shadow-lg">
                <div>{t("Customize")}</div>
              </div>
            ) : (
              <div className="text-4xl font-bold drop-shadow-lg">{formatCurrency(design.amount)}</div>
            )}
          </div>
        </div>
        
        {/* Card Details */}
        <div className="p-4">
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <span>{t("Gift Cards")}</span>
          </div>
          
          <h3 className="font-semibold text-gray-800 mb-1">{design.name}</h3>
          {!isCustomize && (
            <div className="text-lg text-blue-600 mb-2">{formatCurrency(design.amount)}</div>
          )}
          {isCustomize && (
            <div className="text-lg text-blue-600 mb-2">
              <Input
                type="number"
                min="5"
                max="10000"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={t("Enter a custom amount")}
                className="text-left text-sm h-8 border-0 text-blue-600 focus:ring-0 focus:border-0 focus:outline-none focus-visible:ring-0 focus-visible:border-0 focus-visible:outline-none"
                data-testid="customize-card-amount-input"
              />
            </div>
          )}
          <p className="text-sm text-gray-600 mb-3">
            {isCustomize ? t("Custom Amount") : t("Digital gift card Dedw3n")}
          </p>
          
          <div className="space-y-2">
            <button 
              className="w-full bg-black text-white py-2 px-4 rounded font-medium hover:bg-gray-800 transition"
              onClick={() => handleAmountSelect(design.amount, design.id)}
              data-testid={`buy-gift-card-${design.id}`}
            >
              {t("Buy")}
            </button>
            
            <div className="flex justify-between">
              <button className="flex-1 text-gray-600 text-sm py-1 px-2 hover:text-gray-800">
                {t("Share")}
              </button>
              <button className="flex-1 text-gray-600 text-sm py-1 px-2 hover:text-gray-800 flex items-center justify-center">
                <Heart className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <SEOHead 
        title="Gift Cards - Perfect for Any Occasion | Dedw3n"
        description="Purchase Dedw3n gift cards from £10 to £5000. Perfect gifts for birthdays, holidays, or special occasions. Multiple designs available."
      />
      <div className="max-w-full">
        {/* Header Image */}
        <div className="mb-12">
        <div className="w-full h-[32rem] md:h-[40rem] relative overflow-hidden">
          <img 
            src={isMobile ? mobileHeaderImagePath : headerImagePath} 
            alt={t("Gift Cards")} 
            className="w-full h-full object-cover"
          />
          {/* Text Overlay - Left Corner Bottom */}
          <div className="absolute bottom-8 left-8 text-white max-w-md">
            <h2 className="text-lg font-bold mb-2" style={{ fontSize: '18px' }}>
              {t("Gift Cards")}
            </h2>
            <p className="mb-2" style={{ fontSize: '14px' }}>
              {t("Share with your loved ones, family, and friends. Keep it stored on your electronic devices, in your email, or print gift cards.")}
            </p>
            <p className="text-sm" style={{ fontSize: '10px' }}>
              {t("You can print the gift card wherever you like and share it instantly.")}
            </p>
          </div>
        </div>
      </div>

      {/* Dedw3n Gift Cards Info Section */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-left">{t("Dedw3n Gift Cards")}</h1>
          
          <div className="text-left space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("Does My Gift Card Expire?")}</h3>
              <p className="text-gray-700">{t("No, your Gift Card has no expiry date.")}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("How Can I View My Gift Card Balance?")}</h3>
              <p className="text-gray-700">
                <button 
                  onClick={() => {
                    const balanceSection = document.getElementById('balance-section');
                    balanceSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  data-testid="button-view-balance"
                >
                  {t("Click here to view your balance")}
                </button>
                {' '}{t("(scroll down to {section} section below.)").replace('{section}', `"${t("What's My Gift Card Balance?")}"`)}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("Where Can I Use My Gift Card?")}</h3>
              <p className="text-gray-700">{t("You can use the card only on our (web) app Dedw3n.com.")}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("Can I purchase a physical Gift Card?")}</h3>
              <p className="text-gray-700">{t("Physical Gift Cards are not available currently.")}</p>
            </div>
          </div>
        </div>
      </div>
    
      <div className="container mx-auto px-4 py-8 max-w-7xl">

      {/* Gift Card Collection */}
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {giftCardMap.map((design) => (
            <div key={design.id}>
              <GiftCardPreview design={design} />
            </div>
          ))}
        </div>
      </div>

      {/* What's My Gift Card Balance? */}
      <div id="balance-section" className="bg-white rounded-xl border p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-left">{t("What's My Gift Card Balance?")}</h2>
        <div className="w-full">
          <form onSubmit={handleBalanceCheck}>
            <div className="md:flex md:items-end md:gap-6">
              <div className="flex-grow space-y-4">
                <div>
                  <Label htmlFor="giftCardNumber" className="text-left font-bold">{t("Enter your 16-digit gift card number:")}</Label>
                  <Input
                    id="giftCardNumber"
                    type="text"
                    maxLength={16}
                    value={giftCardNumber}
                    onChange={(e) => setGiftCardNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder={t("Enter your 16-digit gift card number here.")}
                    className="text-left border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 placeholder:italic placeholder:text-xs"
                    data-testid="input-gift-card-number"
                  />
                </div>
                <div>
                  <Label htmlFor="giftCardPin" className="text-left font-bold">{t("Enter your 4-digit PIN:")}</Label>
                  <Input
                    id="giftCardPin"
                    type="password"
                    maxLength={4}
                    value={giftCardPin}
                    onChange={(e) => setGiftCardPin(e.target.value.replace(/\D/g, ''))}
                    placeholder={t("Enter your 4-digit PIN here")}
                    className="text-left border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 placeholder:italic placeholder:text-xs"
                    data-testid="input-gift-card-pin"
                  />
                </div>
              </div>
              
              <div className="md:ml-auto mt-4 md:mt-0">
                <Button 
                  type="submit" 
                  className="bg-black text-white hover:bg-gray-800"
                  data-testid="button-check-balance"
                >
                  {t("Check Balance")}
                </Button>
              </div>
            </div>
            
            {balanceError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{balanceError}</AlertDescription>
              </Alert>
            )}
            
            {balanceResult && (
              <Alert className="mt-4">
                <Gift className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">{t("Current Balance")}: {formatCurrency(balanceResult.balance)}</div>
                  <div className="text-sm text-gray-600">{t("Code")}: ****{balanceResult.cardNumber.slice(-4)}</div>
                  <div className="text-sm text-gray-600">{t("Status")}: {balanceResult.status}</div>
                </AlertDescription>
              </Alert>
            )}
          </form>
        </div>
      </div>


      {/* Purchase Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-6 w-6" />
              {t("Purchase Gift Card")} - {selectedAmount ? formatCurrency(selectedAmount) : ''}
            </DialogTitle>
            <DialogDescription>
              {t("Preview")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Gift Card Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t("Preview")}</h3>
                <div className="flex justify-center">
                  <div className="scale-75">
                    <GiftCardPreview design={getDesignById(selectedDesign)} />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="design">{t("Digital Gift Card")}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {giftCardMap.slice(0, 4).map((design) => (
                    <Button
                      key={design.id}
                      variant={selectedDesign === design.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDesign(design.id)}
                      className="justify-start"
                    >
                      {design.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipientName">{t("Recipient Name")}</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder={t("Enter recipient's name")}
                    data-testid="input-recipient-name"
                  />
                </div>

                <div>
                  <Label htmlFor="recipientEmail">{t("Recipient Email")}</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder={t("Enter recipient's email")}
                    data-testid="input-recipient-email"
                  />
                </div>

                <div>
                  <Label htmlFor="giftMessage">{t("Personal Message")}</Label>
                  <Textarea
                    id="giftMessage"
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder={t("Write a personal message...")}
                    rows={3}
                    data-testid="input-gift-message"
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Payment */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t("Payment Method")}</h3>
                {!paymentMethod ? (
                  <PaymentGatewaySelector
                    amount={selectedAmount || 0}
                    currency="GBP"
                    onPaymentMethodSelect={handlePaymentMethodSelect}
                    selectedMethod={paymentMethod}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span>{t("Payment Method")}: {paymentMethod}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPaymentMethod('')}
                      >
                        {t("Change")}
                      </Button>
                    </div>

                    <MultiPaymentProcessor
                      amount={selectedAmount || 0}
                      currency="GBP"
                      paymentMethod={paymentMethod}
                      commissionPeriodIds={[]}
                      vendorId={0}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
{t("Cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center">
              {t("Error")}
            </DialogTitle>
            <DialogDescription className="text-black font-medium">
              {t("Failed to add product to cart. Please log in.")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowLoginPrompt(false)}
              data-testid="button-cancel-login"
            >
              {t("Cancel")}
            </Button>
            <Button 
              onClick={() => {
                setShowLoginPrompt(false);
                setLocation('/auth');
              }}
              data-testid="button-login"
              className="bg-black hover:bg-gray-800 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {t("Login")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Amount Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-6 w-6" />
              {t("Custom Amount")}
            </DialogTitle>
            <DialogDescription>
              {t("Minimum €5")} - {t("Maximum €10,000")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="customAmount" className="text-left text-blue-600">{t("Custom Amount")}</Label>
              <Input
                id="customAmount"
                type="number"
                min="5"
                max="10000"
                step="1"
                value={customAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomAmount(value);
                  
                  // Validate amount range
                  const amount = parseFloat(value);
                  if (value && (amount < 5 || amount > 10000)) {
                    setCustomAmountError('Amount must be between £5 and £10,000');
                  } else {
                    setCustomAmountError('');
                  }
                }}
                placeholder={t("Enter amount")}
                className="text-left border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 text-blue-600 focus:outline-none focus:ring-0 focus:border-0"
                data-testid="input-custom-amount"
              />
              {customAmountError && (
                <p className="text-red-500 text-sm mt-1">{customAmountError}</p>
              )}
            </div>
            
            <Alert>
              <Gift className="h-4 w-4" />
              <AlertDescription>
                Minimum: £5 | Maximum: £10,000
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCustomDialog(false);
                setCustomAmount('');
              }}
            >
{t("Cancel")}
            </Button>
            <Button 
              onClick={handleCustomAmountSubmit}
              disabled={!customAmount || parseFloat(customAmount) < 5 || parseFloat(customAmount) > 10000 || !!customAmountError}
              data-testid="button-submit-custom-amount"
            >
              {t("Continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
    </>
  );
}