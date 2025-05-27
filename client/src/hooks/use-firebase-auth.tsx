import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Only run if Firebase is configured
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setLoading(false);
      return;
    }

    const handleRedirectResult = async () => {
      try {
        const { handleGoogleRedirect, auth } = await import("@/lib/firebase");
        const result = await handleGoogleRedirect();
        
        if (result?.user) {
          const firebaseUser: FirebaseUser = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          };
          
          setUser(firebaseUser);
          
          // Here you would typically send the Firebase user to your backend
          // to create or update the user in your database
          console.log("Firebase user authenticated:", firebaseUser);
          
          toast({
            title: "Welcome!",
            description: `Successfully signed in as ${firebaseUser.displayName || firebaseUser.email}`,
          });
          
          // Redirect to dashboard or main page
          setLocation("/community");
        }
      } catch (error) {
        console.error("Error handling redirect:", error);
        toast({
          title: "Authentication Error",
          description: "There was an error completing your sign-in. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    handleRedirectResult();
  }, [toast, setLocation]);

  const signOut = async () => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) return;
    
    try {
      const { signOutUser } = await import("@/lib/firebase");
      await signOutUser();
      setUser(null);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      setLocation("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign Out Error",
        description: "There was an error signing you out.",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}