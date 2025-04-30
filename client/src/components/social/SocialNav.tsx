import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export default function SocialNav() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Get unread message count
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user,
  });

  return (
    <div className="flex-1">
      <button
        className="w-full py-4 text-center font-medium text-sm focus:outline-none text-gray-600 hover:text-primary relative"
        onClick={() => setLocation("/social")}
      >
        <i className="ri-group-line mr-1"></i> Social
        {messageData && messageData.count > 0 && (
          <Badge className="absolute top-1 right-1/4 w-4 h-4 p-0 flex items-center justify-center">
            {messageData.count}
          </Badge>
        )}
      </button>
    </div>
  );
}