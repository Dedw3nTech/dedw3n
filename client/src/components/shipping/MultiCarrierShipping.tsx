import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Clock, Truck, CalendarCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type ShippingRate = {
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
};

type ShippingOptionsProps = {
  orderTotal: number;
  onShippingMethodChange: (method: ShippingRate, cost: number) => void;
};

export default function MultiCarrierShipping({ orderTotal, onShippingMethodChange }: ShippingOptionsProps) {
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [carrierRates, setCarrierRates] = useState<Record<string, ShippingRate[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("all");

  useEffect(() => {
    const fetchShippingRates = async () => {
      try {
        setLoading(true);
        
        // Get destination details (in a real app, this would come from the address form)
        const destination = {
          country: "US",
          postalCode: "90210",
          state: "CA",
          city: "Beverly Hills"
        };
        
        // Fetch all shipping rates from all carriers
        const response = await apiRequest("POST", "/api/shipping/rates", {
          orderTotal,
          weight: 1.5, // Default weight in kg
          destination
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch shipping rates");
        }
        
        const rates = await response.json();
        setShippingRates(rates);
        
        // Organize rates by carrier
        const ratesByCarrier: Record<string, ShippingRate[]> = {};
        rates.forEach((rate: ShippingRate) => {
          if (!ratesByCarrier[rate.carrierId]) {
            ratesByCarrier[rate.carrierId] = [];
          }
          ratesByCarrier[rate.carrierId].push(rate);
        });
        
        setCarrierRates(ratesByCarrier);
        
        // Select the cheapest rate by default
        if (rates.length > 0) {
          // Rates are already sorted by cost
          handleShippingRateSelect(rates[0].id);
        }
        
      } catch (err: any) {
        console.error("Error fetching shipping rates:", err);
        setError("Could not load shipping options. Please try again later.");
        
        // Try to fetch the legacy shipping methods as fallback
        try {
          const legacyResponse = await apiRequest("GET", "/api/shipping/methods");
          if (legacyResponse.ok) {
            const legacyMethods = await legacyResponse.json();
            
            // Convert legacy methods to the new format
            const convertedRates = legacyMethods.map((method: any) => ({
              id: method.id,
              name: method.name,
              description: method.description,
              cost: method.basePrice,
              estimatedDeliveryDays: method.description.includes("5-7") ? 7 : 
                                    method.description.includes("2-3") ? 3 : 1,
              estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              guaranteedDelivery: method.id === "overnight",
              carrier: "Standard",
              carrierId: "standard",
              carrierLogo: ""
            }));
            
            setShippingRates(convertedRates);
            
            // Create a single carrier for legacy methods
            setCarrierRates({
              standard: convertedRates
            });
            
            // Select the first method by default
            if (convertedRates.length > 0) {
              handleShippingRateSelect(convertedRates[0].id);
            }
          }
        } catch (fallbackErr) {
          console.error("Fallback shipping methods also failed:", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShippingRates();
  }, [orderTotal]);

  const handleShippingRateSelect = (rateId: string) => {
    const selectedRate = shippingRates.find(rate => rate.id === rateId);
    if (selectedRate) {
      setSelectedRateId(rateId);
      onShippingMethodChange(selectedRate, selectedRate.cost);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shipping Options</CardTitle>
          <CardDescription>Loading available shipping rates...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error && shippingRates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shipping Options</CardTitle>
          <CardDescription>An error occurred</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get unique carrier IDs
  const carriers = Object.keys(carrierRates);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Options</CardTitle>
        <CardDescription>Select your preferred shipping method from multiple carriers</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">All Carriers</TabsTrigger>
            {carriers.slice(0, 4).map(carrierId => (
              <TabsTrigger key={carrierId} value={carrierId}>
                {carrierId === "fedex" ? "FedEx" : 
                 carrierId === "ups" ? "UPS" : 
                 carrierId === "usps" ? "USPS" : 
                 carrierId === "dhl" ? "DHL" : 
                 carrierId === "standard" ? "Standard" : carrierId}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all">
            <RadioGroup
              value={selectedRateId || ""}
              onValueChange={handleShippingRateSelect}
              className="space-y-4"
            >
              {shippingRates.map((rate) => (
                <ShippingRateOption 
                  key={rate.id} 
                  rate={rate} 
                  isSelected={selectedRateId === rate.id} 
                />
              ))}
            </RadioGroup>
          </TabsContent>
          
          {carriers.map(carrierId => (
            <TabsContent key={carrierId} value={carrierId}>
              <RadioGroup
                value={selectedRateId || ""}
                onValueChange={handleShippingRateSelect}
                className="space-y-4"
              >
                {carrierRates[carrierId]?.map((rate) => (
                  <ShippingRateOption 
                    key={rate.id} 
                    rate={rate} 
                    isSelected={selectedRateId === rate.id} 
                  />
                ))}
              </RadioGroup>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Shipping times are estimates and may vary based on carrier availability and weather conditions.</p>
      </CardFooter>
    </Card>
  );
}

// Separate component for each shipping rate option
function ShippingRateOption({ rate, isSelected }: { rate: ShippingRate, isSelected: boolean }) {
  const isFree = rate.cost === 0;
  
  return (
    <div
      className={`flex items-start justify-between p-4 border rounded-lg hover:border-primary transition-colors ${
        isSelected ? "border-primary bg-primary/5" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <RadioGroupItem value={rate.id} id={rate.id} className="mt-1" />
        <div>
          <div className="flex items-center gap-2">
            {rate.carrierLogo ? (
              <img 
                src={rate.carrierLogo} 
                alt={rate.carrier} 
                className="h-5 w-5 object-contain"
              />
            ) : (
              <Truck className="h-4 w-4 text-primary" />
            )}
            <Label htmlFor={rate.id} className="font-medium text-base cursor-pointer">
              {rate.carrier} - {rate.name}
              {rate.guaranteedDelivery && (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 hover:bg-blue-50">
                  Guaranteed
                </Badge>
              )}
              {isFree && (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50">
                  FREE
                </Badge>
              )}
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">{rate.description}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{rate.estimatedDeliveryDays} {rate.estimatedDeliveryDays === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarCheck className="h-3 w-3" />
              <span>Est. delivery: {formatDeliveryDate(rate.estimatedDeliveryDate)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="font-medium">
        {isFree ? (
          <span className="text-green-600">FREE</span>
        ) : (
          formatPrice(rate.cost)
        )}
      </div>
    </div>
  );
}

// Format the delivery date to be more user-friendly
function formatDeliveryDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}