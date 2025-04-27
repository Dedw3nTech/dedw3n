import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Video,
  BarChart2,
  Users,
  Activity,
  Lock,
} from "lucide-react";

export default function SocialNav() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Get unread message count
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user,
  });

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Navigate to a location and close the dropdown
  const navigateTo = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  return (
    <div className="relative flex-1" ref={menuRef}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="w-full py-4 text-center font-medium text-sm focus:outline-none text-gray-600 hover:text-primary relative"
          >
            <i className="ri-group-line mr-1"></i> Social
            {messageData && messageData.count > 0 && (
              <Badge className="absolute top-1 right-1/4 w-4 h-4 p-0 flex items-center justify-center">
                {messageData.count}
              </Badge>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mt-1" align="center">
          <DropdownMenuLabel>Social Features</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => navigateTo("/social")}>
            <Users className="mr-2 h-4 w-4" />
            <span>Social Feed</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigateTo("/messages")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Messages</span>
            {messageData && messageData.count > 0 && (
              <Badge variant="secondary" className="ml-auto w-5 h-5 p-0 flex items-center justify-center">
                {messageData.count}
              </Badge>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigateTo("/videos/trending")}>
            <Video className="mr-2 h-4 w-4" />
            <span>Videos</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Creator Tools</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => navigateTo("/social-console")} disabled={!user?.isVendor}>
            <BarChart2 className="mr-2 h-4 w-4" />
            <span>Social+ Console</span>
            {!user?.isVendor && (
              <Lock className="ml-auto h-4 w-4 text-muted-foreground" />
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigateTo("/premium-videos")}>
            <Activity className="mr-2 h-4 w-4" />
            <span>Premium Content</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}