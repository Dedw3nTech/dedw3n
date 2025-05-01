import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Import the Dedwen logo
import dedwenLogo from "@assets/WHITE BG DEDWEN LOGO (320 x 132 px).png";

export default function LogoutSuccess() {
  useEffect(() => {
    // Force page title to be exactly as requested
    document.title = 'Log out success';
    
    // Force clear any caches
    const metaCache = document.createElement('meta');
    metaCache.httpEquiv = 'Cache-Control';
    metaCache.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(metaCache);
    
    const metaPragma = document.createElement('meta');
    metaPragma.httpEquiv = 'Pragma';
    metaPragma.content = 'no-cache';
    document.head.appendChild(metaPragma);
    
    const metaExpires = document.createElement('meta');
    metaExpires.httpEquiv = 'Expires';
    metaExpires.content = '0';
    document.head.appendChild(metaExpires);
    
    // Clear localStorage translations if they exist
    try {
      localStorage.removeItem('i18nextLng');
    } catch (e) {
      console.error('Failed to remove i18nextLng from localStorage:', e);
    }
    
    // Clean up function to remove meta tags when component unmounts
    return () => {
      try {
        document.head.removeChild(metaCache);
        document.head.removeChild(metaPragma);
        document.head.removeChild(metaExpires);
      } catch (e) {
        console.error('Failed to remove meta tags:', e);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 bg-gradient-to-b from-white to-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl"
      >
        <div className="flex justify-center">
          <img 
            src={dedwenLogo} 
            alt="Dedwen Logo" 
            className="h-16 mb-6"
          />
        </div>
        
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-10 w-10 text-green-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Log out success
          </h1>
          
          <p className="text-gray-600">
            Together for a prosperious and green planet
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