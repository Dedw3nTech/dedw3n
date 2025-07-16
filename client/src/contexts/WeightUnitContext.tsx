import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WeightUnit = 'kg' | 'lbs';

interface WeightUnitContextType {
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  convertWeight: (weightKg: number) => number;
  formatWeight: (weightKg: number, showUnit?: boolean) => string;
}

const WeightUnitContext = createContext<WeightUnitContextType | undefined>(undefined);

export function WeightUnitProvider({ children }: { children: ReactNode }) {
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>('kg');

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dedw3n-weight-unit');
    if (saved === 'kg' || saved === 'lbs') {
      setWeightUnitState(saved);
    }
  }, []);

  // Save preference to localStorage when changed
  const setWeightUnit = (unit: WeightUnit) => {
    setWeightUnitState(unit);
    localStorage.setItem('dedw3n-weight-unit', unit);
  };

  // Convert weight from kg to selected unit
  const convertWeight = (weightKg: number): number => {
    if (weightUnit === 'lbs') {
      return weightKg * 2.20462; // Convert kg to lbs
    }
    return weightKg;
  };

  // Format weight with unit
  const formatWeight = (weightKg: number, showUnit: boolean = true): string => {
    const converted = convertWeight(weightKg);
    const formatted = weightUnit === 'lbs' ? converted.toFixed(1) : converted.toString();
    return showUnit ? `${formatted} ${weightUnit}` : formatted;
  };

  return (
    <WeightUnitContext.Provider value={{
      weightUnit,
      setWeightUnit,
      convertWeight,
      formatWeight
    }}>
      {children}
    </WeightUnitContext.Provider>
  );
}

export function useWeightUnit() {
  const context = useContext(WeightUnitContext);
  if (context === undefined) {
    throw new Error('useWeightUnit must be used within a WeightUnitProvider');
  }
  return context;
}