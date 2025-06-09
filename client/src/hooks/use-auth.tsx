import { createContext, ReactNode, useContext, useEffect, useRef } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { 
  getQueryFn, 
  apiRequest, 
  queryClient, 
  getStoredAuthToken, 
  setAuthToken, 
  clearAuthToken,
  setLoggedOutFlag,
  isUserLoggedOut 
} from "../lib/queryClient";
import { parseJwt, isTokenExpired, hasValidStructure } from "../lib/jwtUtils";
import { 
  saveUserData, 
  loadUserData, 
  clearUserData, 
  updateUserData 
} from "../lib/userStorage";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<any, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser & { captchaId?: string; captchaInput?: string }>;
};

type LoginData = Pick<InsertUser, "username" | "password"> & { captchaId?: string; captchaInput?: string };

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const tokenCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Query for getting the current user
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Verify token on component mount and set up periodic checks
  // Effect for token validation check
  useEffect(() => {
    // Verify token on startup
    verifyTokenValidity();
    
    // Set up periodic token verification (every 5 minutes)
    tokenCheckIntervalRef.current = setInterval(() => {
      verifyTokenValidity();
    }, 5 * 60 * 1000);
    
    // Clean up on unmount
    return () => {
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
    };
  }, []);
  
  // Effect for loading stored user data on startup
  useEffect(() => {
    // Only attempt to load stored user data if we don't already have a user
    if (!user && !isLoading) {
      try {
        // Try sessionStorage first (faster)
        let storedUserData = sessionStorage.getItem('userData');
        
        // If not in sessionStorage, try localStorage
        if (!storedUserData) {
          storedUserData = localStorage.getItem('userData');
        }
        
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          
          // Check if the stored data has a timestamp and isn't too old (24 hours)
          const lastUpdated = new Date(userData.lastUpdated || 0);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceUpdate < 24) {
            console.log('Found stored user data, restoring session:', {
              id: userData.id,
              username: userData.username,
              lastUpdated: userData.lastUpdated
            });
            
            // Update the user data in the cache
            queryClient.setQueryData(["/api/user"], userData);
            
            // Immediately fetch fresh data to ensure we have the latest
            refetch();
          } else {
            console.log('Stored user data is too old, not restoring');
            // Clear old data
            sessionStorage.removeItem('userData');
            localStorage.removeItem('userData');
          }
        }
      } catch (error) {
        console.error('Error loading stored user data:', error);
      }
    }
  }, [user, isLoading]);
  
  // Function to verify token validity
  const verifyTokenValidity = () => {
    const token = getStoredAuthToken();
    
    if (!token) {
      // No token stored, nothing to validate
      return;
    }
    
    // Check if token has valid structure
    if (!hasValidStructure(token)) {
      console.error('Invalid token structure detected');
      clearAuthToken();
      queryClient.setQueryData(["/api/user"], null);
      return;
    }
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      console.warn('Token has expired, logging out');
      clearAuthToken();
      queryClient.setQueryData(["/api/user"], null);
      // Silently handle expiration without showing error toast
      return;
    }
    
    // Token is valid, ensure we have user data
    if (!user) {
      refetch();
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        // Add debugger statement before login request
        debugger; // For Node.js debugging as suggested in nodejs.org/api/debugger.html
        console.log('Login attempt with credentials (username only):', credentials.username);
        
        const res = await apiRequest("POST", "/api/auth/login", credentials);
        
        // Add debugger to inspect response
        debugger; // For Node.js debugging
        console.log('Login response status:', res.status);
        
        // Ensure session cookies are saved by the browser
        if (res.ok) {
          // For session-based auth, clear any logged out flags
          setLoggedOutFlag(false);
          
          // Try to parse the response as JSON
          let data;
          try {
            const responseText = await res.text();
            console.log('Raw response text:', responseText);
            
            // Only try to parse as JSON if the response is not empty
            if (responseText && responseText.trim()) {
              try {
                data = JSON.parse(responseText);
                console.log('Parsed response data:', data);
              } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                // If parsing fails, use the response text as a string value
                data = { message: responseText };
              }
            } else {
              // Handle empty response by creating a basic user object
              console.log('Empty response from server, using default success value');
              data = { success: true };
            }
          } catch (textError) {
            console.error('Error reading response text:', textError);
            // Fallback for when we can't read the response body
            data = { success: true };
          }
          
          // If using JWT tokens and the response contains a token
          if (data && data.token) {
            // Store the token in localStorage
            setAuthToken(data.token);
            console.log('Auth token stored successfully');
          }
          
          return data;
        } else {
          const errorText = await res.text();
          throw new Error(errorText || `Login failed with status: ${res.status}`);
        }
      } catch (error: any) {
        // Add debugger on error
        debugger; // For Node.js debugging
        console.error("Login error:", error);
        throw new Error(error.message || "Login failed. Please try again.");
      }
    },
    onSuccess: (response) => {
      // Add debugger to inspect response data in the success callback
      debugger; // For Node.js debugging
      console.log('Login success, response data:', response);
      
      // Clear any logged out flags
      setLoggedOutFlag(false);
      
      // Extract user from response (might be nested in user property or directly in response)
      // Handle various response structures safely
      let user;
      
      if (response) {
        if (response.user) {
          user = response.user;
        } else if (response.id) { 
          // Response is the user object directly
          user = response;
        } else {
          // We need to refetch the user data as the response doesn't contain user info
          console.log('Response does not contain user data, refetching...');
          refetch();
          return; // Exit early and let the refetch handle updating the UI
        }
      } else {
        console.warn('Empty response in onSuccess handler');
        refetch();
        return;
      }
      
      // Update the user data in the cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Store user data in persistent storage for cross-session persistence
      console.log('Storing authenticated user data to persistent storage:', {
        id: user.id,
        username: user.username || '(no username)',
      });
      
      try {
        // Save the user data to both localStorage and sessionStorage
        saveUserData(user);
      } catch (error) {
        console.error('Error saving user data to storage:', error);
      }
      
      // Immediately refetch user data to ensure we have the latest
      refetch();
      
      toast({
        title: t('auth.login_successful') || "Login successful",
        description: t('auth.welcome_back', { name: user?.name || user?.username || 'user' }) || 
          `Welcome back, ${user?.name || user?.username || 'user'}!`,
      });
    },
    onError: (error: Error) => {
      // Clear any existing token on login failure
      clearAuthToken();
      toast({
        title: t('auth.login_failed') || "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser & { captchaId?: string; captchaInput?: string }) => {
      try {
        // Add debugger statement before registration request
        debugger; // For Node.js debugging
        console.log('Registration attempt with credentials (username only):', credentials.username);
        
        const res = await apiRequest("POST", "/api/auth/register", credentials);
        
        // Add debugger to inspect response
        debugger; // For Node.js debugging
        console.log('Registration response status:', res.status);
        
        // Ensure session cookies are saved by the browser
        if (res.ok) {
          // For session-based auth, clear any logged out flags
          setLoggedOutFlag(false);
          
          // Try to parse the response as JSON
          let data;
          try {
            const responseText = await res.text();
            console.log('Raw registration response text:', responseText);
            
            // Only try to parse as JSON if the response is not empty
            if (responseText && responseText.trim()) {
              try {
                data = JSON.parse(responseText);
                console.log('Parsed registration response data:', data);
              } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                // If parsing fails, use the response text as a string value
                data = { message: responseText };
              }
            } else {
              // Handle empty response by creating a basic user object
              console.log('Empty response from server, using default success value');
              data = { success: true };
            }
          } catch (textError) {
            console.error('Error reading response text:', textError);
            // Fallback for when we can't read the response body
            data = { success: true };
          }
          
          // If using JWT tokens and the response contains a token
          if (data && data.token) {
            // Store the token in localStorage
            setAuthToken(data.token);
            console.log('Auth token stored successfully after registration');
          }
          
          return data;
        } else {
          const errorText = await res.text();
          throw new Error(errorText || `Registration failed with status: ${res.status}`);
        }
      } catch (error: any) {
        // Add debugger on error
        debugger; // For Node.js debugging
        console.error("Registration error:", error);
        throw new Error(error.message || "Registration failed. Please try again.");
      }
    },
    onSuccess: (response) => {
      // Add debugger to inspect response data in the success callback
      debugger; // For Node.js debugging
      console.log('Registration success, response data:', response);
      
      // Clear any logged out flags
      setLoggedOutFlag(false);
      
      // Extract user from response (might be nested in user property or directly in response)
      // Handle various response structures safely
      let user;
      
      if (response) {
        if (response.user) {
          user = response.user;
        } else if (response.id) { 
          // Response is the user object directly
          user = response;
        } else {
          // We need to refetch the user data as the response doesn't contain user info
          console.log('Response does not contain user data, refetching...');
          refetch();
          return; // Exit early and let the refetch handle updating the UI
        }
      } else {
        console.warn('Empty response in onSuccess handler');
        refetch();
        return;
      }
      
      // Update the user data in the cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Store user data in persistent storage for cross-session persistence
      console.log('Storing newly registered user data to persistent storage:', {
        id: user.id,
        username: user.username || '(no username)',
      });
      
      try {
        // Save the user data to both localStorage and sessionStorage
        saveUserData(user);
      } catch (error) {
        console.error('Error saving user data to storage:', error);
      }
      
      // Immediately refetch user data to ensure we have the latest
      refetch();
      
      toast({
        title: t('auth.registration_successful') || "Registration successful",
        description: t('auth.welcome', { name: user?.name || user?.username || 'user' }) || 
          `Welcome, ${user?.name || user?.username || 'user'}!`,
      });
    },
    onError: (error: Error) => {
      // Clear any existing token on registration failure
      clearAuthToken();
      toast({
        title: t('auth.registration_failed') || "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get location setter from wouter for proper navigation
  const [, setLocation] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('[FAST-LOGOUT] Starting client logout process');
      
      // Disable auto-login immediately to prevent re-authentication
      try {
        localStorage.removeItem('enable_auto_login');
        sessionStorage.removeItem('enable_auto_login');
        localStorage.setItem('auto_login_disabled', 'true');
        console.log('[FAST-LOGOUT] Auto-login disabled');
      } catch (error) {
        console.warn('[FAST-LOGOUT] Error disabling auto-login:', error);
      }
      
      // Set logged out flag to prevent immediate re-authentication
      setLoggedOutFlag(true);
      
      // Fire logout request without waiting (let it complete in background)
      apiRequest("POST", "/api/logout", undefined, {
        headers: { 'X-User-Logged-Out': 'true' }
      }).catch(error => {
        console.warn('[FAST-LOGOUT] Server logout error (non-blocking):', error);
      });
      
      // Return immediately for fast user experience
      return { success: true };
    },
    onSuccess: () => {
      console.log('[FAST-LOGOUT] Client cleanup starting');
      
      // Immediate cleanup without complex operations
      clearAuthToken();
      clearUserData();
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      
      // Clear any authentication state from session storage
      try {
        sessionStorage.clear();
        // Only clear specific auth-related items from localStorage to preserve other settings
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('jwt_token');
      } catch (error) {
        console.warn('[FAST-LOGOUT] Error clearing storage:', error);
      }
      
      // Navigate immediately
      setLocation("/logout-success");
      
      console.log('[FAST-LOGOUT] Client logout completed');
    },
    onError: (error: Error) => {
      console.warn('[FAST-LOGOUT] Logout error (non-blocking):', error);
      
      // Even on error, perform cleanup and redirect
      clearAuthToken();
      clearUserData();
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      
      // Disable auto-login even on error
      try {
        localStorage.removeItem('enable_auto_login');
        localStorage.setItem('auto_login_disabled', 'true');
      } catch (error) {
        console.warn('[FAST-LOGOUT] Error disabling auto-login on error:', error);
      }
      
      setLocation("/logout-success");
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}