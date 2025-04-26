import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type ShippingMethod = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  freeShippingThreshold: number;
};

type ShippingOptionsProps = {
  orderTotal: number;
  onShippingMethodChange: (method: ShippingMethod, cost: number) => void;
};

export default function ShippingOptions({ orderTotal, onShippingMethodChange }: ShippingOptionsProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Fetch shipping methods
  const { data: shippingMethods, isLoading, error } = useQuery<ShippingMethod[]>({
    queryKey: ['/api/shipping/methods'],
  });

  // Calculate shipping cost when method or order total changes
  useEffect(() => {
    if (!selectedMethod || !shippingMethods) return;
    
    const method = shippingMethods.find(m => m.id === selectedMethod);
    if (!method) return;
    
    // Check for free shipping
    const cost = orderTotal >= method.freeShippingThreshold ? 0 : method.basePrice;
    setShippingCost(cost);
    
    // Notify parent component
    onShippingMethodChange(method, cost);
  }, [selectedMethod, orderTotal, shippingMethods, onShippingMethodChange]);

  // Set default shipping method when data is loaded
  useEffect(() => {
    if (shippingMethods && shippingMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(shippingMethods[0].id);
    }
  }, [shippingMethods, selectedMethod]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading shipping options. Please try again.
      </div>
    );
  }

  if (!shippingMethods || shippingMethods.length === 0) {
    return (
      <div className="text-amber-500 p-4">
        No shipping options available. Please try again later.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Shipping Method</h3>
        <RadioGroup
          value={selectedMethod || ""}
          onValueChange={setSelectedMethod}
          className="space-y-3"
        >
          {shippingMethods.map((method) => {
            const cost = orderTotal >= method.freeShippingThreshold ? 0 : method.basePrice;
            const isFree = cost === 0;
            
            return (
              <div 
                key={method.id} 
                className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                  selectedMethod === method.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={method.id} id={`shipping-${method.id}`} />
                  <div>
                    <Label htmlFor={`shipping-${method.id}`} className="text-base font-medium">
                      {method.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                    {isFree && orderTotal >= method.freeShippingThreshold && (
                      <span className="inline-block mt-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                        Free shipping on orders over {formatPrice(method.freeShippingThreshold)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-medium">
                  {isFree ? "FREE" : formatPrice(method.basePrice)}
                </span>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}