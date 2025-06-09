import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Truck, Clock, AlertCircle, MapPin, Shield, Package, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useMasterTranslation } from "@/hooks/use-master-translation";

export type ShippingRate = {
  id: string;
  name: string;
  description: string;
  cost: number;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate: string;
  guaranteedDelivery: boolean;
  carrier: string;
  carrierId: string;
  carrierLogo: string;
  // Enhanced shipping properties
  deliveryScope: 'local' | 'national' | 'international';
  deliverySpeed: 'standard' | 'express' | 'overnight';
  costMethod: 'flat_rate' | 'weight_based' | 'distance_based';
  trackingIncluded: boolean;
  insuranceAvailable: boolean;
  pickupLocationAvailable: boolean;
  vendorLocation?: string;
  maxWeight?: number;
  zones?: string[];
};

interface CartShippingSelectorProps {
  orderTotal: number;
  onShippingMethodChange: (method: ShippingRate | null, cost: number) => void;
  selectedMethod: ShippingRate | null;
}

export default function CartShippingSelector({ 
  orderTotal, 
  onShippingMethodChange, 
  selectedMethod 
}: CartShippingSelectorProps) {
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatPriceFromGBP } = useCurrency();
  const { translateText } = useMasterTranslation();

  useEffect(() => {
    const fetchShippingRates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Default destination for rate calculation
        const destination = {
          country: "US",
          postalCode: "10001",
          state: "NY", 
          city: "New York"
        };
        
        // Fetch shipping rates from all carriers
        const response = await apiRequest("POST", "/api/shipping/rates", {
          orderTotal,
          weight: 1.5, // Default weight estimate
          destination
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch shipping rates");
        }
        
        const rates = await response.json();
        setShippingRates(rates);
        
        // Auto-select cheapest rate if none selected
        if (rates.length > 0 && !selectedMethod) {
          const cheapestRate = rates[0]; // Rates are sorted by cost
          onShippingMethodChange(cheapestRate, cheapestRate.cost);
        }
        
      } catch (err: any) {
        console.error("Error fetching shipping rates:", err);
        setError("Could not load shipping options");
        
        // Fallback to basic shipping methods
        try {
          const fallbackResponse = await apiRequest("GET", "/api/shipping/methods");
          if (fallbackResponse.ok) {
            const fallbackMethods = await fallbackResponse.json();
            
            const convertedRates = fallbackMethods.slice(0, 3).map((method: any) => ({
              id: method.id,
              name: method.name,
              description: method.description,
              cost: orderTotal >= (method.freeShippingThreshold || 50) ? 0 : method.basePrice,
              estimatedDeliveryDays: method.description.includes("5-7") ? 7 : 
                                    method.description.includes("2-3") ? 3 : 1,
              estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              guaranteedDelivery: method.id === "overnight",
              carrier: "Standard",
              carrierId: "standard",
              carrierLogo: "",
              // Enhanced properties with defaults
              deliveryScope: method.id === "standard" ? "local" as const : 
                           method.id === "express" ? "national" as const : "international" as const,
              deliverySpeed: method.id === "overnight" ? "overnight" as const :
                           method.id === "express" ? "express" as const : "standard" as const,
              costMethod: "flat_rate" as const,
              trackingIncluded: method.id !== "standard",
              insuranceAvailable: method.id === "overnight",
              pickupLocationAvailable: false,
              vendorLocation: "Local Warehouse",
              maxWeight: 50,
              zones: ["Zone 1"]
            }));
            
            setShippingRates(convertedRates);
            setError(null);
            
            if (convertedRates.length > 0 && !selectedMethod) {
              onShippingMethodChange(convertedRates[0], convertedRates[0].cost);
            }
          }
        } catch (fallbackErr) {
          console.error("Fallback shipping methods failed:", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShippingRates();
  }, [orderTotal, selectedMethod, onShippingMethodChange]);

  const handleShippingSelect = (rateId: string) => {
    const selectedRate = shippingRates.find(rate => rate.id === rateId);
    if (selectedRate) {
      onShippingMethodChange(selectedRate, selectedRate.cost);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {translateText('Shipping Options')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {translateText('Loading shipping options...')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && shippingRates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {translateText('Shipping Options')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          {translateText('Select Shipping Method')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {translateText('Choose your preferred shipping option')}
        </p>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMethod?.id || ""}
          onValueChange={handleShippingSelect}
          className="space-y-3"
        >
          {shippingRates.map((rate) => {
            const isFree = rate.cost === 0;
            
            return (
              <div
                key={rate.id}
                className={`flex items-start justify-between p-3 border rounded-lg hover:border-primary transition-colors cursor-pointer ${
                  selectedMethod?.id === rate.id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => handleShippingSelect(rate.id)}
              >
                <div className="flex items-start gap-3 flex-1">
                  <RadioGroupItem value={rate.id} id={rate.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {rate.carrierLogo ? (
                        <img 
                          src={rate.carrierLogo} 
                          alt={rate.carrier} 
                          className="h-4 w-4 object-contain"
                        />
                      ) : (
                        <Truck className="h-4 w-4 text-primary" />
                      )}
                      <Label htmlFor={rate.id} className="font-medium cursor-pointer">
                        {rate.carrier} - {rate.name}
                      </Label>
                      
                      {/* Delivery Scope Badge */}
                      <Badge variant="outline" className={`text-xs ${
                        rate.deliveryScope === 'local' ? 'bg-green-50 text-green-700' :
                        rate.deliveryScope === 'national' ? 'bg-blue-50 text-blue-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        <MapPin className="h-3 w-3 mr-1" />
                        {translateText(rate.deliveryScope === 'local' ? 'Local' : 
                                     rate.deliveryScope === 'national' ? 'National' : 'International')}
                      </Badge>
                      
                      {/* Delivery Speed Badge */}
                      <Badge variant="outline" className={`text-xs ${
                        rate.deliverySpeed === 'overnight' ? 'bg-red-50 text-red-700' :
                        rate.deliverySpeed === 'express' ? 'bg-orange-50 text-orange-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        <Zap className="h-3 w-3 mr-1" />
                        {translateText(rate.deliverySpeed === 'overnight' ? 'Overnight' :
                                     rate.deliverySpeed === 'express' ? 'Express' : 'Standard')}
                      </Badge>
                      
                      {rate.guaranteedDelivery && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          {translateText('Guaranteed')}
                        </Badge>
                      )}
                      {isFree && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          {translateText('FREE')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{rate.description}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {rate.estimatedDeliveryDays} {rate.estimatedDeliveryDays === 1 ? translateText('day') : translateText('days')}
                          </span>
                        </div>
                        {rate.vendorLocation && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{translateText('From')}: {rate.vendorLocation}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Cost Method & Optional Features */}
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-xs">
                          {translateText(
                            rate.costMethod === 'flat_rate' ? 'Flat Rate' :
                            rate.costMethod === 'weight_based' ? 'Weight Based' : 'Distance Based'
                          )}
                        </Badge>
                        
                        {rate.trackingIncluded && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Package className="h-3 w-3" />
                            <span>{translateText('Tracking')}</span>
                          </div>
                        )}
                        
                        {rate.insuranceAvailable && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Shield className="h-3 w-3" />
                            <span>{translateText('Insurance')}</span>
                          </div>
                        )}
                        
                        {rate.pickupLocationAvailable && (
                          <div className="flex items-center gap-1 text-purple-600">
                            <MapPin className="h-3 w-3" />
                            <span>{translateText('Pickup')}</span>
                          </div>
                        )}
                      </div>
                      
                      {rate.maxWeight && (
                        <div className="text-xs text-muted-foreground">
                          {translateText('Max weight')}: {rate.maxWeight}kg
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="font-medium text-right">
                  {isFree ? (
                    <span className="text-green-600">{translateText('FREE')}</span>
                  ) : (
                    formatPriceFromGBP(rate.cost)
                  )}
                </div>
              </div>
            );
          })}
        </RadioGroup>
        
        {selectedMethod && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">
                {translateText('Selected')}: {selectedMethod.carrier} - {selectedMethod.name}
              </span>
              <span className="text-sm font-medium text-green-800">
                {selectedMethod.cost === 0 ? translateText('FREE') : formatPriceFromGBP(selectedMethod.cost)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}