import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { queryClient } from "@/lib/queryClient";

// Import the Dedwen logo
import dedwenLogo from "../assets/d3-black-logo.png";
import newDedwenLogo from "@assets/Dedw3n Logo_1749096270700.png";

export default function LogoutSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Force page title to be exactly as requested
    document.title = 'You have successfully logged out';
    
    // Set all anti-caching headers via meta tags
    const metaTags = [
      { httpEquiv: 'Cache-Control', content: 'no-cache, no-store, must-revalidate, private' },
      { httpEquiv: 'Pragma', content: 'no-cache' },
      { httpEquiv: 'Expires', content: '0' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
    ];
    
    // Create and append all meta tags
    const addedMetaTags = metaTags.map(tagProps => {
      const metaTag = document.createElement('meta');
      Object.entries(tagProps).forEach(([key, value]) => {
        metaTag.setAttribute(key, value);
      });
      document.head.appendChild(metaTag);
      return metaTag;
    });
    
    // Additional security measures
    try {
      // Clear all auth-related localStorage items
      const keysToRemove = [
        'dedwen_auth_token',  // Main auth token
        'i18nextLng',         // Language settings
        'user_session',       // Any session data
        'last_login',         // Login timestamps
        'auth_state',         // Auth state management
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Failed to remove ${key} from localStorage:`, e);
        }
      });
      
      // Clear session storage as well
      sessionStorage.clear();
      
      // Forcefully clear React Query cache for all auth endpoints
      queryClient.clear();
      
      // Set cross-domain logout indicators
      localStorage.setItem('dedwen_logged_out', 'true');
      sessionStorage.setItem('dedwen_logged_out', 'true');
      
      // Set cross-domain logout cookies with proper domain handling
      const host = window.location.hostname;
      const isReplit = host.includes('.replit.dev');
      
      // Set logout cookies for current domain
      document.cookie = 'dedwen_logout=true; path=/; max-age=15; SameSite=Lax';
      document.cookie = 'user_logged_out=true; path=/; max-age=15; SameSite=Lax';
      document.cookie = 'cross_domain_logout=true; path=/; max-age=15; SameSite=Lax';
      
      // For Replit domains, also set for the parent domain
      if (isReplit) {
        const replitMatch = host.match(/([^.]+\.replit\.dev)$/);
        if (replitMatch) {
          const replitDomain = replitMatch[1];
          document.cookie = `dedwen_logout=true; path=/; max-age=15; domain=.${replitDomain}; SameSite=Lax`;
          document.cookie = `user_logged_out=true; path=/; max-age=15; domain=.${replitDomain}; SameSite=Lax`;
        }
      }
      
      // Clear all cookies systematically
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        // Clear auth-related cookies
        if (name.includes('token') || name.includes('auth') || name.includes('session') || 
            name.includes('sid') || name.includes('dedwen') || name.includes('connect.sid')) {
          // Clear for current domain
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure;`;
          
          // Clear for parent domain if on Replit
          if (isReplit) {
            const replitMatch = host.match(/([^.]+\.replit\.dev)$/);
            if (replitMatch) {
              const replitDomain = replitMatch[1];
              document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=.${replitDomain};`;
            }
          }
        }
      }
      
      // Trigger storage event for cross-tab/cross-domain coordination
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'dedwen_logged_out',
        newValue: 'true',
        storageArea: localStorage
      }));
      
      // Force browser history manipulation to prevent back-button issues
      if (typeof window.history.pushState === 'function') {
        window.history.pushState(null, '', window.location.pathname);
        window.addEventListener('popstate', () => {
          // If user tries to go back, redirect to home
          setLocation('/');
        }, { once: true });
      }
      
      // Prevent automatic navigation away from logout page for 60 seconds
      const preventNavigation = (e: BeforeUnloadEvent) => {
        // Only prevent if we're still on logout success page
        if (window.location.pathname.includes('/logout-success')) {
          e.preventDefault();
          e.returnValue = '';
        }
      };
      
      window.addEventListener('beforeunload', preventNavigation);
      
      // Set up a timer to maintain logout state visibility
      const maintainLogoutState = setInterval(() => {
        // Ensure logout flags remain set while on this page
        localStorage.setItem('dedwen_logged_out', 'true');
        sessionStorage.setItem('dedwen_logged_out', 'true');
      }, 5000);
      
      // Cleanup after 60 seconds or when user navigates away
      const cleanupTimer = setTimeout(() => {
        window.removeEventListener('beforeunload', preventNavigation);
        clearInterval(maintainLogoutState);
      }, 60000);
      
      console.log('Logout success page: Applied comprehensive security and anti-caching measures');
    } catch (e) {
      console.error('Error during logout security cleanup:', e);
    }
    
    // Clean up function to remove meta tags and event listeners when component unmounts
    return () => {
      try {
        addedMetaTags.forEach(tag => {
          document.head.removeChild(tag);
        });
        window.removeEventListener('beforeunload', preventNavigation);
        clearInterval(maintainLogoutState);
        clearTimeout(cleanupTimer);
      } catch (e) {
        console.error('Failed to cleanup logout success page:', e);
      }
    };
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 bg-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow-xl border border-gray-200"
      >

        
        <div className="text-center space-y-4">
          {/* Dedw3n Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src={newDedwenLogo} 
              alt="Dedw3n Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-black">
            You have successfully logged out
          </h1>
          
          <p className="text-gray-600">
            Thank you for choosing our platform!
          </p>
          <p className="text-gray-600">
            We look forward to seeing you again soon.
          </p>
          
          <div className="pt-4">
            <Button 
              asChild
              className="w-full bg-black hover:bg-gray-900 text-white"
            >
              <Link href="/">
                Back to home
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
      
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          Questions or concerns?{' '}
          <Link href="/contact" className="text-blue-600 hover:underline">
            contact us
          </Link>
        </p>
      </div>
    </div>
  );
}