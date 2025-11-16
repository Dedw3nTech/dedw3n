import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DistanceUnit = 'km' | 'miles';

interface DistanceUnitContextType {
  distanceUnit: DistanceUnit;
  setDistanceUnit: (unit: DistanceUnit) => void;
  convertDistance: (distanceKm: number) => number;
  formatDistance: (distanceKm: number, showUnit?: boolean) => string;
}

const DistanceUnitContext = createContext<DistanceUnitContextType | undefined>(undefined);

export function DistanceUnitProvider({ children }: { children: ReactNode }) {
  const [distanceUnit, setDistanceUnitState] = useState<DistanceUnit>('km');

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dedw3n-distance-unit');
    if (saved === 'km' || saved === 'miles') {
      setDistanceUnitState(saved);
    }
  }, []);

  // Save preference to localStorage when changed
  const setDistanceUnit = (unit: DistanceUnit) => {
    setDistanceUnitState(unit);
    localStorage.setItem('dedw3n-distance-unit', unit);
  };

  // Convert distance from km to selected unit
  const convertDistance = (distanceKm: number): number => {
    if (distanceUnit === 'miles') {
      return distanceKm * 0.621371; // Convert km to miles
    }
    return distanceKm;
  };

  // Format distance with unit
  const formatDistance = (distanceKm: number, showUnit: boolean = true): string => {
    const converted = convertDistance(distanceKm);
    const formatted = converted.toFixed(1);
    return showUnit ? `${formatted} ${distanceUnit}` : formatted;
  };

  return (
    <DistanceUnitContext.Provider value={{
      distanceUnit,
      setDistanceUnit,
      convertDistance,
      formatDistance
    }}>
      {children}
    </DistanceUnitContext.Provider>
  );
}

export function useDistanceUnit() {
  const context = useContext(DistanceUnitContext);
  if (context === undefined) {
    throw new Error('useDistanceUnit must be used within a DistanceUnitProvider');
  }
  return context;
}
