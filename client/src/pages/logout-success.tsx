import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { queryClient } from "@/lib/queryClient";

// Import the Dedwen logo
import dedwenLogo from "../assets/d3-black-logo.png";

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
      
      // Clear any cookies that might be auth-related
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        // Only attempt to clear cookies that might be auth related
        if (name.includes('token') || name.includes('auth') || name.includes('session') || name.includes('sid')) {
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=Strict;`;
        }
      }
      
      // Force browser history manipulation to prevent back-button issues
      if (typeof window.history.pushState === 'function') {
        window.history.pushState(null, '', window.location.pathname);
        window.addEventListener('popstate', () => {
          // If user tries to go back, redirect to home
          setLocation('/');
        }, { once: true });
      }
      
      console.log('Logout success page: Applied comprehensive security and anti-caching measures');
    } catch (e) {
      console.error('Error during logout security cleanup:', e);
    }
    
    // Clean up function to remove meta tags when component unmounts
    return () => {
      try {
        addedMetaTags.forEach(tag => {
          document.head.removeChild(tag);
        });
      } catch (e) {
        console.error('Failed to remove meta tags:', e);
      }
    };
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 bg-gradient-to-b from-white to-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow-xl"
      >
        <div className="flex justify-center">
          <img 
            src={dedwenLogo} 
            alt="Dedwen Logo" 
            className="h-48 mb-6" /* Increased from h-16 (4rem/64px) to h-48 (12rem/192px) - 3x bigger */
          />
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            You have successfully logged out
          </h1>
          
          <p className="text-gray-600">
            Thank you for choosing our platform! We look forward to seeing you again soon.
          </p>
          
          <div className="pt-4">
            <Button 
              asChild
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              <Link href="/auth">
                Sign in again
              </Link>
            </Button>
          </div>
          
          <div className="pt-2">
            <Button 
              asChild
              variant="outline" 
              className="w-full"
            >
              <Link href="/">
                Back to home
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Questions or concerns?{' '}
          <Link href="/contact" className="text-blue-500 hover:underline">
            contact us
          </Link>
        </p>
      </div>
    </div>
  );
}