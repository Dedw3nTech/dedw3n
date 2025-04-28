import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import { 
  TwitterIcon, 
  FacebookIcon, 
  InstagramIcon, 
  LinkedinIcon
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// Social media integration API class
class SocialMediaIntegration {
  private apiKeys: Record<string, string> = {};
  private connected: Record<string, boolean> = {
    facebook: false,
    twitter: false,
    instagram: false,
    linkedin: false
  };

  constructor() {
    // Check for stored connections in localStorage
    this.loadConnectionStatus();
  }

  private loadConnectionStatus() {
    try {
      const storedStatus = localStorage.getItem('socialConnectionStatus');
      if (storedStatus) {
        this.connected = JSON.parse(storedStatus);
      }
    } catch (error) {
      console.error("Failed to load social connection status:", error);
    }
  }

  private saveConnectionStatus() {
    try {
      localStorage.setItem('socialConnectionStatus', JSON.stringify(this.connected));
    } catch (error) {
      console.error("Failed to save social connection status:", error);
    }
  }

  public setApiKey(platform: string, key: string) {
    this.apiKeys[platform] = key;
  }

  public isConnected(platform: string): boolean {
    return this.connected[platform] || false;
  }

  public connect(platform: string): Promise<boolean> {
    // Simulate API connection (in real implementation, this would call actual API)
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected[platform] = true;
        this.saveConnectionStatus();
        resolve(true);
      }, 500);
    });
  }

  public disconnect(platform: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected[platform] = false;
        this.saveConnectionStatus();
        resolve(true);
      }, 500);
    });
  }

  public async getStats(platform: string): Promise<Record<string, number>> {
    // In real implementation, this would fetch actual stats from the social media API
    if (!this.connected[platform]) {
      throw new Error(`${platform} not connected`);
    }

    // Simulated stats
    const stats = {
      followers: Math.floor(Math.random() * 10000),
      following: Math.floor(Math.random() * 1000),
      posts: Math.floor(Math.random() * 500),
      engagement: Math.floor(Math.random() * 100) / 10
    };

    return stats;
  }

  public async publishToSocial(
    platform: string, 
    content: { text: string, media?: string[] }
  ): Promise<boolean> {
    if (!this.connected[platform]) {
      throw new Error(`${platform} not connected`);
    }
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Published to ${platform}:`, content);
        resolve(true);
      }, 1000);
    });
  }
}

// Initialize the social media integration singleton
const socialMedia = new SocialMediaIntegration();

export default function SocialNav() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  
  // Get unread message count
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user,
  });

  // Load connected platforms on component mount
  useEffect(() => {
    const platforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
    const connected = platforms.filter(p => socialMedia.isConnected(p));
    setConnectedPlatforms(connected);
  }, []);

  const handleConnect = async (platform: string) => {
    try {
      await socialMedia.connect(platform);
      setConnectedPlatforms(prev => [...prev, platform]);
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      await socialMedia.disconnect(platform);
      setConnectedPlatforms(prev => prev.filter(p => p !== platform));
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <FacebookIcon className="h-4 w-4 mr-2" />;
      case 'twitter':
        return <TwitterIcon className="h-4 w-4 mr-2" />;
      case 'instagram':
        return <InstagramIcon className="h-4 w-4 mr-2" />;
      case 'linkedin':
        return <LinkedinIcon className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };
  
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'twitter':
        return 'bg-sky-500 text-white hover:bg-sky-600';
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600';
      case 'linkedin':
        return 'bg-blue-700 text-white hover:bg-blue-800';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

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
            {connectedPlatforms.length > 0 && (
              <Badge variant="outline" className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-primary text-white">
                {connectedPlatforms.length}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="center">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold mb-2">Social Media Accounts</h3>
            
            {['facebook', 'twitter', 'instagram', 'linkedin'].map(platform => (
              <div key={platform} className="flex items-center justify-between">
                <div className="flex items-center">
                  {getPlatformIcon(platform)}
                  <span className="text-sm capitalize">{platform}</span>
                </div>
                {connectedPlatforms.includes(platform) ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => handleDisconnect(platform)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className={`h-7 text-xs ${getPlatformColor(platform)}`}
                    onClick={() => handleConnect(platform)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            ))}
            
            <div className="pt-2 border-t mt-2">
              <Button 
                variant="default" 
                className="w-full text-xs" 
                onClick={() => setLocation("/social-console")}
              >
                Manage Social Media
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}