import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DimensionUnit = 'cm' | 'inches';

interface DimensionUnitContextType {
  dimensionUnit: DimensionUnit;
  setDimensionUnit: (unit: DimensionUnit) => void;
  convertDimension: (dimensionCm: number) => number;
  formatDimension: (dimensionCm: number, showUnit?: boolean) => string;
}

const DimensionUnitContext = createContext<DimensionUnitContextType | undefined>(undefined);

export function DimensionUnitProvider({ children }: { children: ReactNode }) {
  const [dimensionUnit, setDimensionUnitState] = useState<DimensionUnit>('cm');

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dedw3n-dimension-unit');
    if (saved === 'cm' || saved === 'inches') {
      setDimensionUnitState(saved);
    }
  }, []);

  // Save preference to localStorage when changed
  const setDimensionUnit = (unit: DimensionUnit) => {
    setDimensionUnitState(unit);
    localStorage.setItem('dedw3n-dimension-unit', unit);
  };

  // Convert dimension from cm to selected unit
  const convertDimension = (dimensionCm: number): number => {
    if (dimensionUnit === 'inches') {
      return dimensionCm / 2.54; // Convert cm to inches
    }
    return dimensionCm;
  };

  // Format dimension with unit
  const formatDimension = (dimensionCm: number, showUnit: boolean = true): string => {
    const converted = convertDimension(dimensionCm);
    const formatted = dimensionUnit === 'inches' ? converted.toFixed(1) : converted.toString();
    return showUnit ? `${formatted} ${dimensionUnit}` : formatted;
  };

  return (
    <DimensionUnitContext.Provider value={{
      dimensionUnit,
      setDimensionUnit,
      convertDimension,
      formatDimension
    }}>
      {children}
    </DimensionUnitContext.Provider>
  );
}

export function useDimensionUnit() {
  const context = useContext(DimensionUnitContext);
  if (context === undefined) {
    throw new Error('useDimensionUnit must be used within a DimensionUnitProvider');
  }
  return context;
}