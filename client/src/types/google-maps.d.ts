/**
 * Google Maps API Type Declarations
 * Basic type definitions for Google Maps API integration
 */

declare global {
  interface Window {
    google: {
      maps: {
        Map: any;
        places: {
          PlacesService: any;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
          };
        };
      };
    };
  }
}

export {};