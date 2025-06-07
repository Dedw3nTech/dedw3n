import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SelectUser, InsertUser } from '@shared/schema';

interface AuthContextType {
  user: SelectUser | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (credentials: InsertUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Non-blocking user query that doesn't prevent app mounting
  const {
    data: user,
    error,
    isLoading: queryLoading,
    refetch
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false, // Don't retry to avoid blocking
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Set initial load to false after first query attempt
  useEffect(() => {
    if (!queryLoading || error) {
      setIsInitialLoad(false);
    }
  }, [queryLoading, error]);

  // Determine loading state - only show loading during initial authentication check
  const isLoading = isInitialLoad && queryLoading;

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      
      if (res.ok) {
        let data;
        try {
          const responseText = await res.text();
          if (responseText && responseText.trim()) {
            data = JSON.parse(responseText);
          } else {
            data = { success: true };
          }
        } catch (error) {
          data = { success: true };
        }
        
        return data;
      } else {
        const errorText = await res.text();
        throw new Error(errorText || `Login failed with status: ${res.status}`);
      }
    },
    onSuccess: (response) => {
      // Extract user from response
      let userData;
      if (response?.user) {
        userData = response.user;
      } else if (response?.id) {
        userData = response;
      }
      
      if (userData) {
        queryClient.setQueryData(["/api/user"], userData);
      } else {
        // Refetch user data if response doesn't contain user info
        refetch();
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData?.name || userData?.username || 'user'}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      
      if (res.ok) {
        let data;
        try {
          const responseText = await res.text();
          if (responseText && responseText.trim()) {
            data = JSON.parse(responseText);
          } else {
            data = { success: true };
          }
        } catch (error) {
          data = { success: true };
        }
        
        return data;
      } else {
        const errorText = await res.text();
        throw new Error(errorText || `Registration failed with status: ${res.status}`);
      }
    },
    onSuccess: (response) => {
      // Extract user from response
      let userData;
      if (response?.user) {
        userData = response.user;
      } else if (response?.id) {
        userData = response;
      }
      
      if (userData) {
        queryClient.setQueryData(["/api/user"], userData);
      } else {
        // Refetch user data if response doesn't contain user info
        refetch();
      }
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData?.name || userData?.username || 'user'}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        throw new Error("Logout failed");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear(); // Clear all cached data
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}