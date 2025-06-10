import AIInsights from "@/components/social/AIInsights";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function SocialInsightsPage() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect to auth page if user is not logged in
  if (!isLoading && !user) {
    setLocation("/auth");
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto py-6 px-4 md:px-6">
      <AIInsights />
    </div>
  );
}