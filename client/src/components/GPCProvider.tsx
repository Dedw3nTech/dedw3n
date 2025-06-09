import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { detectGPCSignal, applyGPCPreferences, GPCSignal, hasGPCOptOut } from '@/lib/gpc';

interface GPCContextType {
  gpcSignal: GPCSignal | null;
  hasOptedOut: boolean;
  isGPCSupported: boolean;
  refreshGPCStatus: () => void;
}

const GPCContext = createContext<GPCContextType>({
  gpcSignal: null,
  hasOptedOut: false,
  isGPCSupported: false,
  refreshGPCStatus: () => {}
});

export const useGPC = () => {
  const context = useContext(GPCContext);
  if (!context) {
    throw new Error('useGPC must be used within a GPCProvider');
  }
  return context;
};

interface GPCProviderProps {
  children: ReactNode;
}

export function GPCProvider({ children }: GPCProviderProps) {
  const [gpcSignal, setGPCSignal] = useState<GPCSignal | null>(null);
  const [hasOptedOut, setHasOptedOut] = useState(false);
  const [isGPCSupported, setIsGPCSupported] = useState(false);

  const refreshGPCStatus = () => {
    const signal = detectGPCSignal();
    const optedOut = hasGPCOptOut();
    
    setGPCSignal(signal);
    setHasOptedOut(optedOut);
    setIsGPCSupported(signal.detected);
    
    console.log('[GPC Provider] Status updated:', {
      detected: signal.detected,
      optedOut,
      source: signal.source
    });
  };

  useEffect(() => {
    // Initial GPC detection
    refreshGPCStatus();
    
    // Apply GPC preferences
    applyGPCPreferences();
    
    // Listen for GPC changes (some browsers may update this dynamically)
    const handleGPCChange = () => {
      console.log('[GPC Provider] GPC signal changed, refreshing status');
      refreshGPCStatus();
    };

    // Check for GPC changes periodically (fallback for browsers that don't emit events)
    const interval = setInterval(() => {
      const currentSignal = detectGPCSignal();
      if (currentSignal.detected !== gpcSignal?.detected || 
          currentSignal.value !== gpcSignal?.value) {
        handleGPCChange();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <GPCContext.Provider value={{
      gpcSignal,
      hasOptedOut,
      isGPCSupported,
      refreshGPCStatus
    }}>
      {children}
    </GPCContext.Provider>
  );
}