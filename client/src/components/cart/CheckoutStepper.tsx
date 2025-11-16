import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from './icons';
import { useCartTranslations } from '@/locales/cartStrings';
import { ShippingAddressForm } from './ShippingAddressForm';

interface CheckoutStepperProps {
  currentStep: number;
  shippingForm: any;
  onShippingFormChange: (field: string, value: any) => void;
  onContinueToPackaging: () => void;
  onContinueToPayment: () => void;
  isSavingAddress: boolean;
  packagingOption: 'signature-box' | 'signature-with-bag' | 'standard';
  onPackagingChange: (option: 'signature-box' | 'signature-with-bag' | 'standard') => void;
}

export const CheckoutStepper = memo(function CheckoutStepper({
  currentStep,
  shippingForm,
  onShippingFormChange,
  onContinueToPackaging,
  onContinueToPayment,
  isSavingAddress,
  packagingOption,
  onPackagingChange
}: CheckoutStepperProps) {
  const ts = useCartTranslations();

  return (
    <div className="space-y-6">
      {/* Step 1: Shipping Address */}
      <div className="border rounded-lg">
        <div className="border-b px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-semibold ${currentStep >= 1 ? 'bg-black' : 'bg-gray-300'}`}>
              1
            </div>
            <h2 className="text-lg font-semibold uppercase tracking-wide">{ts.shippingAddress}</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1 ml-11">{ts.deliverTo}</p>
        </div>
        
        <div className="p-6 space-y-4">
          <ShippingAddressForm formData={shippingForm} onChange={onShippingFormChange} />
          
          <Button 
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold uppercase" 
            data-testid="button-continue-packaging"
            onClick={onContinueToPackaging}
            disabled={isSavingAddress}
          >
            {isSavingAddress ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              ts.continueToPackaging
            )}
          </Button>
        </div>
      </div>

      {/* Step 2: Packaging Options */}
      <div className={`border rounded-lg ${currentStep < 2 ? 'opacity-60' : ''}`}>
        <div className="border-b px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-semibold ${currentStep >= 2 ? 'bg-black' : 'bg-gray-300'}`}>
              2
            </div>
            <h2 className="text-lg font-semibold uppercase tracking-wide">{ts.packagingOptions}</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1 ml-11">{ts.signatureBox}</p>
        </div>
        
        {currentStep >= 2 && (
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="packaging" 
                  value="signature-box"
                  checked={packagingOption === 'signature-box'}
                  onChange={() => onPackagingChange('signature-box')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Signature Box</div>
                  <div className="text-sm text-gray-600">Premium packaging with signature box</div>
                  <div className="text-sm font-semibold mt-1">Free</div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="packaging" 
                  value="signature-with-bag"
                  checked={packagingOption === 'signature-with-bag'}
                  onChange={() => onPackagingChange('signature-with-bag')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Signature Box + Boutique Shopping Bag</div>
                  <div className="text-sm text-gray-600">Premium packaging with signature box and boutique shopping bag</div>
                  <div className="text-sm font-semibold mt-1">Free</div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="packaging" 
                  value="standard"
                  checked={packagingOption === 'standard'}
                  onChange={() => onPackagingChange('standard')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Standard Packaging</div>
                  <div className="text-sm text-gray-600">Standard secure packaging</div>
                  <div className="text-sm font-semibold mt-1">Free</div>
                </div>
              </label>
            </div>
            
            <Button 
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold uppercase" 
              data-testid="button-continue-payment"
              onClick={onContinueToPayment}
            >
              Continue to Payment
            </Button>
          </div>
        )}
      </div>

      {/* Step 3: Payment */}
      <div className="border rounded-lg opacity-60">
        <div className="border-b px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-white text-sm font-semibold">
              3
            </div>
            <h2 className="text-lg font-semibold uppercase tracking-wide">{ts.payment}</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1 ml-11">{ts.paymentMethods}</p>
        </div>
      </div>
    </div>
  );
});
