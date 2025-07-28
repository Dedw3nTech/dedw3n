import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { clearLogoutState } from "@/utils/unified-logout-system";

// Import the Dedwen logo
const newDedwenLogo = "/attached_assets/Dedw3n Logo_1749096270700.png";

export default function LogoutSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Instant page setup - no blocking operations
    document.title = 'You have successfully logged out';
    
    // Minimal back button handling
    const handlePopState = () => setLocation('/');
    window.addEventListener('popstate', handlePopState, { once: true });
    
    // Fast 10-second auto-clear for quicker re-login
    const clearTimer = setTimeout(() => {
      clearLogoutState();
      console.log('Logout state auto-cleared after timeout');
    }, 10000);
    
    console.log('Logout success page: Instant load complete');
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(clearTimer);
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