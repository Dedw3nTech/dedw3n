import { createContext, ReactNode, useContext, useEffect, useRef } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient, getStoredAuthToken, setAuthToken, clearAuthToken } from "../lib/queryClient";
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
    queryKey: ["/api/auth/me"],
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
      queryClient.setQueryData(["/api/auth/me"], null);
      return;
    }
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      console.warn('Token has expired, logging out');
      clearAuthToken();
      queryClient.setQueryData(["/api/auth/me"], null);
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
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await res.json();
      
      // Check if the response contains a token
      if (data.token) {
        // Store the token in localStorage
        setAuthToken(data.token);
        console.log('Auth token stored successfully');
      } else {
        console.warn('No token received from login response');
      }
      
      return data;
    },
    onSuccess: (response) => {
      // Extract user from response (might be nested in user property or directly in response)
      const user = response.user || response;
      queryClient.setQueryData(["/api/auth/me"], user);
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
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      const data = await res.json();
      
      // Check if the response contains a token
      if (data.token) {
        // Store the token in localStorage
        setAuthToken(data.token);
        console.log('Auth token stored successfully after registration');
      } else {
        console.warn('No token received from registration response');
      }
      
      return data;
    },
    onSuccess: (response) => {
      // Extract user from response (might be nested in user property or directly in response)
      const user = response.user || response;
      queryClient.setQueryData(["/api/auth/me"], user);
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
      
      // Call the real API endpoint for logout
      return await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear the JWT token from storage
      clearAuthToken();
      
      // Clear user data from cache
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
      
      // Use wouter navigation for client-side routing
      setLocation("/logout-success");
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      
      // Even on error, clear user data for security
      clearAuthToken();
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.setQueryData(["/api/user"], null);
      
      // Log the error but still redirect to logout success
      console.error("Logout process error:", error);
      
      // Redirect to logout success page anyway
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