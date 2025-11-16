import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { 
  apiRequest, 
  queryClient
} from "../lib/queryClient";
import { 
  saveUserData, 
  clearUserData
} from "../lib/userStorage";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { processError } from "@/lib/error-handler";
import { useAuthToken } from "@/contexts/AuthTokenContext";
import { useLazyUser } from "@/hooks/use-lazy-user";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  refetchUser: () => Promise<any>;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<any, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { translateText } = useMasterTranslation();
  const [, navigate] = useLocation();
  
  const { hasValidToken, setToken, clearToken, status: tokenStatus } = useAuthToken();
  
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useLazyUser({ 
    enabled: hasValidToken,
    refetchOnMount: false // Use cached data for instant page loads
  });

  useEffect(() => {
    if (tokenStatus === "unauthenticated" || tokenStatus === "expired") {
      queryClient.setQueryData(["/api/user"], null);
      clearUserData();
    }
  }, [tokenStatus]);

  useEffect(() => {
    if (tokenStatus === "authenticated" && !user && !isLoading) {
      refetch();
    }
  }, [tokenStatus, user, isLoading, refetch]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log('[LOGIN] Starting login for user:', credentials.username);
        
        const res = await apiRequest("POST", "/api/auth/login", credentials);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(errorData.message || `Login failed with status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('[LOGIN] Received response from server');
        
        if (data.token) {
          setToken(data.token);
          console.log('[LOGIN] JWT token stored');
        }
        
        return data;
      } catch (error: any) {
        console.error("[LOGIN] Login error:", error);
        throw new Error(error.message || "Login failed. Please try again.");
      }
    },
    onSuccess: async (response) => {
      console.log('[LOGIN] Processing successful login response');
      
      if (response?.requiresMFA || response?.requires2FA) {
        console.log('[LOGIN] MFA required, not redirecting - handled inline');
        return;
      }
      
      let user = response?.user || (response?.id ? response : null);
      
      if (!user) {
        console.log('[LOGIN] No user data in response, waiting for session sync');
        await new Promise(resolve => setTimeout(resolve, 100));
        const result = await refetch();
        user = result.data;
        
        if (!user) {
          console.error('[LOGIN] Failed to retrieve user data after login');
          throw new Error('Login succeeded but failed to retrieve user data');
        }
      }
      
      queryClient.setQueryData(["/api/user"], user);
      
      console.log('[LOGIN] User authenticated:', user.username);
      try {
        saveUserData(user);
      } catch (error) {
        console.error('[LOGIN] Error saving user data:', error);
      }
      
      console.log('[LOGIN] Login flow complete, user state ready');
    },
    onError: (error: Error) => {
      clearToken();
      const errorReport = processError(error);
      toast({
        title: translateText("Login failed"),
        description: errorReport.userMessage,
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser & { captchaId?: string; captchaInput?: string }) => {
      try {
        console.log('Registration attempt with credentials (username only):', credentials.username);
        
        const res = await apiRequest("POST", "/api/auth/register", credentials);
        
        console.log('Registration response status:', res.status);
        
        if (res.ok) {
          let data;
          try {
            const responseText = await res.text();
            console.log('Raw registration response text:', responseText);
            
            if (responseText && responseText.trim()) {
              try {
                data = JSON.parse(responseText);
                console.log('Parsed registration response data:', data);
              } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                data = { message: responseText };
              }
            } else {
              console.log('Empty response from server, using default success value');
              data = { success: true };
            }
          } catch (textError) {
            console.error('Error reading response text:', textError);
            data = { success: true };
          }
          
          if (data.token) {
            setToken(data.token);
          }
          
          const user = data.user || data;
          
          if (user.id) {
            queryClient.setQueryData(["/api/user"], user);
            try {
              saveUserData(user);
            } catch (error) {
              console.error('Error saving user data:', error);
            }
          }
          
          return user;
        } else {
          const errorData = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(errorData.message || `Registration failed with status: ${res.status}`);
        }
      } catch (error: any) {
        console.error("Registration error:", error);
        throw new Error(error.message || "Registration failed. Please try again.");
      }
    },
    onSuccess: (user) => {
      toast({
        title: translateText("Registration successful"),
        description: translateText("Welcome to Dedw3n! Please verify your email."),
        variant: "default",
      });
    },
    onError: (error: Error) => {
      const errorReport = processError(error);
      toast({
        title: translateText("Registration failed"),
        description: errorReport.userMessage,
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log('[LOGOUT] Initiating logout process');
        
        await apiRequest("POST", "/api/logout");
        
        console.log('[LOGOUT] Server logout successful');
      } catch (error) {
        console.error("[LOGOUT] Logout error:", error);
      }
    },
    onSuccess: async () => {
      console.log('[LOGOUT] Clearing client-side state');
      
      clearToken();
      clearUserData();
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      
      console.log('[LOGOUT] Client state cleared');
      
      toast({
        title: translateText("Logged out successfully"),
        description: translateText("You have been logged out."),
        variant: "default",
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[LOGOUT] Redirecting to login page');
      window.location.href = '/auth';
    },
    onError: (error: Error) => {
      console.error("[LOGOUT] Logout failed:", error);
      
      clearToken();
      clearUserData();
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      
      toast({
        title: translateText("Logout completed"),
        description: translateText("Session cleared. Redirecting to login."),
        variant: "default",
      });
      
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        refetchUser: refetch,
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
