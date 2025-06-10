import React from 'react';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/hooks/use-currency';

interface CurrencyInputProps {
  value: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

export default function CurrencyInput({ 
  value, 
  onValueChange, 
  placeholder = "0.00",
  className 
}: CurrencyInputProps) {
  const { symbol, formatAmount } = useCurrency();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = parseFloat(inputValue) || 0;
    onValueChange(numericValue);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
        {symbol}
      </span>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pl-8 ${className}`}
      />
    </div>
  );
}