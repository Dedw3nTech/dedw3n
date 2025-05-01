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
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<any, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

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
        const res = await apiRequest("POST", "/api/auth/login", credentials);
        
        // Ensure session cookies are saved by the browser
        if (res.ok) {
          // For session-based auth, clear any logged out flags
          setLoggedOutFlag(false);
          
          // Try to parse the response as JSON
          const data = await res.json();
          
          // If using JWT tokens and the response contains a token
          if (data.token) {
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
        console.error("Login error:", error);
        throw new Error(error.message || "Login failed. Please try again.");
      }
    },
    onSuccess: (response) => {
      // Clear any logged out flags
      setLoggedOutFlag(false);
      
      // Extract user from response (might be nested in user property or directly in response)
      const user = response.user || response;
      queryClient.setQueryData(["/api/auth/me"], user);
      
      // Immediately refetch user data to ensure we have the latest
      refetch();
      
      toast({
        title: t('auth.login_successful') || "Login successful",
        description: t('auth.welcome_back', { name: user.name || user.username }) || `Welcome back, ${user.name || user.username}!`,
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
    mutationFn: async (credentials: InsertUser) => {
      try {
        const res = await apiRequest("POST", "/api/auth/register", credentials);
        
        // Ensure session cookies are saved by the browser
        if (res.ok) {
          // For session-based auth, clear any logged out flags
          setLoggedOutFlag(false);
          
          // Try to parse the response as JSON
          const data = await res.json();
          
          // If using JWT tokens and the response contains a token
          if (data.token) {
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
        console.error("Registration error:", error);
        throw new Error(error.message || "Registration failed. Please try again.");
      }
    },
    onSuccess: (response) => {
      // Clear any logged out flags
      setLoggedOutFlag(false);
      
      // Extract user from response (might be nested in user property or directly in response)
      const user = response.user || response;
      queryClient.setQueryData(["/api/auth/me"], user);
      
      // Immediately refetch user data to ensure we have the latest
      refetch();
      
      toast({
        title: t('auth.registration_successful') || "Registration successful",
        description: t('auth.welcome', { name: user.name || user.username }) || `Welcome, ${user.name || user.username}!`,
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
      // Show toast notification that logout is in progress
      toast({
        title: t('auth.logging_out') || "Logging out",
        description: t('auth.please_wait') || "Please wait...",
      });
      
      // Set the logged out flag before making the request to prevent auto-login
      setLoggedOutFlag(true);
      
      // Add cache-busting parameter to prevent issues with caching
      const timestamp = new Date().getTime();
      const cacheBuster = `?_cb=${timestamp}`;
      
      // Call the real API endpoint for logout with options for network-level debugging
      const response = await apiRequest("POST", `/api/logout${cacheBuster}`, undefined, {
        // Set cache-control headers explicitly
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          // Add special header to prevent auto-login
          'X-Prevent-Autologin': 'true'
        }
      });
      
      // Special handling for 204 status (No Content)
      if (response.status === 204) {
        console.log('Logout successful with 204 status');
        return null;
      }
      
      return response;
    },
    onSuccess: () => {
      console.log('Logout mutation successful, cleaning up client state');
      
      // Ensure the logged out flag is set
      setLoggedOutFlag(true);
      
      // Clear the JWT token from storage
      clearAuthToken();
      
      // Clear authentication-specific cookies directly if possible
      // Note: This is a best-effort approach as it requires same-site/origin
      if (document.cookie) {
        document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
      
      // Clear user data from all possible auth caches
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear websocket connection if it exists
      try {
        // Access socket only if it exists as a global variable
        if (typeof window !== 'undefined' && (window as any).socket) {
          const socket = (window as any).socket;
          if (typeof socket.close === 'function') {
            socket.close();
            console.log('WebSocket connection closed during logout');
          }
        }
      } catch (e) {
        console.error("Error closing websocket:", e);
      }
      
      // Invalidate all queries to force refetch when user logs back in
      queryClient.invalidateQueries();
      
      // Reset application state completely by killing all prior API caches
      queryClient.clear();
      
      // Use wouter navigation for client-side routing with no-cache headers
      // Add cache buster to URL to avoid any cache issues
      const timestamp = new Date().getTime();
      setLocation(`/logout-success?_cb=${timestamp}`);
      
      // Post-logout cleanup
      console.log('Client-side logout completed');
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      
      // Even on error, ensure the logged out flag is set
      setLoggedOutFlag(true);
      
      // Even on error, clear user data for security
      clearAuthToken();
      
      // Handle cookie clearing directly
      if (document.cookie) {
        document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
      
      // Clear all API caches on error too
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      
      // Log the error but still redirect to logout success
      console.error("Logout process error:", error);
      
      // Redirect to logout success page anyway with cache busting
      const timestamp = new Date().getTime();
      setLocation(`/logout-success?_cb=${timestamp}`);
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