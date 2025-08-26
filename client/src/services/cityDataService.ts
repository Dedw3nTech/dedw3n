/**
 * City Data Service - Google Maps API Integration
 * Provides comprehensive city data using Google Places API with fallback to static data
 */

export interface City {
  name: string;
  countryCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  administrativeArea?: string; // State/Province
  population?: number;
  placeId: string;
  source: 'google' | 'static'; // Data source indicator
}

export interface CitySearchOptions {
  countryCode: string;
  query?: string;
  limit?: number;
  includeCoordinates?: boolean;
}

// Cache interface for city data
interface CacheEntry {
  data: City[];
  timestamp: number;
  source: 'google' | 'static';
}

/**
 * Google Maps Places API Service
 */
class GoogleMapsService {
  private isLoaded = false;
  private placesService?: any;

  constructor() {
    this.initializeGoogleMaps();
  }

  private async initializeGoogleMaps(): Promise<void> {
    if (this.isLoaded || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      return;
    }

    try {
      // Load Google Maps JavaScript API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps API'));
        document.head.appendChild(script);
      });

      // Wait for Google Maps to be available
      if (typeof window !== 'undefined' && (window as any).google) {
        // Initialize Places service
        const map = new (window as any).google.maps.Map(document.createElement('div'));
        this.placesService = new (window as any).google.maps.places.PlacesService(map);
        this.isLoaded = true;

        console.log('[CITY-DATA] Google Maps API initialized successfully');
      } else {
        throw new Error('Google Maps API not available after script load');
      }
    } catch (error) {
      console.warn('[CITY-DATA] Failed to initialize Google Maps API:', error);
    }
  }

  async searchCities(query: string, countryCode: string, limit = 10): Promise<City[]> {
    if (!this.isLoaded || !this.placesService) {
      throw new Error('Google Maps service not available');
    }

    return new Promise((resolve, reject) => {
      const request = {
        query: `${query} city ${countryCode}`,
        fields: ['place_id', 'name', 'geometry', 'formatted_address', 'types'],
      };

      this.placesService!.findPlaceFromQuery(request, (results: any, status: any) => {
        if (status !== 'OK' || !results) {
          reject(new Error(`Places search failed: ${status}`));
          return;
        }

        const cities: City[] = results
          .filter((place: any) => 
            place.types?.includes('locality') || 
            place.types?.includes('administrative_area_level_1')
          )
          .slice(0, limit)
          .map((place: any) => ({
            name: place.name || '',
            countryCode,
            coordinates: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
            placeId: place.place_id || '',
            source: 'google' as const,
          }));

        resolve(cities);
      });
    });
  }

  async getCitiesForCountry(countryCode: string, limit = 50): Promise<City[]> {
    if (!this.isLoaded || !this.placesService) {
      throw new Error('Google Maps service not available');
    }

    return new Promise((resolve, reject) => {
      const request = {
        query: `cities in ${countryCode}`,
        type: 'locality',
      };

      this.placesService!.textSearch(request, (results: any, status: any) => {
        if (status !== 'OK' || !results) {
          reject(new Error(`Country cities search failed: ${status}`));
          return;
        }

        const cities: City[] = results
          .slice(0, limit)
          .map((place: any) => ({
            name: place.name || '',
            countryCode,
            coordinates: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
            placeId: place.place_id || '',
            source: 'google' as const,
          }));

        resolve(cities);
      });
    });
  }

  async validateCity(cityName: string, countryCode: string): Promise<boolean> {
    try {
      const results = await this.searchCities(cityName, countryCode, 1);
      return results.length > 0;
    } catch (error) {
      console.warn('[CITY-DATA] City validation failed:', error);
      return false;
    }
  }
}

/**
 * City Data Cache Manager
 */
class CityDataCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  getCachedCities(countryCode: string): City[] | null {
    const cached = this.cache.get(countryCode);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`[CITY-DATA] Using cached data for ${countryCode} (${cached.source})`);
      return cached.data;
    }
    return null;
  }

  setCachedCities(countryCode: string, cities: City[], source: 'google' | 'static'): void {
    this.cache.set(countryCode, {
      data: cities,
      timestamp: Date.now(),
      source,
    });
    console.log(`[CITY-DATA] Cached ${cities.length} cities for ${countryCode} (${source})`);
  }

  clearCache(): void {
    this.cache.clear();
    console.log('[CITY-DATA] Cache cleared');
  }

  getCacheStats(): { size: number; countries: string[] } {
    return {
      size: this.cache.size,
      countries: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Hybrid City Data Service
 * Combines Google Maps API with static fallback data
 */
export class CityDataService {
  private googleMapsService = new GoogleMapsService();
  private cache = new CityDataCache();
  private staticCityData: Record<string, string[]> = {};

  constructor(staticData?: Record<string, string[]>) {
    if (staticData) {
      this.staticCityData = staticData;
    }
  }

  setStaticCityData(data: Record<string, string[]>): void {
    this.staticCityData = data;
    console.log('[CITY-DATA] Static city data updated with', Object.keys(data).length, 'countries');
  }

  async getCitiesForCountry(countryCode: string): Promise<City[]> {
    // Check cache first
    const cached = this.cache.getCachedCities(countryCode);
    if (cached) {
      return cached;
    }

    // Try Google Maps API first
    try {
      const googleCities = await this.googleMapsService.getCitiesForCountry(countryCode);
      if (googleCities.length > 0) {
        this.cache.setCachedCities(countryCode, googleCities, 'google');
        return googleCities;
      }
    } catch (error) {
      console.warn(`[CITY-DATA] Google Maps API failed for ${countryCode}:`, error);
    }

    // Fallback to static data
    const staticCities = this.getStaticCities(countryCode);
    if (staticCities.length > 0) {
      this.cache.setCachedCities(countryCode, staticCities, 'static');
    }

    return staticCities;
  }

  async searchCities(options: CitySearchOptions): Promise<City[]> {
    const { countryCode, query, limit = 10 } = options;

    if (!query) {
      return this.getCitiesForCountry(countryCode);
    }

    // Try Google Maps search first
    try {
      const googleResults = await this.googleMapsService.searchCities(query, countryCode, limit);
      if (googleResults.length > 0) {
        return googleResults;
      }
    } catch (error) {
      console.warn(`[CITY-DATA] Google Maps search failed for "${query}" in ${countryCode}:`, error);
    }

    // Fallback to static data search
    return this.searchStaticCities(query, countryCode, limit);
  }

  async validateCity(cityName: string, countryCode: string): Promise<boolean> {
    // Try Google Maps validation first
    try {
      const isValid = await this.googleMapsService.validateCity(cityName, countryCode);
      if (isValid) return true;
    } catch (error) {
      console.warn(`[CITY-DATA] Google Maps validation failed for "${cityName}":`, error);
    }

    // Fallback to static data validation
    return this.validateStaticCity(cityName, countryCode);
  }

  private getStaticCities(countryCode: string): City[] {
    const staticCities = this.staticCityData[countryCode] || [];
    return staticCities.map((cityName, index) => ({
      name: cityName,
      countryCode,
      coordinates: { lat: 0, lng: 0 }, // Default coordinates for static data
      placeId: `static_${countryCode}_${index}`,
      source: 'static' as const,
    }));
  }

  private searchStaticCities(query: string, countryCode: string, limit: number): City[] {
    const staticCities = this.getStaticCities(countryCode);
    const searchQuery = query.toLowerCase();
    
    return staticCities
      .filter(city => city.name.toLowerCase().includes(searchQuery))
      .slice(0, limit);
  }

  private validateStaticCity(cityName: string, countryCode: string): boolean {
    const staticCities = this.staticCityData[countryCode] || [];
    return staticCities.some(city => 
      city.toLowerCase() === cityName.toLowerCase()
    );
  }

  // Utility methods
  clearCache(): void {
    this.cache.clearCache();
  }

  getCacheStats(): { size: number; countries: string[] } {
    return this.cache.getCacheStats();
  }

  isGoogleMapsAvailable(): boolean {
    return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  }

  getServiceStatus(): { googleMapsAvailable: boolean; staticDataAvailable: boolean; cacheStats: any } {
    return {
      googleMapsAvailable: this.isGoogleMapsAvailable(),
      staticDataAvailable: Object.keys(this.staticCityData).length > 0,
      cacheStats: this.getCacheStats(),
    };
  }
}

// Singleton instance for global use
export const cityDataService = new CityDataService();