import { createContext, ReactNode, useContext, useEffect, useState, useCallback, useRef } from "react";
import { 
  parseJwt, 
  isTokenExpired, 
  hasValidStructure,
  getUserFromToken 
} from "@/lib/jwtUtils";
import { 
  getStoredAuthToken, 
  setAuthToken, 
  clearAuthToken 
} from "@/lib/queryClient";

type TokenStatus = "authenticated" | "unauthenticated" | "expired" | "checking";

interface TokenInfo {
  userId: number | null;
  role: string | null;
  tokenId: string | null;
}

type AuthTokenContextType = {
  status: TokenStatus;
  tokenInfo: TokenInfo;
  hasValidToken: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  recheckToken: () => void;
};

const AuthTokenContext = createContext<AuthTokenContextType | null>(null);

// Synchronous token validation function for instant initial state
function getInitialTokenState(): { status: TokenStatus; info: TokenInfo } {
  const token = getStoredAuthToken();
  
  if (!token) {
    return {
      status: "unauthenticated",
      info: { userId: null, role: null, tokenId: null }
    };
  }
  
  if (!hasValidStructure(token)) {
    clearAuthToken();
    return {
      status: "unauthenticated",
      info: { userId: null, role: null, tokenId: null }
    };
  }
  
  if (isTokenExpired(token)) {
    clearAuthToken();
    return {
      status: "expired",
      info: { userId: null, role: null, tokenId: null }
    };
  }
  
  const userInfo = getUserFromToken(token);
  if (userInfo) {
    return {
      status: "authenticated",
      info: {
        userId: userInfo.userId,
        role: userInfo.role,
        tokenId: userInfo.tokenId,
      }
    };
  }
  
  return {
    status: "unauthenticated",
    info: { userId: null, role: null, tokenId: null }
  };
}

export function AuthTokenProvider({ children }: { children: ReactNode }) {
  // Cache initial state to avoid double parsing in Strict Mode
  const initialStateRef = useRef<ReturnType<typeof getInitialTokenState> | null>(null);
  if (!initialStateRef.current) {
    initialStateRef.current = getInitialTokenState();
  }
  
  // Lazy initialization with synchronous token check for instant initial state
  const [status, setStatus] = useState<TokenStatus>(() => initialStateRef.current!.status);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>(() => initialStateRef.current!.info);
  const tokenCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const recheckToken = useCallback(() => {
    const { status: newStatus, info: newInfo } = getInitialTokenState();
    setStatus(newStatus);
    setTokenInfo(newInfo);
  }, []);

  const handleSetToken = useCallback((token: string) => {
    setAuthToken(token);
    recheckToken();
  }, [recheckToken]);

  const handleClearToken = useCallback(() => {
    clearAuthToken();
    setStatus("unauthenticated");
    setTokenInfo({ userId: null, role: null, tokenId: null });
  }, []);

  useEffect(() => {
    recheckToken();
    
    tokenCheckIntervalRef.current = setInterval(() => {
      recheckToken();
    }, 5 * 60 * 1000);
    
    return () => {
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
    };
  }, [recheckToken]);

  const hasValidToken = status === "authenticated";

  return (
    <AuthTokenContext.Provider
      value={{
        status,
        tokenInfo,
        hasValidToken,
        setToken: handleSetToken,
        clearToken: handleClearToken,
        recheckToken,
      }}
    >
      {children}
    </AuthTokenContext.Provider>
  );
}

export function useAuthToken() {
  const context = useContext(AuthTokenContext);
  if (!context) {
    throw new Error("useAuthToken must be used within AuthTokenProvider");
  }
  return context;
}
