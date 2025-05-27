import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, LogIn, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface LoginPopupProps {
  delay?: number; // Delay in milliseconds before showing popup
}

export function LoginPopup({ delay = 5000 }: LoginPopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Don't show popup if user is already logged in or has dismissed it
    if (user || dismissed) return;

    const timer = setTimeout(() => {
      setShowPopup(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, user, dismissed]);

  const handleDismiss = () => {
    setShowPopup(false);
    setDismissed(true);
  };

  // Don't render if user is logged in
  if (user) return null;

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-md p-6 bg-white shadow-xl border-0">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-gray-100"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Content */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <LogIn className="h-8 w-8 text-blue-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900">
                  Join Our Community
                </h2>
                
                <p className="text-gray-600">
                  Sign in to unlock all features including posting, messaging, and personalized content.
                </p>

                <div className="space-y-3 pt-4">
                  <Button asChild className="w-full bg-black hover:bg-gray-900 text-white">
                    <Link href="/auth?mode=signin" onClick={handleDismiss}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                    <Link href="/auth?mode=signup" onClick={handleDismiss}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Account
                    </Link>
                  </Button>
                </div>

                <p className="text-xs text-gray-500 pt-2">
                  Continue browsing without an account or sign in for the full experience.
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}