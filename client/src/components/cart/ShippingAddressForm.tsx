import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCartTranslations } from '@/locales/cartStrings';

interface ShippingFormData {
  firstName: string;
  surname: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  city: string;
  postalCode: string;
  isBusinessAddress: boolean;
  phoneCode: string;
  phone: string;
  saveToAddressBook: boolean;
}

interface ShippingAddressFormProps {
  formData: ShippingFormData;
  onChange: (field: string, value: any) => void;
}

export const ShippingAddressForm = memo(function ShippingAddressForm({
  formData,
  onChange
}: ShippingAddressFormProps) {
  const ts = useCartTranslations();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-700 uppercase block mb-2">
            {ts.firstName}
          </label>
          <Input
            type="text"
            value={formData.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            placeholder={ts.firstName}
            data-testid="input-first-name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 uppercase block mb-2">
            {ts.surname}
          </label>
          <Input
            type="text"
            value={formData.surname}
            onChange={(e) => onChange('surname', e.target.value)}
            placeholder={ts.surname}
            data-testid="input-surname"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 uppercase block mb-2">
          {ts.addressLine1}
        </label>
        <Input
          type="text"
          value={formData.addressLine1}
          onChange={(e) => onChange('addressLine1', e.target.value)}
          placeholder={ts.addressLine1}
          data-testid="input-address-line1"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 uppercase block mb-2">
          ADDRESS LINE 2
        </label>
        <Input
          type="text"
          value={formData.addressLine2}
          onChange={(e) => onChange('addressLine2', e.target.value)}
          placeholder={ts.addressLine2}
          data-testid="input-address-line2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-700 uppercase block mb-2">
            {ts.countryRegion}
          </label>
          <Select value={formData.country} onValueChange={(value) => onChange('country', value)}>
            <SelectTrigger data-testid="select-country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Belgium">{ts.belgium}</SelectItem>
              <SelectItem value="United Kingdom">{ts.unitedKingdom}</SelectItem>
              <SelectItem value="France">{ts.france}</SelectItem>
              <SelectItem value="Germany">{ts.germany}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 uppercase block mb-2">
            {ts.city}
          </label>
          <Input
            type="text"
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder={ts.city}
            data-testid="input-city"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 uppercase block mb-2">
          {ts.postalCode}
        </label>
        <Input
          type="text"
          value={formData.postalCode}
          onChange={(e) => onChange('postalCode', e.target.value)}
          placeholder={ts.postalCode}
          data-testid="input-postal-code"
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isBusinessAddress}
            onChange={(e) => onChange('isBusinessAddress', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">{ts.businessAddress}</span>
        </label>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 uppercase block mb-2">
          {ts.mobile}
        </label>
        <p className="text-xs text-gray-600 mb-2">{ts.smsUpdates}</p>
        <div className="flex gap-2">
          <Select value={formData.phoneCode} onValueChange={(value) => onChange('phoneCode', value)}>
            <SelectTrigger className="w-32" data-testid="select-phone-code">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+32">{ts.phoneBelgium}</SelectItem>
              <SelectItem value="+44">{ts.phoneUK}</SelectItem>
              <SelectItem value="+33">{ts.phoneFrance}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="Phone number"
            className="flex-1"
            data-testid="input-phone"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.saveToAddressBook}
            onChange={(e) => onChange('saveToAddressBook', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">{ts.saveAddress}</span>
        </label>
      </div>
    </div>
  );
});
