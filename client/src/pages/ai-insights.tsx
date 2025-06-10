import AIInsights from "@/components/social/AIInsights";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AIInsightsPage() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="container py-10 max-w-screen-xl mx-auto">
      <AIInsights />
    </div>
  );
}