import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

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
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        const response = await apiRequest("GET", "/api/shipping/methods");
        const methods = await response.json();
        setShippingMethods(methods);
        
        // Select the first method by default
        if (methods.length > 0) {
          const defaultMethod = methods[0];
          handleShippingMethodSelect(defaultMethod.id);
        }
      } catch (err: any) {
        console.error("Error fetching shipping methods:", err);
        setError("Could not load shipping options. Please try again later.");
        
        // Fallback shipping methods for development
        const fallbackMethods = [
          {
            id: "standard",
            name: "Standard Shipping",
            description: "Delivery in 5-7 business days",
            basePrice: 4.99,
            freeShippingThreshold: 50
          },
          {
            id: "express",
            name: "Express Shipping",
            description: "Delivery in 2-3 business days",
            basePrice: 12.99,
            freeShippingThreshold: 100
          },
          {
            id: "overnight",
            name: "Overnight Shipping",
            description: "Next day delivery (order before 2pm)",
            basePrice: 24.99,
            freeShippingThreshold: 150
          }
        ];
        
        setShippingMethods(fallbackMethods);
        
        // Select the first fallback method by default
        handleShippingMethodSelect(fallbackMethods[0].id);
      } finally {
        setLoading(false);
      }
    };

    fetchShippingMethods();
  }, []);

  const calculateShippingCost = (method: ShippingMethod): number => {
    // Free shipping if order meets the threshold
    if (orderTotal >= method.freeShippingThreshold) {
      return 0;
    }
    return method.basePrice;
  };

  const handleShippingMethodSelect = (methodId: string) => {
    const selectedMethod = shippingMethods.find(method => method.id === methodId);
    if (selectedMethod) {
      const cost = calculateShippingCost(selectedMethod);
      setSelectedMethodId(methodId);
      onShippingMethodChange(selectedMethod, cost);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shipping Options</CardTitle>
          <CardDescription>Loading available shipping methods...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error && shippingMethods.length === 0) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Options</CardTitle>
        <CardDescription>Select your preferred shipping method</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMethodId || ""}
          onValueChange={handleShippingMethodSelect}
          className="space-y-4"
        >
          {shippingMethods.map((method) => {
            const shippingCost = calculateShippingCost(method);
            const isFree = shippingCost === 0;
            
            return (
              <div
                key={method.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors ${
                  selectedMethodId === method.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                  <div>
                    <Label htmlFor={method.id} className="font-medium text-base cursor-pointer">
                      {method.name}
                      {isFree && (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50">
                          FREE
                        </Badge>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                    {!isFree && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Free shipping on orders over {formatPrice(method.freeShippingThreshold)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="font-medium">
                  {isFree ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}