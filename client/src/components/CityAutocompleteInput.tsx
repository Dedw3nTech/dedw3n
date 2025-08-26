/**
 * Enhanced City Autocomplete Input Component
 * Integrates all city data sources with comprehensive autocomplete functionality
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Search, MapPin, CheckCircle, X, Globe } from 'lucide-react';
import { cityDataService, type City } from '@/services/cityDataService';

interface CityAutocompleteInputProps {
  countryCode: string;
  countryName?: string;
  value: string;
  onChange: (cityName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showErrors?: boolean;
  required?: boolean;
  className?: string;
  staticCities?: string[];
}

export const CityAutocompleteInput: React.FC<CityAutocompleteInputProps> = ({
  countryCode,
  countryName,
  value,
  onChange,
  placeholder = "Type your city name...",
  disabled = false,
  showErrors = false,
  required = false,
  className = '',
  staticCities = [],
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; source: 'local' }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Removed Google Maps dependency - using comprehensive local data only



  // Enhanced local search with fuzzy matching
  const getEnhancedLocalSuggestions = useCallback((query: string) => {
    if (!query.trim() || query.length < 1) return [];
    
    const lowerQuery = query.toLowerCase();
    const suggestions: Array<{ name: string; source: 'local'; score: number }> = [];
    
    staticCities.forEach(city => {
      const lowerCity = city.toLowerCase();
      let score = 0;
      
      // Exact match gets highest score
      if (lowerCity === lowerQuery) {
        score = 100;
      }
      // Starts with query gets high score
      else if (lowerCity.startsWith(lowerQuery)) {
        score = 90;
      }
      // Contains query gets medium score
      else if (lowerCity.includes(lowerQuery)) {
        score = 70;
      }
      // Fuzzy match for typos (simple Levenshtein-like)
      else if (calculateSimilarity(lowerQuery, lowerCity) > 0.7) {
        score = 50;
      }
      
      if (score > 0) {
        suggestions.push({ name: city, source: 'local', score });
      }
    });
    
    // Sort by score and return top results
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ name, source }) => ({ name, source }));
  }, [staticCities]);

  // Simple similarity calculation for fuzzy matching
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance calculation for fuzzy matching
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!inputValue.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setError(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get enhanced local suggestions with fuzzy matching
        const enhancedSuggestions = getEnhancedLocalSuggestions(inputValue);

        setSuggestions(enhancedSuggestions.slice(0, 8));
        setIsOpen(enhancedSuggestions.length > 0);
        setSelectedIndex(-1);

      } catch (err) {
        console.error('[CITY-AUTOCOMPLETE] Search failed:', err);
        setError("Search unavailable");
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 150); // Even faster response for local data

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [inputValue, getEnhancedLocalSuggestions]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Update parent immediately for form validation
    onChange(newValue);
  };

  // Handle city selection
  const handleCitySelect = (cityName: string) => {
    setInputValue(cityName);
    onChange(cityName);
    setIsOpen(false);
    setError(null);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleCitySelect(suggestions[selectedIndex].name);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim() && setSuggestions(s => s.length > 0 ? (setIsOpen(true), s) : s)}
          placeholder={placeholder}
          disabled={disabled}
          className={`pr-10 ${error && showErrors ? 'border-red-500 focus:border-red-500' : ''}`}
          autoComplete="off"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        
        {/* Search icon */}
        {!isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && showErrors && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}

      {/* Autocomplete suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.name}-${suggestion.source}`}
              type="button"
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleCitySelect(suggestion.name)}
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm">{suggestion.name}</span>
              </div>
              
              {/* Local data indicator */}
              <div className="flex items-center text-xs text-gray-500">
                <span className="px-1 bg-green-100 text-green-700 rounded text-xs">✓</span>
              </div>
            </button>
          ))}
          
          {/* Data source info */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {suggestions.length} cities from comprehensive local database
            </p>
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && suggestions.length === 0 && inputValue.trim() && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
          <p className="text-sm text-gray-500 text-center">
            No cities found matching "{inputValue}"
            <span className="block text-xs mt-1">
              Try different spelling or check if city is in {countryName || countryCode}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default CityAutocompleteInput;