import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calculator, Upload, Plus, X, Truck, MapPin, Package, Shield } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useMasterTranslation } from "@/hooks/use-master-translation";

export type CustomCarrier = {
  id: string;
  name: string;
  logo?: string;
  baseRate: number;
  perKgRate: number;
  perKmRate: number;
  freeThreshold: number;
  maxWeight: number;
  zones: string[];
  deliveryDays: {
    local: number;
    national: number;
    international: number;
  };
  services: {
    tracking: boolean;
    insurance: boolean;
    pickup: boolean;
  };
};

export type ShippingCalculation = {
  carrierId: string;
  carrierName: string;
  logo?: string;
  baseCost: number;
  weightCost: number;
  distanceCost: number;
  totalCost: number;
  estimatedDays: number;
  isFree: boolean;
  services: string[];
  deliveryType: 'local' | 'national' | 'international';
};

interface ShippingCostCalculatorProps {
  orderTotal: number;
  orderWeight: number;
  distance: number;
  onCalculationComplete: (calculation: ShippingCalculation | null, cost: number) => void;
  selectedCalculation: ShippingCalculation | null;
}

export default function ShippingCostCalculator({ 
  orderTotal, 
  orderWeight, 
  distance,
  onCalculationComplete, 
  selectedCalculation 
}: ShippingCostCalculatorProps) {
  const [customCarriers, setCustomCarriers] = useState<CustomCarrier[]>([]);
  const [calculations, setCalculations] = useState<ShippingCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCarrierForm, setShowCarrierForm] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'local' | 'national' | 'international'>('local');
  const [vendorCountry, setVendorCountry] = useState<string>('');
  const [vendorCity, setVendorCity] = useState<string>('');
  const [customerCountry, setCustomerCountry] = useState<string>('');
  const [customerCity, setCustomerCity] = useState<string>('');
  const [newCarrier, setNewCarrier] = useState<Partial<CustomCarrier>>({
    name: '',
    baseRate: 0,
    perKgRate: 0,
    perKmRate: 0,
    freeThreshold: 0,
    maxWeight: 50,
    zones: ['Zone 1'],
    deliveryDays: { local: 2, national: 5, international: 10 },
    services: { tracking: false, insurance: false, pickup: false }
  });
  
  const { formatPrice } = useCurrency();
  const { translateText } = useMasterTranslation();

  // Handle escrow payment integration
  const handleEscrowPayment = async () => {
    try {
      // Calculate total transaction amount including shipping
      const selectedShipping = calculations.find(calc => calc.carrierId === selectedCalculation?.carrierId);
      const shippingCost = selectedShipping?.cost || 0;
      const totalAmount = orderTotal + shippingCost;

      // Create escrow transaction via API
      const escrowData = {
        amount: totalAmount,
        currency: 'USD', // This should come from currency context
        description: `Marketplace transaction - Order total: ${formatPrice(orderTotal)}, Shipping: ${formatPrice(shippingCost)}`,
        buyerEmail: '', // This should come from user data
        sellerEmail: '', // This should come from vendor data
        items: [
          {
            title: 'Marketplace Purchase',
            description: 'Product purchase with shipping',
            quantity: 1,
            price: totalAmount
          }
        ]
      };

      // Call escrow API endpoint
      const response = await fetch('/api/escrow/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(escrowData)
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to escrow payment page
        window.open(result.escrowUrl, '_blank');
      } else {
        console.error('Failed to create escrow transaction');
      }
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
    }
  };

  // Auto-fetch vendor and customer location data from account settings
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        // Fetch current user data for both vendor and customer locations
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          
          // Set vendor location (same as current user for marketplace vendors)
          if (userData.country) setVendorCountry(userData.country);
          if (userData.city) setVendorCity(userData.city);
          
          // Set customer location (current user as customer)
          if (userData.country) setCustomerCountry(userData.country);
          if (userData.city) setCustomerCity(userData.city);
        }
      } catch (error) {
        console.warn('Could not fetch location data:', error);
      }
    };

    fetchLocationData();
  }, []);

  // Initialize with default carriers
  useEffect(() => {
    const defaultCarriers: CustomCarrier[] = [
      {
        id: 'fedex-custom',
        name: 'FedEx Custom',
        baseRate: 8.99,
        perKgRate: 2.50,
        perKmRate: 0.15,
        freeThreshold: 75,
        maxWeight: 68,
        zones: ['Zone 1', 'Zone 2', 'Zone 3'],
        deliveryDays: { local: 1, national: 3, international: 7 },
        services: { tracking: true, insurance: true, pickup: true }
      },
      {
        id: 'ups-custom',
        name: 'UPS Custom',
        baseRate: 7.99,
        perKgRate: 2.25,
        perKmRate: 0.12,
        freeThreshold: 60,
        maxWeight: 70,
        zones: ['Zone 1', 'Zone 2'],
        deliveryDays: { local: 2, national: 4, international: 8 },
        services: { tracking: true, insurance: false, pickup: true }
      }
    ];
    setCustomCarriers(defaultCarriers);
  }, []);

  // Calculate shipping costs when parameters change
  useEffect(() => {
    if (customCarriers.length > 0) {
      calculateShippingCosts();
    }
  }, [customCarriers, orderTotal, orderWeight, distance, deliveryType, vendorCountry, vendorCity, customerCountry, customerCity]);

  const calculateShippingCosts = () => {
    setLoading(true);
    setError(null);

    try {
      const newCalculations: ShippingCalculation[] = customCarriers.map(carrier => {
        // Check weight limit
        if (orderWeight > carrier.maxWeight) {
          return null;
        }

        // Calculate base cost
        const baseCost = carrier.baseRate;
        
        // Calculate weight-based cost
        const weightCost = orderWeight * carrier.perKgRate;
        
        // Calculate distance-based cost
        const distanceCost = distance * carrier.perKmRate;
        
        // Calculate total before free shipping check
        const subtotal = baseCost + weightCost + distanceCost;
        
        // Check for free shipping
        const isFree = orderTotal >= carrier.freeThreshold;
        const totalCost = isFree ? 0 : subtotal;
        
        // Get estimated delivery days based on type
        const estimatedDays = carrier.deliveryDays[deliveryType];
        
        // Build services array
        const services: string[] = [];
        if (carrier.services.tracking) services.push('Tracking');
        if (carrier.services.insurance) services.push('Insurance');
        if (carrier.services.pickup) services.push('Pickup');

        return {
          carrierId: carrier.id,
          carrierName: carrier.name,
          logo: carrier.logo,
          baseCost,
          weightCost,
          distanceCost,
          totalCost,
          estimatedDays,
          isFree,
          services,
          deliveryType
        };
      }).filter(Boolean) as ShippingCalculation[];

      setCalculations(newCalculations);
      setLoading(false);
    } catch (err) {
      setError('Failed to calculate shipping costs');
      setLoading(false);
    }
  };

  const addCustomCarrier = () => {
    if (!newCarrier.name || newCarrier.baseRate === undefined) {
      setError('Please fill in required carrier information');
      return;
    }

    const carrier: CustomCarrier = {
      id: `custom-${Date.now()}`,
      name: newCarrier.name,
      logo: newCarrier.logo,
      baseRate: newCarrier.baseRate || 0,
      perKgRate: newCarrier.perKgRate || 0,
      perKmRate: newCarrier.perKmRate || 0,
      freeThreshold: newCarrier.freeThreshold || 0,
      maxWeight: newCarrier.maxWeight || 50,
      zones: newCarrier.zones || ['Zone 1'],
      deliveryDays: newCarrier.deliveryDays || { local: 2, national: 5, international: 10 },
      services: newCarrier.services || { tracking: false, insurance: false, pickup: false }
    };

    setCustomCarriers(prev => [...prev, carrier]);
    setNewCarrier({
      name: '',
      baseRate: 0,
      perKgRate: 0,
      perKmRate: 0,
      freeThreshold: 0,
      maxWeight: 50,
      zones: ['Zone 1'],
      deliveryDays: { local: 2, national: 5, international: 10 },
      services: { tracking: false, insurance: false, pickup: false }
    });
    setShowCarrierForm(false);
    setError(null);
  };

  const removeCarrier = (carrierId: string) => {
    setCustomCarriers(prev => prev.filter(c => c.id !== carrierId));
    if (selectedCalculation?.carrierId === carrierId) {
      onCalculationComplete(null, 0);
    }
  };

  const selectCalculation = (calculation: ShippingCalculation) => {
    onCalculationComplete(calculation, calculation.totalCost);
  };

  const importCarriers = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          setCustomCarriers(prev => [...prev, ...imported]);
          setError(null);
        } else {
          setError('Invalid carrier data format');
        }
      } catch (err) {
        setError('Failed to import carrier data');
      }
    };
    reader.readAsText(file);
  };

  const exportCarriers = () => {
    const dataStr = JSON.stringify(customCarriers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shipping-carriers.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {translateText('Shipping Cost Calculator')}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCarrierForm(!showCarrierForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {translateText('Add Carrier')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCarriers}
              disabled={customCarriers.length === 0}
            >
              <Upload className="h-4 w-4 mr-1" />
              {translateText('Export')}
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importCarriers}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                {translateText('Import')}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Calculation Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-sm font-medium">{translateText('Order Total')}</Label>
            <div className="text-lg font-semibold">{formatPrice(orderTotal)}</div>
          </div>
          <div>
            <Label className="text-sm font-medium">{translateText('Weight')}</Label>
            <div className="text-lg font-semibold">{orderWeight} kg</div>
          </div>
          <div>
            <Label className="text-sm font-medium">{translateText('Distance')}</Label>
            <div className="text-lg font-semibold">{distance} km</div>
          </div>
          <div>
            <Label className="text-sm font-medium">{translateText('Delivery Type')}</Label>
            <Select value={deliveryType} onValueChange={(value: any) => setDeliveryType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">{translateText('Local')}</SelectItem>
                <SelectItem value="national">{translateText('National')}</SelectItem>
                <SelectItem value="international">{translateText('International')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add Carrier Form */}
        {showCarrierForm && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Location Fields */}
                <div>
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    {translateText("Vendor's Country")}
                    <Badge variant="secondary" className="text-xs">Auto-fetch</Badge>
                  </Label>
                  <Input
                    value={vendorCountry}
                    onChange={(e) => setVendorCountry(e.target.value)}
                    placeholder="Auto-fetched from account settings"
                    className="bg-gray-50 border-green-200"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    {translateText("Vendor's City")}
                    <Badge variant="secondary" className="text-xs">Auto-fetch</Badge>
                  </Label>
                  <Input
                    value={vendorCity}
                    onChange={(e) => setVendorCity(e.target.value)}
                    placeholder="Auto-fetched from account settings"
                    className="bg-gray-50 border-green-200"
                  />
                </div>
                
                {/* Customer Location Fields */}
                <div>
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {translateText("Your Country")}
                    <Badge variant="outline" className="text-xs">Auto-fetch</Badge>
                  </Label>
                  <Input
                    value={customerCountry}
                    onChange={(e) => setCustomerCountry(e.target.value)}
                    placeholder="Auto-fetched from your profile"
                    className="bg-blue-50 border-blue-200"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {translateText("Your City")}
                    <Badge variant="outline" className="text-xs">Auto-fetch</Badge>
                  </Label>
                  <Input
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Auto-fetched from your profile"
                    className="bg-blue-50 border-blue-200"
                  />
                </div>
                
                {/* Carrier Details */}
                <div>
                  <Label>{translateText('Carrier Name')} *</Label>
                  <Input
                    value={newCarrier.name || ''}
                    onChange={(e) => setNewCarrier(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter carrier name"
                  />
                </div>
                <div>
                  <Label>{translateText('Base Rate')} *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCarrier.baseRate || ''}
                    onChange={(e) => setNewCarrier(prev => ({ ...prev, baseRate: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>{translateText('Per Kg Rate')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCarrier.perKgRate || ''}
                    onChange={(e) => setNewCarrier(prev => ({ ...prev, perKgRate: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>{translateText('Per Km Rate')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCarrier.perKmRate || ''}
                    onChange={(e) => setNewCarrier(prev => ({ ...prev, perKmRate: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>{translateText('Free Threshold')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCarrier.freeThreshold || ''}
                    onChange={(e) => setNewCarrier(prev => ({ ...prev, freeThreshold: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>{translateText('Max Weight (kg)')}</Label>
                  <Input
                    type="number"
                    value={newCarrier.maxWeight || ''}
                    onChange={(e) => setNewCarrier(prev => ({ ...prev, maxWeight: parseFloat(e.target.value) || 50 }))}
                    placeholder="50"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button onClick={addCustomCarrier}>
                  {translateText('Add Carrier')}
                </Button>
                <Button variant="outline" onClick={() => setShowCarrierForm(false)}>
                  {translateText('Cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{translateText('Calculating shipping costs...')}</span>
          </div>
        )}

        {/* Shipping Calculations */}
        {!loading && calculations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">{translateText('Shipping Options')}</h3>
            {calculations.map((calculation) => (
              <Card 
                key={calculation.carrierId}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCalculation?.carrierId === calculation.carrierId 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectCalculation(calculation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Truck className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{calculation.carrierName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {translateText(calculation.deliveryType)}
                          </Badge>
                          {calculation.isFree && (
                            <Badge className="text-xs bg-green-100 text-green-700">
                              {translateText('FREE')}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">{translateText('Base')}: </span>
                            {formatPrice(calculation.baseCost)}
                          </div>
                          <div>
                            <span className="font-medium">{translateText('Weight')}: </span>
                            {formatPrice(calculation.weightCost)}
                          </div>
                          <div>
                            <span className="font-medium">{translateText('Distance')}: </span>
                            {formatPrice(calculation.distanceCost)}
                          </div>
                          <div>
                            <span className="font-medium">{translateText('Days')}: </span>
                            {calculation.estimatedDays}
                          </div>
                        </div>
                        
                        {calculation.services.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {calculation.services.map((service) => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {service === 'Tracking' && <Package className="h-3 w-3 mr-1" />}
                                {service === 'Insurance' && <Shield className="h-3 w-3 mr-1" />}
                                {service === 'Pickup' && <MapPin className="h-3 w-3 mr-1" />}
                                {translateText(service)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {calculation.isFree ? (
                          <span className="text-green-600">{translateText('FREE')}</span>
                        ) : (
                          formatPrice(calculation.totalCost)
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCarrier(calculation.carrierId);
                        }}
                        className="mt-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No calculations message */}
        {!loading && calculations.length === 0 && customCarriers.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{translateText('No suitable shipping options available for current parameters')}</p>
          </div>
        )}

        {/* No carriers message */}
        {customCarriers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{translateText('Add carriers to calculate shipping costs')}</p>
          </div>
        )}

        {/* Escrow Payment Option */}
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-yellow-600" />
              {translateText('Secure Payment with Escrow')}
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {translateText('Recommended')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {translateText('Use Escrow.com for secure payment protection. Your payment is held safely until you receive and approve your purchase.')}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>{translateText('Buyer Protection')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>{translateText('Secure Transactions')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>{translateText('Dispute Resolution')}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm mb-1">{translateText('Would you like to use Escrow.com for this transaction?')}</h4>
                  <p className="text-xs text-gray-500">{translateText('Small fee applies based on transaction amount')}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-gray-300"
                  >
                    {translateText('No, Skip')}
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={handleEscrowPayment}
                  >
                    {translateText('Use Escrow')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}