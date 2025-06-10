import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useMemo } from "react";

export default function SocialNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Master Translation System - SocialNav (1 text)
  const socialNavTexts = useMemo(() => [
    "Community"
  ], []);

  const { translations } = useMasterBatchTranslation(socialNavTexts, 'normal');
  const [communityText] = translations || socialNavTexts;
  
  // Get unread message count
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user,
  });

  // Check if current page is social-related
  const isSocialActive = location === '/social' || location === '/wall' || location === '/explore' || location === '/messages' || location.startsWith('/profile');

  return (
    <div className="flex-1">
      <div
        className={`w-full py-4 text-center text-sm relative cursor-pointer ${isSocialActive ? 'text-black font-bold border-b-2 border-black' : 'text-gray-600 font-medium hover:text-primary'}`}
        onClick={() => setLocation("/wall")}
      >
        <i className="ri-group-line mr-1"></i> {communityText}
        {messageData && messageData.count > 0 && (
          <Badge className="absolute top-1 right-1/4 w-4 h-4 p-0 flex items-center justify-center">
            {messageData.count}
          </Badge>
        )}
      </div>
    </div>
  );
}