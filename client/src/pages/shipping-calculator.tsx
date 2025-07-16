import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calculator, 
  Truck, 
  Plane, 
  Ship, 
  FileText, 
  MapPin, 
  Weight, 
  Package,
  DollarSign,
  Clock,
  Info
} from 'lucide-react';
import { useMasterTranslation } from '@/hooks/use-master-translation';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWeightUnit } from '@/contexts/WeightUnitContext';
import { useAuth } from '@/hooks/use-auth';

interface ShippingCalculation {
  shippingType: string;
  weight: number;
  distance: number;
  baseCost: number;
  weightMultiplier: number;
  typeMultiplier: number;
  totalCost: number;
  estimatedDays: string;
  carrier: string;
}

export default function ShippingCalculator() {
  const { translateText } = useMasterTranslation();
  const { formatPriceFromGBP } = useCurrency();
  const { formatWeight } = useWeightUnit();
  const { user } = useAuth();

  // Form state
  const [shippingType, setShippingType] = useState<string>('normal-freight');
  const [weight, setWeight] = useState<number>(1);
  const [originCountry, setOriginCountry] = useState<string>('DR Congo');
  const [destinationCountry, setDestinationCountry] = useState<string>('United Kingdom');
  const [originCity, setOriginCity] = useState<string>('Kinshasa');
  const [destinationCity, setDestinationCity] = useState<string>('London');

  // Calculate shipping cost
  const { data: shippingCalculation, isLoading } = useQuery({
    queryKey: ['/api/shipping/calculate', {
      shippingType,
      weight,
      originCountry,
      destinationCountry,
      originCity,
      destinationCity
    }],
    enabled: weight > 0 && originCountry && destinationCountry
  });

  const shippingTypes = [
    {
      value: 'normal-freight',
      label: translateText('Normal Freight'),
      icon: Truck,
      description: translateText('Standard ground shipping for regular deliveries'),
      estimatedTime: '7-14 days'
    },
    {
      value: 'air-freight',
      label: translateText('Air Freight'),
      icon: Plane,
      description: translateText('Fast air transportation for urgent deliveries'),
      estimatedTime: '2-5 days'
    },
    {
      value: 'sea-freight',
      label: translateText('Sea Freight'),
      icon: Ship,
      description: translateText('Economical ocean shipping for large shipments'),
      estimatedTime: '20-45 days'
    },
    {
      value: 'under-customs',
      label: translateText('Under Customs'),
      icon: FileText,
      description: translateText('Specialized customs handling and documentation'),
      estimatedTime: '3-10 days'
    }
  ];

  const countries = [
    'DR Congo', 'United Kingdom', 'United States', 'Canada', 'Germany', 
    'France', 'Belgium', 'Netherlands', 'South Africa', 'Kenya', 
    'Nigeria', 'Ghana', 'Morocco', 'Egypt', 'Australia', 'China', 
    'Japan', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Switzerland'
  ];

  const selectedTypeInfo = shippingTypes.find(type => type.value === shippingType);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-blue-600" />
          {translateText('Shipping Fee Calculator')}
        </h1>
        <p className="text-gray-600">
          {translateText('Calculate shipping costs for different freight types and destinations')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Shipping Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              {translateText('Shipment Details')}
            </CardTitle>
            <CardDescription>
              {translateText('Enter your shipping requirements to calculate costs')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Shipping Type Selection */}
            <div>
              <Label htmlFor="shipping-type">{translateText('Shipping Type')}</Label>
              <Select value={shippingType} onValueChange={setShippingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shippingTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedTypeInfo && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedTypeInfo.description}
                </p>
              )}
            </div>

            {/* Weight Input */}
            <div>
              <Label htmlFor="weight">{translateText('Total Weight')}</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder="1.0"
                />
                <div className="flex items-center text-sm text-gray-500 min-w-[40px]">
                  kg
                </div>
              </div>
            </div>

            {/* Origin Location */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="origin-country">{translateText('Origin Country')}</Label>
                <Select value={originCountry} onValueChange={setOriginCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="origin-city">{translateText('Origin City')}</Label>
                <Input
                  id="origin-city"
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  placeholder={translateText('Enter city')}
                />
              </div>
            </div>

            {/* Destination Location */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="destination-country">{translateText('Destination Country')}</Label>
                <Select value={destinationCountry} onValueChange={setDestinationCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="destination-city">{translateText('Destination City')}</Label>
                <Input
                  id="destination-city"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  placeholder={translateText('Enter city')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {translateText('Shipping Cost Calculation')}
            </CardTitle>
            <CardDescription>
              {translateText('Estimated shipping fees and delivery information')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : shippingCalculation ? (
              <div className="space-y-4">
                {/* Selected Method Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedTypeInfo && <selectedTypeInfo.icon className="h-5 w-5 text-blue-600" />}
                    <span className="font-medium text-blue-900">
                      {selectedTypeInfo?.label}
                    </span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{translateText('Estimated Delivery')}: {selectedTypeInfo?.estimatedTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{originCity}, {originCountry} → {destinationCity}, {destinationCountry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4" />
                      <span>{translateText('Weight')}: {formatWeight(weight)}</span>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">{translateText('Cost Breakdown')}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translateText('Base Cost')}:</span>
                      <span>{formatPriceFromGBP(shippingCalculation.baseCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translateText('Weight Factor')}:</span>
                      <span>×{shippingCalculation.weightMultiplier.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translateText('Type Factor')}:</span>
                      <span>×{shippingCalculation.typeMultiplier.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>{translateText('Total Shipping Cost')}:</span>
                      <span className="text-lg text-green-600">
                        {formatPriceFromGBP(shippingCalculation.totalCost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium mb-1">{translateText('Important Notes:')}</p>
                      <ul className="space-y-1 text-xs">
                        <li>• {translateText('Rates are estimates and may vary based on actual dimensions')}</li>
                        <li>• {translateText('Additional customs fees may apply for international shipments')}</li>
                        <li>• {translateText('Insurance and tracking services available separately')}</li>
                        <li>• {translateText('Delivery times may be affected by customs processing')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>{translateText('Enter shipment details to calculate costs')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{translateText('Shipping Methods Comparison')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {shippingTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div 
                  key={type.value}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    shippingType === type.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setShippingType(type.value)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{type.description}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{type.estimatedTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}