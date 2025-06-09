import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { clearLogoutState } from "@/utils/unified-logout-system";

// Import the Dedwen logo
import newDedwenLogo from "@assets/Dedw3n Logo_1749096270700.png";

export default function LogoutSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Set page title
    document.title = 'You have successfully logged out';
    
    // Set anti-caching headers
    const metaTags = [
      { httpEquiv: 'Cache-Control', content: 'no-cache, no-store, must-revalidate, private' },
      { httpEquiv: 'Pragma', content: 'no-cache' },
      { httpEquiv: 'Expires', content: '0' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
    ];
    
    const addedMetaTags = metaTags.map(tagProps => {
      const metaTag = document.createElement('meta');
      Object.entries(tagProps).forEach(([key, value]) => {
        metaTag.setAttribute(key, value);
      });
      document.head.appendChild(metaTag);
      return metaTag;
    });
    
    // Handle browser back button
    const handlePopState = () => setLocation('/');
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    
    // Auto-clear logout state after 60 seconds to allow fresh logins
    const clearTimer = setTimeout(() => {
      clearLogoutState();
      console.log('Logout state auto-cleared after timeout');
    }, 60000);
    
    console.log('Logout success page: Security measures applied');
    
    // Cleanup
    return () => {
      try {
        addedMetaTags.forEach(tag => {
          if (tag.parentNode) {
            document.head.removeChild(tag);
          }
        });
        window.removeEventListener('popstate', handlePopState);
        clearTimeout(clearTimer);
      } catch (e) {
        console.error('Cleanup error:', e);
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