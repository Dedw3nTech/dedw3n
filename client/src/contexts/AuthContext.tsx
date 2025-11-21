import { createContext, useContext, useReducer, useEffect, ReactNode, useMemo } from 'react';
import { User } from '@shared/schema';
import { loadUserData, saveUserData, clearUserData } from '@/lib/userStorage';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload,
        loading: false,
        isAuthenticated: true,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const cachedUser = loadUserData();
        if (cachedUser) {
          dispatch({ type: 'SET_USER', payload: cachedUser });
        }

        const response = await fetch('/api/user', {
          credentials: 'include',
        });

        if (response.ok) {
          const user = await response.json();
          dispatch({ type: 'SET_USER', payload: user });
          saveUserData(user);
        } else {
          dispatch({ type: 'SET_USER', payload: null });
          clearUserData();
        }
      } catch (error) {
        console.error('[AuthContext] Initialization failed:', error);
        dispatch({ type: 'SET_USER', payload: null });
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      console.log('[AuthContext] Auth error detected:', event.detail);
      dispatch({ type: 'LOGOUT' });
      clearUserData();
    };

    window.addEventListener('auth-error' as any, handleAuthError);
    return () => {
      window.removeEventListener('auth-error' as any, handleAuthError);
    };
  }, []);

  useEffect(() => {
    const handleLogoutRequest = () => {
      logout();
    };

    window.addEventListener('auth-logout-request', handleLogoutRequest);
    return () => {
      window.removeEventListener('auth-logout-request', handleLogoutRequest);
    };
  }, []);

  const login = async (credentials: any) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const user = await response.json();
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      saveUserData(user);
      
      localStorage.removeItem('unified_logout_state');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (error) {
      console.error('[AuthContext] Server logout failed:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      clearUserData();
      
      localStorage.removeItem('dedwen_auth_token');
      localStorage.removeItem('unified_logout_state');
      localStorage.removeItem('unified_logout_timestamp');
      sessionStorage.clear();
      
      localStorage.setItem('unified_logout_trigger', 'true');
      setTimeout(() => {
        localStorage.removeItem('unified_logout_trigger');
      }, 1000);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        dispatch({ type: 'SET_USER', payload: user });
        saveUserData(user);
      } else if (response.status === 401 || response.status === 403) {
        dispatch({ type: 'LOGOUT' });
        clearUserData();
      }
    } catch (error) {
      console.error('[AuthContext] User refresh failed:', error);
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = useMemo(() => ({
    ...state,
    login,
    logout,
    refreshUser,
    clearError,
  }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
