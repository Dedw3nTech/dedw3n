import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function SocialNav() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get unread message count
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user,
  });

  return (
    <div className="flex-1">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-full py-4 text-center font-medium text-sm focus:outline-none text-gray-600 hover:text-primary relative"
            onClick={() => {
              // If clicking directly, navigate to social page
              if (!isOpen) {
                setLocation("/social");
              }
            }}
          >
            <i className="ri-group-line mr-1"></i> Social
            {messageData && messageData.count > 0 && (
              <Badge className="absolute top-1 right-1/4 w-4 h-4 p-0 flex items-center justify-center">
                {messageData.count}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="center">
          <div className="p-2 text-center">
            <p className="text-sm">View your social feed and stay connected with friends.</p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}