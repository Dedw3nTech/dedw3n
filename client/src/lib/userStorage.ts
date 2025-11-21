import { User } from '@shared/schema';

/**
 * Helper module for storing and retrieving user data from browser storage
 * Provides both localStorage (persistent across sessions) and sessionStorage (faster retrieval)
 */

const USER_STORAGE_KEY = 'userData';
const MAX_AGE_HOURS = 24; // How long stored data is considered valid

interface StoredUserData extends User {
  lastUpdated?: string;
  lastAuthTime?: string;
}

/**
 * Save user data to both localStorage and sessionStorage
 */
export function saveUserData(user: User): void {
  try {
    // Add timestamps to track when stored
    const userData: StoredUserData = {
      ...user,
      lastUpdated: new Date().toISOString(),
      lastAuthTime: new Date().toISOString()
    };
    
    console.log('Storing user data in browser storage:', {
      id: userData.id,
      username: userData.username,
      timestamp: userData.lastUpdated
    });
    
    // Store in both types of storage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    
    // Dispatch an event so other components can react to the change
    window.dispatchEvent(new CustomEvent('user-data-updated', { detail: userData }));
  } catch (error) {
    console.error('Error saving user data to storage:', error);
  }
}

/**
 * Load user data from storage, prioritizing sessionStorage for performance
 * Validates data freshness before returning
 */
export function loadUserData(): StoredUserData | null {
  try {
    // Try sessionStorage first (faster)
    let storedData = sessionStorage.getItem(USER_STORAGE_KEY);
    
    // Fall back to localStorage
    if (!storedData) {
      storedData = localStorage.getItem(USER_STORAGE_KEY);
    }
    
    if (!storedData) {
      return null;
    }
    
    const userData: StoredUserData = JSON.parse(storedData);
    
    // Check data freshness
    if (userData.lastUpdated) {
      const lastUpdated = new Date(userData.lastUpdated);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > MAX_AGE_HOURS) {
        console.log('Stored user data is too old, removing');
        clearUserData();
        return null;
      }
    }
    
    return userData;
  } catch (error) {
    console.error('Error loading user data from storage:', error);
    return null;
  }
}

/**
 * Remove user data from all storage options
 */
export function clearUserData(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('user-data-cleared'));
  } catch (error) {
    console.error('Error clearing user data from storage:', error);
  }
}

/**
 * Check if user data exists in storage
 */
export function hasStoredUserData(): boolean {
  return !!loadUserData();
}

/**
 * Update existing user data with new values, keeping timestamps intact
 */
export function updateUserData(userData: Partial<User>): void {
  const existingData = loadUserData();
  
  if (existingData) {
    // Extract metadata fields that aren't part of User type
    const { lastUpdated, lastAuthTime, ...userFields } = existingData;
    
    // Merge existing user fields with updates and cast to User
    // saveUserData will add back lastUpdated and lastAuthTime
    saveUserData({
      ...userFields,
      ...userData,
    } as User);
  }
}