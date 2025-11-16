import { useState, useEffect } from 'react';

interface LocationData {
  country: string;
  countryCode: string;
  city: string;
  region: string;
}

interface UseLocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: boolean;
}

export function useLocation(hasConsent: boolean): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!hasConsent) {
      setLocation(null);
      setIsLoading(false);
      return;
    }

    const fetchLocation = async () => {
      try {
        const response = await fetch('/api/geolocation');
        const data = await response.json();
        
        setLocation(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch location:', err);
        setError(true);
        setIsLoading(false);
        
        setLocation({
          country: 'Unknown',
          countryCode: 'XX',
          city: 'Unknown',
          region: 'Unknown'
        });
      }
    };

    fetchLocation();
  }, [hasConsent]);

  return { location, isLoading, error };
}
