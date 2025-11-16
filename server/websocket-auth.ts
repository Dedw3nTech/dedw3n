import cookie from 'cookie';
import signature from 'cookie-signature';
import type { IncomingMessage } from 'http';

/**
 * WebSocket Authentication Utility
 * 
 * Provides centralized, secure authentication for all WebSocket connections.
 * Follows DRY principle and ensures consistent security validation.
 */

export interface AuthenticationResult {
  authenticated: boolean;
  userId?: number;
  sessionId?: string;
  error?: string;
}

/**
 * Authenticates a WebSocket upgrade request using session-based authentication.
 * 
 * Security guarantees:
 * 1. Validates cookie signature to prevent tampering
 * 2. Validates session exists in store (rejects expired/revoked sessions)
 * 3. Validates session contains authenticated user
 * 
 * @param req - The incoming HTTP upgrade request
 * @param sessionStore - The session store instance
 * @param cookieSecret - The secret used to sign cookies
 * @returns Promise resolving to authentication result
 */
export async function authenticateWebSocketRequest(
  req: IncomingMessage,
  sessionStore: any,
  cookieSecret: string
): Promise<AuthenticationResult> {
  try {
    // Step 1: Parse cookies from request headers
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return {
        authenticated: false,
        error: 'No cookies present in request'
      };
    }

    const cookies = cookie.parse(cookieHeader);
    const sessionCookieName = 'dedwen_session';
    const signedSessionId = cookies[sessionCookieName];

    if (!signedSessionId) {
      return {
        authenticated: false,
        error: 'Session cookie not found'
      };
    }

    // Step 2: Verify cookie signature (prevents tampering)
    const sessionId = signature.unsign(signedSessionId.slice(2), cookieSecret);
    
    if (!sessionId) {
      return {
        authenticated: false,
        error: 'Invalid cookie signature'
      };
    }

    // Step 3: Validate session in store (critical security check!)
    // This ensures we reject expired, revoked, or non-existent sessions
    const session = await new Promise<any>((resolve, reject) => {
      sessionStore.get(sessionId, (err: any, session: any) => {
        if (err) reject(err);
        else resolve(session);
      });
    });

    if (!session) {
      return {
        authenticated: false,
        error: 'Session not found in store (expired or revoked)'
      };
    }

    // Step 4: Validate session contains authenticated user
    if (!session.passport?.user) {
      return {
        authenticated: false,
        error: 'Session does not contain authenticated user'
      };
    }

    // Success - return authenticated user identity
    return {
      authenticated: true,
      userId: session.passport.user,
      sessionId: sessionId
    };

  } catch (error) {
    console.error('[WebSocket-Auth] Authentication error:', error);
    return {
      authenticated: false,
      error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Writes HTTP 401 Unauthorized response and closes socket.
 * 
 * @param socket - The socket to close
 * @param reason - Optional reason for logging
 */
export function rejectWebSocketUpgrade(socket: any, reason?: string): void {
  if (reason) {
    console.warn(`[WebSocket-Auth] Rejecting connection: ${reason}`);
  }
  socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  socket.destroy();
}
