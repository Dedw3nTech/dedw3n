import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  MapPin, 
  User, 
  Mail, 
  Phone,
  Loader2,
  Lock,
  Check
} from "lucide-react";

interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    images: string[];
    description: string;
  };
}

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  specialInstructions?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Checkout Form Component with Stripe
const CheckoutForm = ({ total, cartItems, shippingInfo, onOrderComplete }: {
  total: number;
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
  onOrderComplete: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/order-confirmation',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your order has been placed successfully!",
        });
        onOrderComplete();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Complete Order - ${formatPrice(total)}`
        )}
      </Button>
    </form>
  );
};

export default function CheckoutNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedCurrency, formatPrice } = useCurrency();
  
  const [currentStep, setCurrentStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United Kingdom',
    specialInstructions: ''
  });
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  // Fetch cart items
  const { data: cartItems = [], isLoading: isCartLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: !!user,
  });

  // Auto-fill form when user data is available
  useEffect(() => {
    if (user && !isAutoFilled) {
      const hasShippingData = user.shippingFirstName || user.shippingAddress;
      
      if (hasShippingData) {
        setShippingInfo({
          firstName: user.shippingFirstName || user.name?.split(' ')[0] || '',
          lastName: user.shippingLastName || user.name?.split(' ')[1] || '',
          email: user.email || '',
          phone: user.shippingPhone || '',
          address: user.shippingAddress || '',
          city: user.shippingCity || '',
          state: user.shippingState || '',
          zipCode: user.shippingZipCode || '',
          country: user.shippingCountry || 'United Kingdom',
          specialInstructions: user.shippingSpecialInstructions || ''
        });
        setIsAutoFilled(true);
      } else {
        // Fill with basic user info if no shipping data
        setShippingInfo({
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ')[1] || '',
          email: user.email || '',
          phone: '',
          address: '',
          city: user.city || '',
          state: '',
          zipCode: '',
          country: user.country || 'United Kingdom',
          specialInstructions: ''
        });
        setIsAutoFilled(true);
      }
    }
  }, [user, isAutoFilled]);

  // Manual auto-fill function for button
  const autoFillShippingInfo = () => {
    if (user) {
      const hasShippingData = user.shippingFirstName || user.shippingAddress;
      
      if (hasShippingData) {
        setShippingInfo({
          firstName: user.shippingFirstName || user.name?.split(' ')[0] || '',
          lastName: user.shippingLastName || user.name?.split(' ')[1] || '',
          email: user.email || '',
          phone: user.shippingPhone || '',
          address: user.shippingAddress || '',
          city: user.shippingCity || '',
          state: user.shippingState || '',
          zipCode: user.shippingZipCode || '',
          country: user.shippingCountry || 'United Kingdom',
          specialInstructions: user.shippingSpecialInstructions || ''
        });
        setIsAutoFilled(true);
        toast({
          title: "Address auto-filled",
          description: "Your saved shipping information has been loaded",
        });
      } else {
        // Fill with basic user info if no shipping data
        setShippingInfo({
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ')[1] || '',
          email: user.email || '',
          phone: '',
          address: '',
          city: user.city || '',
          state: '',
          zipCode: '',
          country: user.country || 'United Kingdom',
          specialInstructions: ''
        });
        toast({
          title: "Basic info auto-filled",
          description: "Name and email filled from profile. Complete shipping details in Profile Settings for full auto-fill.",
          variant: "default",
        });
      }
    }
  };

  // Payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Secure payment with Visa, Mastercard, Amex'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">P</div>,
      description: 'Pay with your PayPal account or card'
    }
  ];

  // Direct calculation matching shopping cart method
  const subtotal = Array.isArray(cartItems) 
    ? cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) 
    : 0;
  
  const freeShippingThreshold = 50;
  const shippingCost = subtotal >= freeShippingThreshold ? 0 : 5.99;
  const taxRate = 0.2; // 20% VAT
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  // Handle shipping form changes
  const handleShippingChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  // Validate shipping form
  const isShippingValid = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
    return required.every(field => shippingInfo[field as keyof ShippingInfo]?.trim() !== '');
  };

  // Create payment intent when proceeding to payment
  useEffect(() => {
    if (currentStep === 'payment' && total > 0 && !clientSecret) {
      const createPaymentIntent = async () => {
        try {
          const response = await apiRequest('POST', '/api/create-payment-intent', { 
            amount: total 
          });
          const data = await response.json();
          setClientSecret(data.clientSecret);
        } catch (error) {
          toast({
            title: "Payment Setup Failed",
            description: "Unable to initialize payment. Please try again.",
            variant: "destructive",
          });
          setCurrentStep('shipping');
        }
      };
      createPaymentIntent();
    }
  }, [currentStep, total, clientSecret]);

  // Process order
  const processOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest('POST', '/api/orders', orderData);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Order Placed Successfully",
        description: `Order #${response.id} has been created. You will receive a confirmation email shortly.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      setLocation(`/order-confirmation/${response.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "There was an error processing your order.",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = async () => {
    if (!isShippingValid()) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required shipping details.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const orderData = {
      items: cartItems.map((item: CartItem) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      })),
      shippingInfo,
      paymentMethod: selectedPaymentMethod,
      subtotal,
      shipping: shippingCost,
      tax,
      total
    };

    try {
      await processOrderMutation.mutateAsync(orderData);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading if cart is loading
  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect if cart is empty
  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
          <Button onClick={() => setLocation('/')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/cart')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {['shipping', 'payment', 'review'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step ? 'bg-black text-white' :
                  ['shipping', 'payment', 'review'].indexOf(currentStep) > index ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {['shipping', 'payment', 'review'].indexOf(currentStep) > index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="ml-2 text-sm font-medium capitalize text-gray-700">
                  {step}
                </span>
                {index < 2 && (
                  <div className="w-8 h-px bg-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Shipping Information */}
            {currentStep === 'shipping' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Truck className="h-5 w-5 mr-2" />
                      Shipping Information
                    </div>
                    {isAutoFilled && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Auto-filled from Profile
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={shippingInfo.firstName}
                        onChange={(e) => handleShippingChange('firstName', e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={shippingInfo.lastName}
                        onChange={(e) => handleShippingChange('lastName', e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => handleShippingChange('email', e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => handleShippingChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={shippingInfo.address}
                      onChange={(e) => handleShippingChange('address', e.target.value)}
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={shippingInfo.city}
                        onChange={(e) => handleShippingChange('city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/County *</Label>
                      <Input
                        id="state"
                        value={shippingInfo.state}
                        onChange={(e) => handleShippingChange('state', e.target.value)}
                        placeholder="Enter state/county"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Postal Code *</Label>
                      <Input
                        id="zipCode"
                        value={shippingInfo.zipCode}
                        onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                        placeholder="Enter postal code"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select 
                      value={shippingInfo.country} 
                      onValueChange={(value) => handleShippingChange('country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                        <SelectItem value="Albania">Albania</SelectItem>
                        <SelectItem value="Algeria">Algeria</SelectItem>
                        <SelectItem value="Andorra">Andorra</SelectItem>
                        <SelectItem value="Angola">Angola</SelectItem>
                        <SelectItem value="Antigua and Barbuda">Antigua and Barbuda</SelectItem>
                        <SelectItem value="Argentina">Argentina</SelectItem>
                        <SelectItem value="Armenia">Armenia</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                        <SelectItem value="Austria">Austria</SelectItem>
                        <SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
                        <SelectItem value="Bahamas">Bahamas</SelectItem>
                        <SelectItem value="Bahrain">Bahrain</SelectItem>
                        <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                        <SelectItem value="Barbados">Barbados</SelectItem>
                        <SelectItem value="Belarus">Belarus</SelectItem>
                        <SelectItem value="Belgium">Belgium</SelectItem>
                        <SelectItem value="Belize">Belize</SelectItem>
                        <SelectItem value="Benin">Benin</SelectItem>
                        <SelectItem value="Bhutan">Bhutan</SelectItem>
                        <SelectItem value="Bolivia">Bolivia</SelectItem>
                        <SelectItem value="Bosnia and Herzegovina">Bosnia and Herzegovina</SelectItem>
                        <SelectItem value="Botswana">Botswana</SelectItem>
                        <SelectItem value="Brazil">Brazil</SelectItem>
                        <SelectItem value="Brunei">Brunei</SelectItem>
                        <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                        <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                        <SelectItem value="Burundi">Burundi</SelectItem>
                        <SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
                        <SelectItem value="Cambodia">Cambodia</SelectItem>
                        <SelectItem value="Cameroon">Cameroon</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="Central African Republic">Central African Republic</SelectItem>
                        <SelectItem value="Chad">Chad</SelectItem>
                        <SelectItem value="Chile">Chile</SelectItem>
                        <SelectItem value="China">China</SelectItem>
                        <SelectItem value="Colombia">Colombia</SelectItem>
                        <SelectItem value="Comoros">Comoros</SelectItem>
                        <SelectItem value="Congo">Congo</SelectItem>
                        <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                        <SelectItem value="Croatia">Croatia</SelectItem>
                        <SelectItem value="Cuba">Cuba</SelectItem>
                        <SelectItem value="Cyprus">Cyprus</SelectItem>
                        <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                        <SelectItem value="Democratic Republic of the Congo">Democratic Republic of the Congo</SelectItem>
                        <SelectItem value="Denmark">Denmark</SelectItem>
                        <SelectItem value="Djibouti">Djibouti</SelectItem>
                        <SelectItem value="Dominica">Dominica</SelectItem>
                        <SelectItem value="Dominican Republic">Dominican Republic</SelectItem>
                        <SelectItem value="Ecuador">Ecuador</SelectItem>
                        <SelectItem value="Egypt">Egypt</SelectItem>
                        <SelectItem value="El Salvador">El Salvador</SelectItem>
                        <SelectItem value="Equatorial Guinea">Equatorial Guinea</SelectItem>
                        <SelectItem value="Eritrea">Eritrea</SelectItem>
                        <SelectItem value="Estonia">Estonia</SelectItem>
                        <SelectItem value="Eswatini">Eswatini</SelectItem>
                        <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                        <SelectItem value="Fiji">Fiji</SelectItem>
                        <SelectItem value="Finland">Finland</SelectItem>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Gabon">Gabon</SelectItem>
                        <SelectItem value="Gambia">Gambia</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Germany">Germany</SelectItem>
                        <SelectItem value="Ghana">Ghana</SelectItem>
                        <SelectItem value="Greece">Greece</SelectItem>
                        <SelectItem value="Grenada">Grenada</SelectItem>
                        <SelectItem value="Guatemala">Guatemala</SelectItem>
                        <SelectItem value="Guinea">Guinea</SelectItem>
                        <SelectItem value="Guinea-Bissau">Guinea-Bissau</SelectItem>
                        <SelectItem value="Guyana">Guyana</SelectItem>
                        <SelectItem value="Haiti">Haiti</SelectItem>
                        <SelectItem value="Honduras">Honduras</SelectItem>
                        <SelectItem value="Hungary">Hungary</SelectItem>
                        <SelectItem value="Iceland">Iceland</SelectItem>
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="Indonesia">Indonesia</SelectItem>
                        <SelectItem value="Iran">Iran</SelectItem>
                        <SelectItem value="Iraq">Iraq</SelectItem>
                        <SelectItem value="Ireland">Ireland</SelectItem>
                        <SelectItem value="Israel">Israel</SelectItem>
                        <SelectItem value="Italy">Italy</SelectItem>
                        <SelectItem value="Ivory Coast">Ivory Coast</SelectItem>
                        <SelectItem value="Jamaica">Jamaica</SelectItem>
                        <SelectItem value="Japan">Japan</SelectItem>
                        <SelectItem value="Jordan">Jordan</SelectItem>
                        <SelectItem value="Kazakhstan">Kazakhstan</SelectItem>
                        <SelectItem value="Kenya">Kenya</SelectItem>
                        <SelectItem value="Kiribati">Kiribati</SelectItem>
                        <SelectItem value="Kuwait">Kuwait</SelectItem>
                        <SelectItem value="Kyrgyzstan">Kyrgyzstan</SelectItem>
                        <SelectItem value="Laos">Laos</SelectItem>
                        <SelectItem value="Latvia">Latvia</SelectItem>
                        <SelectItem value="Lebanon">Lebanon</SelectItem>
                        <SelectItem value="Lesotho">Lesotho</SelectItem>
                        <SelectItem value="Liberia">Liberia</SelectItem>
                        <SelectItem value="Libya">Libya</SelectItem>
                        <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                        <SelectItem value="Lithuania">Lithuania</SelectItem>
                        <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                        <SelectItem value="Madagascar">Madagascar</SelectItem>
                        <SelectItem value="Malawi">Malawi</SelectItem>
                        <SelectItem value="Malaysia">Malaysia</SelectItem>
                        <SelectItem value="Maldives">Maldives</SelectItem>
                        <SelectItem value="Mali">Mali</SelectItem>
                        <SelectItem value="Malta">Malta</SelectItem>
                        <SelectItem value="Marshall Islands">Marshall Islands</SelectItem>
                        <SelectItem value="Mauritania">Mauritania</SelectItem>
                        <SelectItem value="Mauritius">Mauritius</SelectItem>
                        <SelectItem value="Mexico">Mexico</SelectItem>
                        <SelectItem value="Micronesia">Micronesia</SelectItem>
                        <SelectItem value="Moldova">Moldova</SelectItem>
                        <SelectItem value="Monaco">Monaco</SelectItem>
                        <SelectItem value="Mongolia">Mongolia</SelectItem>
                        <SelectItem value="Montenegro">Montenegro</SelectItem>
                        <SelectItem value="Morocco">Morocco</SelectItem>
                        <SelectItem value="Mozambique">Mozambique</SelectItem>
                        <SelectItem value="Myanmar">Myanmar</SelectItem>
                        <SelectItem value="Namibia">Namibia</SelectItem>
                        <SelectItem value="Nauru">Nauru</SelectItem>
                        <SelectItem value="Nepal">Nepal</SelectItem>
                        <SelectItem value="Netherlands">Netherlands</SelectItem>
                        <SelectItem value="New Zealand">New Zealand</SelectItem>
                        <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                        <SelectItem value="Niger">Niger</SelectItem>
                        <SelectItem value="Nigeria">Nigeria</SelectItem>
                        <SelectItem value="North Korea">North Korea</SelectItem>
                        <SelectItem value="North Macedonia">North Macedonia</SelectItem>
                        <SelectItem value="Norway">Norway</SelectItem>
                        <SelectItem value="Oman">Oman</SelectItem>
                        <SelectItem value="Pakistan">Pakistan</SelectItem>
                        <SelectItem value="Palau">Palau</SelectItem>
                        <SelectItem value="Palestine">Palestine</SelectItem>
                        <SelectItem value="Panama">Panama</SelectItem>
                        <SelectItem value="Papua New Guinea">Papua New Guinea</SelectItem>
                        <SelectItem value="Paraguay">Paraguay</SelectItem>
                        <SelectItem value="Peru">Peru</SelectItem>
                        <SelectItem value="Philippines">Philippines</SelectItem>
                        <SelectItem value="Poland">Poland</SelectItem>
                        <SelectItem value="Portugal">Portugal</SelectItem>
                        <SelectItem value="Qatar">Qatar</SelectItem>
                        <SelectItem value="Romania">Romania</SelectItem>
                        <SelectItem value="Russia">Russia</SelectItem>
                        <SelectItem value="Rwanda">Rwanda</SelectItem>
                        <SelectItem value="Saint Kitts and Nevis">Saint Kitts and Nevis</SelectItem>
                        <SelectItem value="Saint Lucia">Saint Lucia</SelectItem>
                        <SelectItem value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</SelectItem>
                        <SelectItem value="Samoa">Samoa</SelectItem>
                        <SelectItem value="San Marino">San Marino</SelectItem>
                        <SelectItem value="Sao Tome and Principe">Sao Tome and Principe</SelectItem>
                        <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                        <SelectItem value="Senegal">Senegal</SelectItem>
                        <SelectItem value="Serbia">Serbia</SelectItem>
                        <SelectItem value="Seychelles">Seychelles</SelectItem>
                        <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                        <SelectItem value="Singapore">Singapore</SelectItem>
                        <SelectItem value="Slovakia">Slovakia</SelectItem>
                        <SelectItem value="Slovenia">Slovenia</SelectItem>
                        <SelectItem value="Solomon Islands">Solomon Islands</SelectItem>
                        <SelectItem value="Somalia">Somalia</SelectItem>
                        <SelectItem value="South Africa">South Africa</SelectItem>
                        <SelectItem value="South Korea">South Korea</SelectItem>
                        <SelectItem value="South Sudan">South Sudan</SelectItem>
                        <SelectItem value="Spain">Spain</SelectItem>
                        <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                        <SelectItem value="Sudan">Sudan</SelectItem>
                        <SelectItem value="Suriname">Suriname</SelectItem>
                        <SelectItem value="Sweden">Sweden</SelectItem>
                        <SelectItem value="Switzerland">Switzerland</SelectItem>
                        <SelectItem value="Syria">Syria</SelectItem>
                        <SelectItem value="Taiwan">Taiwan</SelectItem>
                        <SelectItem value="Tajikistan">Tajikistan</SelectItem>
                        <SelectItem value="Tanzania">Tanzania</SelectItem>
                        <SelectItem value="Thailand">Thailand</SelectItem>
                        <SelectItem value="Timor-Leste">Timor-Leste</SelectItem>
                        <SelectItem value="Togo">Togo</SelectItem>
                        <SelectItem value="Tonga">Tonga</SelectItem>
                        <SelectItem value="Trinidad and Tobago">Trinidad and Tobago</SelectItem>
                        <SelectItem value="Tunisia">Tunisia</SelectItem>
                        <SelectItem value="Turkey">Turkey</SelectItem>
                        <SelectItem value="Turkmenistan">Turkmenistan</SelectItem>
                        <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                        <SelectItem value="Uganda">Uganda</SelectItem>
                        <SelectItem value="Ukraine">Ukraine</SelectItem>
                        <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Uruguay">Uruguay</SelectItem>
                        <SelectItem value="Uzbekistan">Uzbekistan</SelectItem>
                        <SelectItem value="Vanuatu">Vanuatu</SelectItem>
                        <SelectItem value="Vatican City">Vatican City</SelectItem>
                        <SelectItem value="Venezuela">Venezuela</SelectItem>
                        <SelectItem value="Vietnam">Vietnam</SelectItem>
                        <SelectItem value="Yemen">Yemen</SelectItem>
                        <SelectItem value="Zambia">Zambia</SelectItem>
                        <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                    <Textarea
                      id="specialInstructions"
                      value={shippingInfo.specialInstructions}
                      onChange={(e) => handleShippingChange('specialInstructions', e.target.value)}
                      placeholder="Any special delivery instructions..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setCurrentStep('payment')}
                      disabled={!isShippingValid()}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            {currentStep === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!clientSecret ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Setting up payment...
                    </div>
                  ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm 
                        total={total}
                        cartItems={cartItems}
                        shippingInfo={shippingInfo}
                        onOrderComplete={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
                          setLocation('/order-confirmation');
                        }}
                      />
                    </Elements>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-800 font-medium">
                        Your payment information is secure and encrypted
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep('shipping')}
                    >
                      Back to Shipping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Review */}
            {currentStep === 'review' && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Shipping Details */}
                  <div>
                    <h4 className="font-semibold mb-2">Shipping Address</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{shippingInfo.firstName} {shippingInfo.lastName}</p>
                      <p>{shippingInfo.address}</p>
                      <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                      <p>{shippingInfo.country}</p>
                      <p>{shippingInfo.email} • {shippingInfo.phone}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Method */}
                  <div>
                    <h4 className="font-semibold mb-2">Payment Method</h4>
                    <p className="text-sm text-gray-600">
                      {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                    </p>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div>
                    <h4 className="font-semibold mb-4">Order Items</h4>
                    <div className="space-y-3">
                      {cartItems.map((item: CartItem) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0">
                            {item.product.images?.[0] && (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.product.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep('payment')}
                    >
                      Back to Payment
                    </Button>
                    <Button 
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Place Order - ${formatPrice(total)}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {Array.isArray(cartItems) && cartItems.map((item: CartItem) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="truncate">
                        {item.product.name} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatPrice(shippingCost)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (VAT)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                {subtotal < freeShippingThreshold && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      Add {formatPrice(freeShippingThreshold - subtotal)} more for free shipping!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}